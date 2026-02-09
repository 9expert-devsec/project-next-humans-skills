"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function AudioMiniPlayer({ src = "", title = "" }) {
  const audioRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [rate, setRate] = useState(1);

  const pct = useMemo(() => {
    if (!dur) return 0;
    return Math.min(100, Math.max(0, (t / dur) * 100));
  }, [t, dur]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => {
      setDur(el.duration || 0);
      setReady(true);
    };
    const onTime = () => setT(el.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }

  function seekToPercent(p) {
    const el = audioRef.current;
    if (!el || !dur) return;
    const next = (Math.min(100, Math.max(0, p)) / 100) * dur;
    el.currentTime = next;
    setT(next);
  }

  function setPlaybackRate(next) {
    const el = audioRef.current;
    setRate(next);
    if (el) el.playbackRate = next;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Audio</div>
          <div className="mt-1 text-xs text-white/55 line-clamp-1">
            {title || "—"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={rate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="h-9 rounded-xl bg-slate-950 px-3 text-xs text-white/80 outline-none ring-1 ring-white/10"
            title="Speed"
          >
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>

          <button
            type="button"
            onClick={toggle}
            disabled={!ready}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-sky-400/90 px-3 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-sky-400/80"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => seekToPercent(Number(e.target.value))}
            className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-white/55">
          <span>{formatTime(t)}</span>
          <span>{dur ? formatTime(dur) : "—"}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
