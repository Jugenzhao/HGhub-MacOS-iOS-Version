import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { fmtTime, platform, playlist } from "../api";
import { mediaResource, observeHls, usePlayerDiagnostics } from "../playbackDiagnostics";
import { useStore } from "../store";
import { usePlaybackActivity } from "../usePlaybackActivity";
import { useSeekInput } from "../useSeekInput";
import PlaybackLock from "./PlaybackLock";
import SuperResCanvas, {
  SR_PRESET_MAP,
  SR_SHORT_LABEL,
  SuperResMenu,
  SuperResSvgDefs,
  getSvgFilterUrl,
} from "./SuperResCanvas";
import { ICompress, IExpand, ILockF, IPauseF, IPlayF, ISparkF, IVol, IVolMute } from "../icons";

type Props = {
  src: string;              // 原始 m3u8 地址
  poster?: string;          // 已处理好的封面地址（本地协议）
  autoPlay?: boolean;
  active?: boolean;
  muted?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onPlaying?: () => void;
  onTogglePlay?: (playing: boolean) => void;
  onToggleMute?: () => void;
  controls?: boolean;
  className?: string;
  diagnosticContext?: Record<string, unknown>;
};

export default function Player({
  src, poster, autoPlay, active = true, muted = false, loop = false, onEnded, onPlaying,
  onTogglePlay, onToggleMute, controls = true, className = "", diagnosticContext = {},
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const recoverCountRef = useRef(0);
  const { trace, requestSeek } = usePlayerDiagnostics(videoRef, hlsRef, { view: "post_detail", ...diagnosticContext, active, resource: mediaResource(src) });
  const activity = usePlaybackActivity(videoRef, hlsRef, { active, autoPlay: !!autoPlay, src, trace });
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [full, setFull] = useState(false);
  const [rate, setRate] = useState(1);
  const [errMsg, setErrMsg] = useState<string>("");
  const [controlsLocked, setControlsLocked] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [svgFallback, setSvgFallback] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const srSlotRef = useRef<HTMLDivElement>(null);
  const store = useStore();
  const srMode = store?.srMode ?? "off";

  useEffect(() => {
    if (!srOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!srSlotRef.current?.contains(e.target as Node)) setSrOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [srOpen]);

  useEffect(() => {
    if (!active || controlsLocked) setSrOpen(false);
  }, [active, controlsLocked]);
  const seek = useSeekInput({ time, duration, enabled: active && !controlsLocked, resetKey: src,
    onInteraction: (phase, input, target, pointerTarget) => trace(`seek.input.${phase}`, { input, target, pointer_target: pointerTarget }),
    onSeek: (target, input) => {
      const video = videoRef.current;
      if (!video || !activity.isActive()) return;
      requestSeek(target, `legacy_${input}`);
      setWaiting(true);
      if (hlsRef.current) {
        try { hlsRef.current.startLoad(target); } catch { /* ignore */ }
      }
      video.currentTime = target;
      trace("seek.assigned", { target });
      setTime(video.currentTime);
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const url = playlist(src);
    recoverCountRef.current = 0;
    setErrMsg("");
    setVideoReady(false);
    trace("source.load", { engine: Hls.isSupported() ? "hls.js" : "native", auto_play: autoPlay });

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({
        // 禁用从插播/内容引导 JSON 派生直连 URL 的可选功能。
        interstitialsController: undefined,
        contentSteeringController: undefined,
        enableInterstitialPlayback: false,
        enableWorker: platform !== "ios",
        // Keep the same macOS seek workaround as the shared player.
        preferManagedMediaSource: false,
        autoStartLoad: false,
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
      observeHls(hls, trace);
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (activity.isActive()) hls.startLoad();
        if (autoPlay) activity.play("manifest_autoplay", true);
      });
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        recoverCountRef.current = 0;
        setErrMsg("");
        setVideoReady(true);
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
        if (!activity.isActive()) return;
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
      if (autoPlay) activity.play("native_autoplay", true);
    }

    return () => {
      trace("source.cleanup");
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
    trace("toggle.request");
    if (video.paused) activity.play("toggle");
    else activity.pause("toggle");
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

  const pct = duration > 0 ? (seek.time / duration) * 100 : 0;
  const videoFilter = svgFallback ? getSvgFilterUrl(srMode) : undefined;

  return (
    <div ref={wrapRef} className={`relative bg-black overflow-hidden group ${className}`}>
      <SuperResSvgDefs />
      <div className="absolute inset-0" inert={controlsLocked}>
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        webkit-playsinline="true"
        preload="auto"
        muted={muted}
        loop={loop}
        className="w-full h-full object-contain bg-black"
        style={videoFilter ? { filter: videoFilter } : undefined}
        onClick={toggle}
        onLoadedData={() => setVideoReady(true)}
        onCanPlay={() => setVideoReady(true)}
        onPlay={() => { setVideoReady(true); if (activity.isActive()) { setPlaying(true); onTogglePlay?.(true); } }}
        onPause={() => { setPlaying(false); onTogglePlay?.(false); }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => { setVideoReady(true); if (activity.isActive()) { setWaiting(false); setErrMsg(""); onPlaying?.(); } }}
        onSeeked={() => setWaiting(false)}
        onTimeUpdate={(e) => setTime((e.target as HTMLVideoElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration || 0)}
        onEnded={() => { if (activity.isActive()) onEnded?.(); }}
      />
      <SuperResCanvas
        videoRef={videoRef}
        mode={srMode}
        active={active}
        ready={videoReady || playing || time > 0}
        fit="contain"
        srcKey={src}
        onFallbackChange={setSvgFallback}
        onTrace={trace}
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
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className={`absolute inset-x-0 bottom-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
            platform === "ios" || platform === "android" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}>
          <input aria-label="播放进度" type="range" {...seek.inputProps}
            className="hg-range w-full" style={{ ...seek.inputProps.style, "--fill": `${pct}%` } as React.CSSProperties} />
          <div className="flex items-center gap-3 mt-1 text-white">
            <button type="button" onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? "暂停" : "播放"} className="pressable">
              {playing ? <IPauseF size={16} /> : <IPlayF size={16} />}
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }} aria-label={muted ? "取消静音" : "静音"} className="pressable">
              {muted ? <IVolMute size={16} /> : <IVol size={16} />}
            </button>
            <span className="text-[11px] tabular-nums text-white/85">{fmtTime(seek.time)} / {fmtTime(duration)}</span>
            <div className="flex-1" />
            <div ref={srSlotRef} className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSrOpen((v) => !v); }}
                aria-label={`超分模式：${SR_SHORT_LABEL[srMode]}`}
                aria-expanded={srOpen}
                title="选择 GPU 画质超分档位"
                aria-pressed={srMode !== "off"}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 pressable ${
                  srMode !== "off" ? "bg-primary text-on-primary" : "text-white/85 bg-white/15"
                }`}>
                <ISparkF size={12} />
                <span>{SR_SHORT_LABEL[srMode]}</span>
              </button>
              {srOpen && (
                <SuperResMenu
                  current={srMode}
                  placement="up"
                  align="right"
                  onSelect={(m) => {
                    store?.setSrMode?.(m);
                    store?.toast?.(`画质增强：${SR_PRESET_MAP[m].hudText}`, m === "off" ? "info" : "ok");
                    setSrOpen(false);
                  }}
                />
              )}
            </div>
            <button onClick={() => setControlsLocked(true)} aria-label="锁定播放控制" title="锁定播放控制" aria-pressed={false} className="pressable">
              <ILockF size={16} />
            </button>
            <button onClick={cycleRate} className="text-[11px] font-bold text-white/85 pressable tabular-nums">{rate}x</button>
            <button onClick={toggleFull} aria-label="全屏" className="pressable">
              {full ? <ICompress size={16} /> : <IExpand size={16} />}
            </button>
          </div>
        </div>
      )}
      </div>
      {controlsLocked && <PlaybackLock active={active} onUnlock={() => setControlsLocked(false)} />}
    </div>
  );
}
