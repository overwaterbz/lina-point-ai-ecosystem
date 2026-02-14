"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import toast from "react-hot-toast";

const supabaseClient = createBrowserSupabaseClient();

interface MagicContent {
  id: string;
  reservation_id: string;
  occasion: string;
  genre: string;
  song_url: string;
  video_url: string;
  artwork_url: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string;
  user_prefs: Record<string, any>;
  created_at: string;
}

export default function MagicPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [contents, setContents] = useState<MagicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMagicContent();
  }, [user]);

  const fetchMagicContent = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/magic/list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch content");

      const data = await response.json();
      setContents(data.contents || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load magic content");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    // Redirect to booking flow with magic add-on
    // In production, this would be: router.push("/booking?addon=magic");
    toast.success("Add 'Magic' to your booking to generate personalized content!");
  };

  const downloadFile = (url: string, filename: string) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ✨ Your Magic Moments
            </h1>
            <p className="text-lg text-gray-600">
              Personalized songs and videos celebrating your Lina Point experience
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : contents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Magic Content Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Add the "Magic" add-on to your next booking to generate a personalized
                song and video celebrating your special moment.
              </p>
              <button
                onClick={handleGenerateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Book with Magic ✨
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {/* Artwork */}
                  {content.artwork_url && (
                    <div className="relative pb-full bg-gradient-to-br from-purple-200 to-indigo-300 h-48">
                      <img
                        src={content.artwork_url}
                        alt={content.occasion}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Content Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {content.occasion} Celebration
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {content.genre}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          content.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : content.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {content.status}
                      </span>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-500 mb-4">
                      Created {new Date(content.created_at).toLocaleDateString()}
                    </p>

                    {/* Status Messages */}
                    {content.status === "failed" && content.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                        <p className="text-sm text-red-800">{content.error_message}</p>
                      </div>
                    )}

                    {content.status === "completed" && (
                      <div className="space-y-2">
                        {/* Song Player */}
                        {content.song_url && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🎵 Your Song
                            </label>
                            <audio
                              controls
                              className="w-full"
                              src={content.song_url}
                            >
                              Your browser does not support audio playback
                            </audio>
                            <button
                              onClick={() => downloadFile(content.song_url, `${content.occasion}.mp3`)}
                              className="mt-2 w-full px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium transition"
                            >
                              ⬇ Download Song
                            </button>
                          </div>
                        )}

                        {/* Video Player */}
                        {content.video_url && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              🎬 Your Video
                            </label>
                            <video
                              controls
                              className="w-full rounded bg-black"
                              src={content.video_url}
                            >
                              Your browser does not support video playback
                            </video>
                            <button
                              onClick={() => downloadFile(content.video_url, `${content.occasion}.mp4`)}
                              className="mt-2 w-full px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm font-medium transition"
                            >
                              ⬇ Download Video
                            </button>
                          </div>
                        )}

                        {/* Share Buttons */}
                        <div className="pt-2 border-t border-gray-200 flex gap-2">
                          <button
                            onClick={() => {
                              navigator.share?.({
                                title: `${content.occasion} Celebration`,
                                text: "Check out my personalized magic content from Lina Point!",
                                url: content.song_url,
                              });
                            }}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition"
                          >
                            Share 📤
                          </button>
                        </div>
                      </div>
                    )}

                    {(content.status === "pending" || content.status === "processing") && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
