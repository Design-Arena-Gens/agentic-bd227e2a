import { NextRequest } from "next/server";
import { z } from "zod";

const ReelRequestSchema = z.object({
  topic: z.string().min(3),
  platform: z.string().default("instagram"),
  tone: z.string().default("cinematic"),
  length: z.string().default("30"),
  voice: z.string().default("warm"),
  callToAction: z.string().optional(),
  audience: z.string().default("general"),
  autopilot: z.boolean().default(true),
  brandColor: z.string().optional()
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof ReelRequestSchema>;
  try {
    const json = await request.json();
    payload = ReelRequestSchema.parse(json);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Invalid request payload",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const targetDuration = (() => {
    const numeric = Number.parseInt(payload.length, 10);
    if (Number.isNaN(numeric)) return 45;
    return Math.min(Math.max(numeric, 15), 120);
  })();

  const { topic, platform, tone, voice, callToAction, audience, brandColor } = payload;

  const segments = buildTimeline(topic, targetDuration, tone, platform);
  const script = buildScript(topic, tone, audience, callToAction);
  const overlays = buildOverlayPlan(topic, platform, brandColor);
  const voicePlan = buildVoicePlan(voice, tone, audience);

  const eventSequence = [
    {
      type: "status",
      id: "briefing",
      stage: "Creative Brief Intake",
      agent: "Director AI",
      detail: `Synced on goal-driven narrative for ${platform} reels.`,
      progress: 0.08,
      eta: 90
    },
    {
      type: "status",
      id: "ideation",
      stage: "Narrative Engine",
      agent: "StoryCrafter",
      detail: `Drafting multi-beat storyline themed around “${topic}”.`,
      progress: 0.24,
      eta: 75
    },
    {
      type: "asset",
      id: "script",
      artifact: "script",
      title: "AI Script Draft v1",
      content: script,
      progress: 0.42,
      agent: "StoryCrafter"
    },
    {
      type: "status",
      id: "shotlist",
      stage: "Visual Sequencer",
      agent: "VisionGrid",
      detail: "Mapping hero shots, transitions, and overlays for pacing.",
      progress: 0.58,
      eta: 60
    },
    {
      type: "timeline",
      id: "timeline",
      segments,
      progress: 0.7,
      agent: "VisionGrid"
    },
    {
      type: "status",
      id: "voice",
      stage: "Voice Design",
      agent: "EchoSynth",
      detail: `Modeling ${voice} vocal profile with ${tone} energy.`,
      progress: 0.82,
      eta: 45
    },
    {
      type: "asset",
      id: "voice-plan",
      artifact: "voicePlan",
      title: "Voiceover Production Map",
      content: voicePlan,
      progress: 0.9,
      agent: "EchoSynth"
    },
    {
      type: "asset",
      id: "overlay-plan",
      artifact: "overlays",
      title: "On-screen Overlay Strategy",
      content: overlays,
      progress: 0.94,
      agent: "VisionGrid"
    },
    {
      type: "status",
      id: "render",
      stage: "Real-Time Render Orchestration",
      agent: "PipelineOps",
      detail: "Coordinating camera moves, audio mix, and color matrix.",
      progress: 0.98,
      eta: 20
    },
    {
      type: "result",
      id: "delivery",
      agent: "Director AI",
      progress: 1,
      deliverables: {
        topic,
        platform,
        duration: targetDuration,
        callToAction,
        script,
        overlays,
        segments,
        voicePlan
      }
    }
  ] as const;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const event of eventSequence) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        await delay(450);
      }
      controller.close();
    },
    cancel() {
      // Intentionally empty, stream will just stop.
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked"
    }
  });
}

function buildTimeline(topic: string, duration: number, tone: string, platform: string) {
  const beatPercents = [0.18, 0.24, 0.2, 0.2, 0.18];
  let cursor = 0;

  return beatPercents.map((pct, index) => {
    const isLast = index === beatPercents.length - 1;
    let segmentDuration = isLast
      ? Math.max(duration - cursor, 3)
      : Math.max(3, Math.floor(duration * pct));
    if (!isLast && cursor + segmentDuration >= duration) {
      segmentDuration = Math.max(3, duration - cursor - 3);
    }
    const segment = {
      id: `segment-${index + 1}`,
      label: getLabel(index),
      start: cursor,
      duration: segmentDuration,
      description: getDescription(index, topic, tone, platform)
    };
    cursor += segmentDuration;
    return segment;
  });
}

function getLabel(index: number) {
  return ["Hook", "Pain Point", "Transformation", "Proof", "CTA"][index] ?? `Beat ${index + 1}`;
}

function getDescription(index: number, topic: string, tone: string, platform: string) {
  const templates = [
    `Open with an arresting motion graphic that telegraphs the promise around ${topic}.`,
    `Amplify the audience problem with kinetic captions tailored for ${platform}.`,
    `Reveal the transformation anchored by ${topic} using ${tone} pacing.`,
    `Show tactile proof clips with split-screen receipts and animated UI.` ,
    `Deliver the CTA with punchy supers and looping background energy.`
  ];
  return templates[index] ?? "Drive momentum into the next beat.";
}

function buildScript(topic: string, tone: string, audience: string, callToAction?: string) {
  const cta = callToAction ?? `Tap to explore ${topic} today.`;
  return [
    `HOOK: Imagine ${audience} witnessing ${topic} unfold in under 30 seconds.`,
    "PAIN: You're losing attention within the first 2 seconds — that ends now.",
    `TRANSFORMATION: We stack motion, color, and story into a ${tone} reel that auto-adapts in real time.`,
    "PROOF: Live data visuals, testimonial flashes, and hero product macros keep retention high.",
    `CTA: ${cta}`
  ].join("\n\n");
}

function buildOverlayPlan(topic: string, platform: string, brandColor?: string) {
  return [
    `• Gradient wash using ${brandColor ?? "#7f5af0"} to match ${platform} chroma.`,
    "• Dynamic caption blocks driven by speech-to-text latency under 80ms.",
    `• Sidecar frame featuring live metrics relevant to ${topic}.`,
    "• End-frame sticker with adaptive sizing for vertical safe zones."
  ].join("\n");
}

function buildVoicePlan(voice: string, tone: string, audience: string) {
  return [
    `• Register: ${voice} with ${tone} pacing.`,
    `• Inflections target ${audience} attention spikes on seconds 0-3, 12, and 22.`,
    "• Breath map inserted to sync with beat-based cut rhythm.",
    "• Dual-track render for automatic ducking under SFX beds."
  ].join("\n");
}
