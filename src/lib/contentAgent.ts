/**
 * ContentAgent: Generates personalized magical content (songs, videos)
 * Uses Grok-4 for lyric/script creation, mocks external APIs (Suno, LTX Studio, Klangio)
 * Integrates with LangGraph for stateful orchestration
 */

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { grokLLM } from "@/lib/grokIntegration";
import { runWithRecursion } from "@/lib/agents/agentRecursion";
import { evaluateTextQuality } from "@/lib/agents/recursionEvaluators";

const isProd = process.env.NODE_ENV === "production";
const debugLog = (...args: unknown[]) => {
  if (!isProd) {
    console.log(...args);
  }
};

export interface MagicQuestionnaire {
  occasion: "birthday" | "anniversary" | "reunion" | "proposal" | "celebration";
  recipientName: string;
  giftYouName: string;
  keyMemories?: string[];
  favoriteColors?: string[];
  favoriteSongsArtists?: string[];
  message?: string;
  musicStyle: "tropical" | "edm" | "reggae" | "calypso" | "ambient";
  mood: "romantic" | "energetic" | "peaceful" | "celebratory";
}

export interface ContentGenerationRequest {
  userId: string;
  reservationId?: string;
  contentType: "song" | "video" | "audio_remix";
  questionnaire: MagicQuestionnaire;
}

export interface GeneratedContent {
  type: "song" | "video" | "audio_remix";
  title: string;
  description: string;
  mediaUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  provider: string;
  prompt: string;
  processingTimeMs: number;
}

// LangGraph State
interface ContentGenState {
  userId: string;
  contentType: "song" | "video" | "audio_remix";
  questionnaire: MagicQuestionnaire;
  refinementHint?: string;
  grokPrompt: string;
  grokLyrics: string;
  sunoAudioUrl: string;
  ltxVideoUrl: string;
  klangioRemix: string;
  mergedMediaUrl: string;
  status: "pending" | "generating_lyrics" | "generating_audio" | "generating_video" | "merging" | "completed" | "failed";
  error?: string;
  processingTimeMs: number;
}

const ContentGenAnnotation = Annotation.Root({
  userId: Annotation<string>,
  contentType: Annotation<"song" | "video" | "audio_remix">,
  questionnaire: Annotation<MagicQuestionnaire>,
  refinementHint: Annotation<string | undefined>,
  grokPrompt: Annotation<string>,
  grokLyrics: Annotation<string>,
  sunoAudioUrl: Annotation<string>,
  ltxVideoUrl: Annotation<string>,
  klangioRemix: Annotation<string>,
  mergedMediaUrl: Annotation<string>,
  status: Annotation<
    "pending" | "generating_lyrics" | "generating_audio" | "generating_video" | "merging" | "completed" | "failed"
  >,
  error: Annotation<string | undefined>,
  processingTimeMs: Annotation<number>,
});

/**
 * Step 1: Build Grok prompt from questionnaire
 */
async function buildGrokPrompt(state: typeof ContentGenAnnotation.State) {
  const { questionnaire, contentType } = state;
  const refinement = state.refinementHint ? `\nRefinement: ${state.refinementHint}` : "";

  const prompt = `Create a personalized ${questionnaire.musicStyle} ${contentType} for a ${questionnaire.occasion}.

Recipient: ${questionnaire.recipientName}
Gift from: ${questionnaire.giftYouName}
Mood: ${questionnaire.mood}
Music Style: ${questionnaire.musicStyle}

${questionnaire.keyMemories ? `Key Memories: ${questionnaire.keyMemories.join(", ")}` : ""}
${questionnaire.favoriteColors ? `Favorite Colors: ${questionnaire.favoriteColors.join(", ")}` : ""}
${questionnaire.favoriteSongsArtists ? `Favorite Artists: ${questionnaire.favoriteSongsArtists.join(", ")}` : ""}
${questionnaire.message ? `Personal Message: "${questionnaire.message}"` : ""}

${contentType === "song" ? `Create lyrics with the mantra "The Magic is You" woven throughout. Include Maya wisdom and kundalini energy themes. Structure: Verse 1 → Chorus → Verse 2 → Bridge → Chorus → Outro.` : ""}

${contentType === "video" ? `Create a script for a 60-90 second video. Include scene descriptions, timing, and voiceover elements.` : ""}

${contentType === "audio_remix" ? `Create an ambient remix description with binaural beats, frequency suggestions, and emotional journey arc.` : ""}

Make it magical, personal, and uplifting. Maximum 500 words.${refinement}`;

  debugLog(`[ContentAgent] Building Grok prompt for ${contentType}`);

  return {
    ...state,
    grokPrompt: prompt,
    status: "generating_lyrics",
  };
}

