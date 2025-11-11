"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Mic, PlayCircle, Radio, Sparkles } from "lucide-react";
import { formatSeconds, getSegmentColor } from "../lib/utils";

type TimelineSegment = {
  id: string;
  label: string;
  start: number;
  duration: number;
  description: string;
};

type StatusEvent = {
  id: string;
  stage: string;
  detail: string;
  agent: string;
  progress: number;
  eta?: number;
};

type AssetEvent = {
  id: string;
  artifact: "script" | "voicePlan" | "overlays";
  title: string;
  content: string;
  agent: string;
  progress: number;
};

type ResultEvent = {
  topic: string;
  platform: string;
  duration: number;
  callToAction?: string;
  script: string;
  overlays: string;
  segments: TimelineSegment[];
  voicePlan: string;
};

type StreamPayload =
  | ({ type: "status" } & StatusEvent)
  | ({ type: "asset" } & AssetEvent)
  | ({ type: "timeline"; progress: number; agent: string } & {
      id: string;
      segments: TimelineSegment[];
    })
  | ({ type: "result"; progress: number; agent: string } & {
      id: string;
      deliverables: ResultEvent;
    });

type FormState = {
  topic: string;
  tone: string;
  length: string;
  platform: string;
  voice: string;
  callToAction: string;
  audience: string;
  brandColor: string;
  autopilot: boolean;
};

const INITIAL_FORM: FormState = {
  topic: "AI studio launch teaser",
  tone: "cinematic",
  length: "45",
  platform: "instagram",
  voice: "velvet baritone",
  callToAction: "Swipe to unlock your personal AI production crew.",
  audience: "creators and founders",
  brandColor: "#7f5af0",
  autopilot: true
};

