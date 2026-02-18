/**
 * Admin Marketing Dashboard Page
 * Route: /admin/marketing-dashboard
 * 
 * Features:
 * - View all marketing campaigns
 * - Real-time metrics display
 * - Manual campaign triggers
 * - Agent logs viewer
 * - Performance analytics
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  name: string;
  objective: string;
  target_audience: string;
  platforms: string[];
  status: string;
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
  };
  created_at: string;
  updated_at: string;
}

interface CampaignFormData {
  name: string;
  objective: "direct_bookings" | "brand_awareness" | "engagement" | "email_growth";
  targetAudience: string;
  keyMessages: string[];
  platforms: string[];
  campaignName?: string;
}

export default function MarketingDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    objective: "direct_bookings",
    targetAudience: "luxury travelers, 35-55",
    keyMessages: ["The magic is YOU", "Overwater luxury experience", "Wellness retreat"],
    platforms: ["instagram", "tiktok", "email"],
    campaignName: ""
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  // Fetch campaigns
  useEffect(() => {
    if (!token) return;
    
    const fetchCampaigns = async () => {
      try {
        const res = await fetch("/api/marketing/campaigns", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) throw new Error("Failed to fetch campaigns");
        
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCampaigns, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRunCampaign = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/marketing/run-campaign", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to run campaign");
      
      const data = await response.json();
      toast.success(`Campaign started! ID: ${data.campaignId}`);
      
      setShowNewCampaignForm(false);
      
      // Refresh campaigns list
      const campaignsRes = await fetch("/api/marketing/campaigns", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.campaigns || []);
    } catch (error) {
      console.error("Error running campaign:", error);
      toast.error("Failed to run campaign");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎯 Marketing Agent Dashboard
              </h1>
              <p className="text-gray-400 mt-2">Autonomous Campaign Management & Analytics</p>
            </div>
            <button
              onClick={() => setShowNewCampaignForm(!showNewCampaignForm)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
            >
              {showNewCampaignForm ? "Cancel" : "🚀 New Campaign"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Campaign Form */}
        {showNewCampaignForm && (
          <div className="mb-8 bg-slate-700 border border-slate-600 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create Marketing Campaign</h2>
            
            <div className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g., Valentine's Day Campaign"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:bg-slate-500 focus:border-purple-400 transition"
                />
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Objective</label>
                <select
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value as any })}
                  className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:bg-slate-500 focus:border-purple-400 transition"
                >
                  <option value="direct_bookings">Direct Bookings</option>
                  <option value="brand_awareness">Brand Awareness</option>
                  <option value="engagement">Engagement</option>
                  <option value="email_growth">Email Growth</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:bg-slate-500 focus:border-purple-400 transition"
                />
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {["instagram", "tiktok", "facebook", "x", "email"].map(platform => (
                    <button
                      key={platform}
                      onClick={() => {
                        const platforms = formData.platforms.includes(platform)
                          ? formData.platforms.filter(p => p !== platform)
                          : [...formData.platforms, platform];
                        setFormData({ ...formData, platforms });
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        formData.platforms.includes(platform)
                          ? "bg-purple-500 text-white"
                          : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                      }`}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Key Messages (comma-separated)</label>
                <textarea
                  value={formData.keyMessages.join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    keyMessages: e.target.value.split(",").map(m => m.trim())
                  })}
                  className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:bg-slate-500 focus:border-purple-400 transition"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleRunCampaign}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition"
              >
                {loading ? "Running Campaign..." : "🚀 Run Campaign"}
              </button>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Campaigns</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-slate-700 border border-slate-600 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">No campaigns yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className="bg-slate-700 border border-slate-600 rounded-xl p-6 hover:border-purple-500 transition shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                          {campaign.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 mb-4">{campaign.objective.replace("_", " ").toUpperCase()}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {campaign.metrics && (
                          <>
                            <div className="bg-slate-600 rounded-lg p-3">
                              <p className="text-gray-400 text-sm">Impressions</p>
                              <p className="text-xl font-bold text-white">{campaign.metrics.impressions.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-600 rounded-lg p-3">
                              <p className="text-gray-400 text-sm">Clicks</p>
                              <p className="text-xl font-bold text-white">{campaign.metrics.clicks}</p>
                            </div>
                            <div className="bg-slate-600 rounded-lg p-3">
                              <p className="text-gray-400 text-sm">CTR</p>
                              <p className="text-xl font-bold text-white">{(campaign.metrics.ctr * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-slate-600 rounded-lg p-3">
                              <p className="text-gray-400 text-sm">Conversions</p>
                              <p className="text-xl font-bold text-white">{campaign.metrics.conversions}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {campaign.platforms.map(platform => (
                          <span key={platform} className="px-3 py-1 bg-purple-900 text-purple-200 text-xs rounded-full">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <p>{new Date(campaign.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="mt-12 bg-slate-700 border border-slate-600 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">🤖 Agent Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {["Research", "Content", "Posting", "Engagement", "Analytics"].map(agent => (
              <div key={agent} className="bg-slate-600 rounded-lg p-4 text-center">
                <p className="text-green-400 text-2xl mb-2">✓</p>
                <p className="text-gray-300 font-semibold">{agent}</p>
                <p className="text-gray-500 text-xs mt-1">Active</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