/**
 * Step 2: Call Grok-4 to generate lyrics/script
 */
async function generateLyricsWithGrok(state: typeof ContentGenAnnotation.State) {
  try {
    debugLog(`[ContentAgent] Calling Grok-4 to generate lyrics/script...`);

    const response = await grokLLM.invoke([
      {
        role: "system",
        content:
          "You are a magical content creator specializing in personalized songs, videos, and audio experiences with Maya/kundalini themes.",
      },
      {
        role: "user",
        content: state.grokPrompt,
      },
    ]);

    const lyrics = typeof response.content === "string" ? response.content : String(response.content);

    debugLog(`[ContentAgent] ✅ Generated ${state.contentType} content with Grok`);

    return {
      ...state,
      grokLyrics: lyrics,
    };
  } catch (error) {
    console.error("[ContentAgent] Grok generation failed:", error);
    return {
      ...state,
      status: "failed",
      error: `Grok generation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Step 3: Generate audio via Suno API (mocked)
 */
async function generateAudioViaSuno(state: typeof ContentGenAnnotation.State) {
  if (state.contentType === "video") {
    debugLog("[ContentAgent] Skipping Suno for video-only generation");
    return { ...state, sunoAudioUrl: "" };
  }

  debugLog(`[ContentAgent] Calling Suno API to generate audio...`);

  try {
    // Mock Suno API response
    // In production, replace with real Suno API call using grokLyrics as input
    const mockAudioUrl = `https://supabase.storage.magic.content/audio/${state.userId}/${Date.now()}.mp3`;

    debugLog(`[ContentAgent] ✅ Generated audio via Suno: ${mockAudioUrl}`);

    return {
      ...state,
      sunoAudioUrl: mockAudioUrl,
      status: "generating_video",
    };
  } catch (error) {
    console.error("[ContentAgent] Suno generation failed:", error);
    return {
      ...state,
      status: "failed",
      error: `Suno audio generation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Step 4: Generate video via LTX Studio (mocked)
 */
async function generateVideoViaLTX(state: typeof ContentGenAnnotation.State) {
  if (state.contentType === "audio_remix" || state.contentType === "song" && !state.questionnaire.message) {
    debugLog("[ContentAgent] Skipping LTX Studio for audio-only generation");
    return { ...state, ltxVideoUrl: "" };
  }

  debugLog(`[ContentAgent] Calling LTX Studio to generate video...`);

  try {
    // Mock LTX Studio API response
    // In production, use resort stock footage from public/videos/ and grokLyrics as scene descriptions
    const mockVideoUrl = `https://supabase.storage.magic.content/video/${state.userId}/${Date.now()}.mp4`;

    debugLog(`[ContentAgent] ✅ Generated video via LTX Studio: ${mockVideoUrl}`);

    return {
      ...state,
      ltxVideoUrl: mockVideoUrl,
    };
  } catch (error) {
    console.error("[ContentAgent] LTX Studio generation failed:", error);
    return {
      ...state,
      status: "failed",
      error: `LTX Studio video generation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Step 5: Remix audio with Klangio (mocked)
 */
async function remixAudioWithKlangio(state: typeof ContentGenAnnotation.State) {
  if (!state.sunoAudioUrl) {
    debugLog("[ContentAgent] No audio to remix");
    return { ...state, klangioRemix: "" };
  }

  debugLog(`[ContentAgent] Calling Klangio to remix audio with ambient elements...`);

  try {
    // Mock Klangio API response
    // In production, apply binaural beats, kundalini activation frequencies, etc.
    const mockRemixUrl = `https://supabase.storage.magic.content/audio/${state.userId}/${Date.now()}-remix.mp3`;

    debugLog(`[ContentAgent] ✅ Created ambient remix via Klangio: ${mockRemixUrl}`);

    return {
      ...state,
      klangioRemix: mockRemixUrl,
      status: "merging",
    };
  } catch (error) {
    console.error("[ContentAgent] Klangio remix failed:", error);
    return {
      ...state,
      status: "failed",
      error: `Klangio remixing failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Step 6: Merge best formats and save to Supabase Storage
 */
async function mergeAndSave(state: typeof ContentGenAnnotation.State) {
  debugLog(`[ContentAgent] Merging and saving final ${state.contentType}...`);

  try {
    // Determine final media URL based on content type
    let finalUrl: string;

    if (state.contentType === "song" && state.klangioRemix) {
      // Prefer remixed audio for songs
      finalUrl = state.klangioRemix;
    } else if (state.contentType === "song" && state.sunoAudioUrl) {
      finalUrl = state.sunoAudioUrl;
    } else if (state.contentType === "video" && state.ltxVideoUrl) {
      finalUrl = state.ltxVideoUrl;
    } else if (state.contentType === "audio_remix" && state.klangioRemix) {
      finalUrl = state.klangioRemix;
    } else {
      throw new Error("No media generated to save");
    }

    debugLog(`[ContentAgent] ✅ Final media URL: ${finalUrl}`);

    return {
      ...state,
      mergedMediaUrl: finalUrl,
      status: "completed",
    };
  } catch (error) {
    console.error("[ContentAgent] Merge/save failed:", error);
    return {
      ...state,
      status: "failed",
      error: `Media merge/save failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Build the LangGraph for content generation
 */
async function buildContentGraph() {
  const workflow = new StateGraph(ContentGenAnnotation)
    .addNode("build_prompt", buildGrokPrompt)
    .addNode("grok_generation", generateLyricsWithGrok)
    .addNode("suno_audio", generateAudioViaSuno)
    .addNode("ltx_video", generateVideoViaLTX)
    .addNode("klangio_remix", remixAudioWithKlangio)
    .addNode("merge_save", mergeAndSave)
    .addEdge(START, "build_prompt")
    .addEdge("build_prompt", "grok_generation")
    .addEdge("grok_generation", "suno_audio")
    .addEdge("suno_audio", "ltx_video")
    .addEdge("ltx_video", "klangio_remix")
    .addEdge("klangio_remix", "merge_save")
    .addEdge("merge_save", END);

  return workflow.compile();
}

/**
 * Main export: Run content generation agent
 */
export async function runContentAgent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  debugLog(`\n✨ [ContentAgent] Generating ${request.contentType} for ${request.questionnaire.occasion}...`);

  const startTime = Date.now();
  const graph = await buildContentGraph();

  const initialState: typeof ContentGenAnnotation.State = {
    userId: request.userId,
    contentType: request.contentType,
    questionnaire: request.questionnaire,
    refinementHint: undefined,
    grokPrompt: "",
    grokLyrics: "",
    sunoAudioUrl: "",
    ltxVideoUrl: "",
    klangioRemix: "",
    mergedMediaUrl: "",
    status: "pending",
    error: undefined,
    processingTimeMs: 0,
  };

  const { result: finalState } = await runWithRecursion(
    async () => graph.invoke(initialState),
    async (state) => {
      const goal = "Produce a personalized magic experience with clear, uplifting tone.";
      const summary = `Status: ${state.status} Media: ${state.mergedMediaUrl || "pending"}`;
      const evalResult = await evaluateTextQuality(goal, summary);
      return { score: evalResult.score, feedback: evalResult.feedback, data: state };
    },
    async (state, feedback, iteration) => ({
      ...state,
      refinementHint: `Iteration ${iteration + 1}: ${feedback || "Tighten personalization."}`,
    })
  );

  if (finalState.status === "failed") {
    throw new Error(finalState.error || "Content generation failed");
  }

  const processingTime = Date.now() - startTime;

  const title = `${request.questionnaire.occasion
    .charAt(0)
    .toUpperCase()}${request.questionnaire.occasion.slice(1)} ${request.contentType} for ${request.questionnaire.recipientName}`;

  debugLog(`✅ [ContentAgent] Complete in ${processingTime}ms`);
  debugLog(`📢 [ContentAgent] Media URL: ${finalState.mergedMediaUrl}`);

  return {
    type: request.contentType,
    title,
    description: `Personalized ${request.contentType} created for ${request.questionnaire.occasion}`,
    mediaUrl: finalState.mergedMediaUrl,
    durationSeconds: request.contentType === "video" ? 90 : 180,
    fileSizeBytes: Math.floor(Math.random() * 10000000) + 5000000, // 5-15 MB mock
    provider: request.contentType === "song" ? "suno" : "ltx_studio",
    prompt: finalState.grokPrompt,
    processingTimeMs: processingTime,
  };
}

/**
 * Send download link email (stub - implement with SendGrid/Resend)
 */
export async function sendContentEmail(
  userEmail: string,
  mediaUrl: string,
  contentType: string,
  recipientName: string
): Promise<boolean> {
  try {
    debugLog(`[ContentAgent] Sending email to ${userEmail} with download link...`);

    // Mock email sending
    // In production, use SendGrid, Resend, or AWS SES
    debugLog(`✅ [ContentAgent] Email sent with ${contentType} download link`);

    return true;
  } catch (error) {
    console.error(`[ContentAgent] Email send failed:`, error);
    return false;
  }
}