export default function HomePage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [statusFeed, setStatusFeed] = useState<StatusEvent[]>([]);
  const [assetVault, setAssetVault] = useState<Record<string, AssetEvent>>({});
  const [segments, setSegments] = useState<TimelineSegment[]>([]);
  const [result, setResult] = useState<ResultEvent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalDuration = useMemo(
    () =>
      segments.reduce((acc, seg) => {
        const end = seg.start + seg.duration;
        return end > acc ? end : acc;
      }, 0),
    [segments]
  );

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleGenerate = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setStatusFeed([]);
      setSegments([]);
      setAssetVault({});
      setResult(null);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });

        if (!response.body) {
          throw new Error("Streaming channel unavailable.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const payload = JSON.parse(line) as StreamPayload;
            setProgress((prev) => Math.max(prev, payload.progress ?? prev));

            if (payload.type === "status") {
              setStatusFeed((prev) => [...prev, payload]);
            } else if (payload.type === "asset") {
              setAssetVault((prev) => ({ ...prev, [payload.artifact]: payload }));
            } else if (payload.type === "timeline") {
              setSegments(payload.segments);
            } else if (payload.type === "result") {
              setResult(payload.deliverables);
              setProgress(1);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsGenerating(false);
      }
    },
    [form]
  );

  const progressionLabel = useMemo(() => {
    if (progress >= 1) return "Render ready";
    if (progress >= 0.75) return "Rendering & assembly";
    if (progress >= 0.5) return "Visual design underway";
    if (progress > 0) return "Creative engines ignited";
    return "Idle";
  }, [progress]);

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(127,90,240,0.25),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(61,169,252,0.12),_transparent_70%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-12 px-6 pb-20 pt-16 lg:px-12">
        <header className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm uppercase tracking-[0.25em] text-white/70">
            <Sparkles className="h-4 w-4 text-accent" />
            Real-time reel automation
          </span>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
              Forge cinematic reels while AI agents orchestrate every beat.
            </h1>
            <p className="text-lg text-white/70 md:text-xl">
              Feed the mission and watch Director AI, StoryCrafter, VisionGrid, and
              EchoSynth collaborate live to craft a high-retention reel pipeline.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Radio className="h-4 w-4 text-accent" />
              Live agent telemetry
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Mic className="h-4 w-4 text-accent" />
              Voice design automation
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <PlayCircle className="h-4 w-4 text-accent" />
              Timeline synthesis
            </span>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleGenerate}
            className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Creative brief</h2>
              <p className="text-sm text-white/60">
                Define the reel&apos;s mission. The autonomous crew interprets and executes it in real-time.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-white/70">Core storyline</span>
              <input
                value={form.topic}
                onChange={(e) => updateForm("topic", e.target.value)}
                placeholder="What reel should the agents build?"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white shadow-inner shadow-black/40 outline-none transition focus:border-accent focus:shadow-glow"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Platform</span>
                <select
                  value={form.platform}
                  onChange={(e) => updateForm("platform", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-accent"
                >
                  <option value="instagram">Instagram Reels</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube Shorts</option>
                  <option value="linkedin">LinkedIn Spotlight</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Target duration (s)</span>
                <select
                  value={form.length}
                  onChange={(e) => updateForm("length", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-accent"
                >
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                  <option value="75">75</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Narrative tone</span>
                <input
                  value={form.tone}
                  onChange={(e) => updateForm("tone", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-accent"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Voice presence</span>
                <input
                  value={form.voice}
                  onChange={(e) => updateForm("voice", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-accent"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-white/70">Audience focus</span>
              <input
                value={form.audience}
                onChange={(e) => updateForm("audience", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-accent"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-white/70">Call to action</span>
              <input
                value={form.callToAction}
                onChange={(e) => updateForm("callToAction", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-accent"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-white/70">Brand energy color</span>
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => updateForm("brandColor", e.target.value)}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 outline-none"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <span className="text-sm text-white/70">Autonomous scheduling & posting</span>
              <input
                type="checkbox"
                checked={form.autopilot}
                onChange={(e) => updateForm("autopilot", e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-accent"
              />
            </label>

            <button
              type="submit"
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-accent-muted disabled:cursor-wait disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synthesizing
                </>
              ) : (
                <>
                  Launch Agents
                  <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </button>

            {error && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </form>

          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Mission control</h2>
                  <p className="text-sm text-white/60">
                    Four specialized agents coordinate to produce assets and assemble the reel.
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm uppercase tracking-[0.35em] text-white/40">Progress</span>
                  <span className="text-2xl font-semibold text-white">{Math.round(progress * 100)}%</span>
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-muted transition-all duration-500"
                  style={{ width: `${Math.max(progress * 100, 4)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-white/60">{progressionLabel}</p>
              <div className="mt-6 space-y-4">
                {statusFeed.length === 0 && (
                  <p className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/60">
                    Launch the agents to watch every beat appear in real time.
                  </p>
                )}
                {statusFeed.map((item) => (
                  <article
                    key={item.id + item.stage + item.detail}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm shadow-black/40"
                  >
                    <div className="flex items-center justify-between text-sm text-white/60">
                      <span>{item.agent}</span>
                      {item.eta ? <span>ETA {Math.max(10, item.eta)}s</span> : null}
                    </div>
                    <h3 className="mt-1 text-base font-medium text-white">{item.stage}</h3>
                    <p className="text-sm text-white/70">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Timeline synthesis</h2>
                <span className="text-xs uppercase tracking-[0.35em] text-white/40">Live layout</span>
              </div>
              <div className="mt-6 space-y-4">
                {segments.length === 0 ? (
                  <p className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/60">
                    Once VisionGrid locks the timeline, the orchestration map appears here.
                  </p>
                ) : (
                  <>
                    <div className="flex h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      {segments.map((segment, index) => (
                        <div
                          key={segment.id}
                          className="flex items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-white/80"
                          style={{
                            width: `${totalDuration ? (segment.duration / totalDuration) * 100 : 0}%`,
                            backgroundColor: `${getSegmentColor(index)}22`
                          }}
                        >
                          <span className="px-2" style={{ color: getSegmentColor(index) }}>
                            {segment.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-3">
                      {segments.map((segment, index) => (
                        <li
                          key={segment.id}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
                            <span>{segment.label}</span>
                            <span>
                              {formatSeconds(segment.start)} –{" "}
                              {formatSeconds(Math.min(totalDuration, segment.start + segment.duration))}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-white/70">
                            <span className="font-semibold" style={{ color: getSegmentColor(index) }}>
                              Beat {index + 1}:
                            </span>{" "}
                            {segment.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Asset vault</h2>
                <span className="text-xs uppercase tracking-[0.35em] text-white/40">Auto-synced</span>
              </div>
              <div className="mt-4 space-y-4">
                {["script", "overlays", "voicePlan"].map((key) => {
                  const asset = assetVault[key];
                  return (
                    <article
                      key={key}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm shadow-black/40"
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
                        <span>{asset ? asset.title : key}</span>
                        <span>{asset ? asset.agent : "Awaiting agent"}</span>
                      </div>
                      {asset ? (
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-white/70">{asset.content}</pre>
                      ) : (
                        <p className="mt-3 text-sm text-white/50">
                          Agent will attach the {key} artifact once synthesized.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>

            {result && (
              <div className="rounded-3xl border border-accent/40 bg-accent/10 p-6 shadow-lg shadow-accent/30">
                <h2 className="text-lg font-semibold text-white">Delivery manifest</h2>
                <p className="text-sm text-white/70">
                  Reel ready for {result.platform}. Total runtime {formatSeconds(result.duration)}.
                </p>
                <div className="mt-4 space-y-4 text-sm text-white/80">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.35em] text-white/40">Call to action</h3>
                    <p>{result.callToAction ?? "No CTA provided."}</p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.35em] text-white/40">Script</h3>
                    <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      {result.script}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
