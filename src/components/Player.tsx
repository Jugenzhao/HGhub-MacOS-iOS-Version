import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { fmtTime, platform, playlist } from "../api";
import { ICompress, IExpand, IPauseF, IPlayF, IVol, IVolMute } from "../icons";

type Props = {
  src: string;              // 原始 m3u8 地址
  poster?: string;          // 已处理好的封面地址（本地协议）
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onPlaying?: () => void;
  onTogglePlay?: (playing: boolean) => void;
  onToggleMute?: () => void;
  controls?: boolean;
  className?: string;
};

export default function Player({
  src, poster, autoPlay, muted = false, loop = false, onEnded, onPlaying,
  onTogglePlay, onToggleMute, controls = true, className = "",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const recoverCountRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [scrubPct, setScrubPct] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [full, setFull] = useState(false);
  const [rate, setRate] = useState(1);
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const url = playlist(src);
    recoverCountRef.current = 0;
    setErrMsg("");

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: platform !== "ios",
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 30,
        maxBufferHole: 0.5,
        nudgeOffset: 0.25,
        nudgeMaxRetry: 6,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 4,
        fragLoadingTimeOut: 25000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 400,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => setPlaying(false));
      });
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        recoverCountRef.current = 0;
        setErrMsg("");
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) {
          if (
            data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR ||
            data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR
          ) {
            try { hls.startLoad(video.currentTime || -1); } catch { /* ignore */ }
          }
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoverCountRef.current < 4) {
          recoverCountRef.current += 1;
          try { hls.startLoad(video.currentTime || -1); } catch { /* ignore */ }
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoverCountRef.current < 4) {
          recoverCountRef.current += 1;
          try { hls.recoverMediaError(); video.play().catch(() => {}); } catch { /* ignore */ }
          return;
        }
        const detail = `${data.type}/${data.details}/${data.response?.code ?? ""}/${String(data.reason ?? "").slice(0, 80)}`;
        (window as unknown as { __hlsErr?: string }).__hlsErr = detail;
        setErrMsg(detail);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else { hls.destroy(); hlsRef.current = null; }
      });
    } else {
      // Safari / 部分 WebView 原生支持 HLS
      video.src = url;
      if (autoPlay) video.play().catch(() => setPlaying(false));
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [src, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const commitSeek = (pctVal: number) => {
    const video = videoRef.current;
    setScrubPct(null);
    if (!video || !duration) return;
    const target = Math.max(0, Math.min(duration - 0.15, (pctVal / 1000) * duration));
    setWaiting(true);
    if (hlsRef.current) {
      try { hlsRef.current.startLoad(target); } catch { /* ignore */ }
    }
    try { video.currentTime = target; } catch { /* ignore */ }
    setTime(target);
  };

  const cycleRate = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 2 : 1;
    video.playbackRate = next;
    setRate(next);
  };

  const toggleFull = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  };

  const pct = scrubPct !== null ? scrubPct / 10 : duration > 0 ? (time / duration) * 100 : 0;
  const displayTime = scrubPct !== null && duration > 0 ? (scrubPct / 1000) * duration : time;

  return (
    <div ref={wrapRef} className={`relative bg-black overflow-hidden group ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        webkit-playsinline="true"
        preload="auto"
        loop={loop}
        className="w-full h-full object-contain bg-black"
        onClick={toggle}
        onPlay={() => { setPlaying(true); onTogglePlay?.(true); }}
        onPause={() => { setPlaying(false); onTogglePlay?.(false); }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => { setWaiting(false); setErrMsg(""); onPlaying?.(); }}
        onSeeked={() => setWaiting(false)}
        onTimeUpdate={(e) => {
          if (scrubPct === null) setTime((e.target as HTMLVideoElement).currentTime);
        }}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration || 0)}
        onEnded={() => onEnded?.()}
      />

      {errMsg && (
        <div className="absolute left-2 top-2 z-30 max-w-[80%] rounded bg-black/70 px-2 py-1 text-[10px] leading-tight text-red-300 break-all">
          {errMsg}
        </div>
      )}

      {waiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 spinner" />
        </div>
      )}

      {!playing && !waiting && (
        <button onClick={toggle} aria-label="播放"
          className="absolute inset-0 flex items-center justify-center">
          <span className="w-16 h-16 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center elev-2 pressable">
            <IPlayF size={26} className="text-white ml-0.5" />
          </span>
        </button>
      )}

      {controls && (
        <div className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(pct * 10)}
            onChange={(e) => setScrubPct(Number(e.target.value))}
            onPointerUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
            onKeyUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
            className="hg-range w-full"
            style={{ "--fill": `${pct}%` } as React.CSSProperties}
          />
          <div className="flex items-center gap-3 mt-1 text-white">
            <button onClick={toggle} aria-label={playing ? "暂停" : "播放"} className="pressable">
              {playing ? <IPauseF size={16} /> : <IPlayF size={16} />}
            </button>
            <button onClick={() => onToggleMute?.()} aria-label="静音" className="pressable">
              {muted ? <IVolMute size={16} /> : <IVol size={16} />}
            </button>
            <span className="text-[11px] tabular-nums text-white/85">{fmtTime(displayTime)} / {fmtTime(duration)}</span>
            <div className="flex-1" />
            <button onClick={cycleRate} className="text-[11px] font-bold text-white/85 pressable tabular-nums">{rate}x</button>
            <button onClick={toggleFull} aria-label="全屏" className="pressable">
              {full ? <ICompress size={16} /> : <IExpand size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}