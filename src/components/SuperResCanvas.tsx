import React, { useEffect, useRef, useState } from "react";
import type { SuperResMode } from "../store";
import { ICheck, ISparkF } from "../icons";

export type SuperResPresetInfo = {
  id: SuperResMode;
  short: string;
  name: string;
  desc: string;
  hudText: string;
  uMode: number;
};

export const SR_PRESETS: SuperResPresetInfo[] = [
  {
    id: "natural",
    short: "自然",
    name: "自然清透",
    desc: "抗锯齿轻锐化 · 真人短剧耐看无硬边",
    hudText: "自然清透 · 柔和抗锯齿",
    uMode: 1,
  },
  {
    id: "cinema",
    short: "影院",
    name: "影院质感",
    desc: "去灰通透微反差 · 改善低码率暗部发灰",
    hudText: "影院质感 · 通透微反差",
    uMode: 2,
  },
  {
    id: "crisp",
    short: "锐利",
    name: "超清锐利",
    desc: "强效细节超分 · 适合模糊片源与小字",
    hudText: "超清锐利 · 强效细节增强",
    uMode: 3,
  },
  {
    id: "anime_3d",
    short: "漫剧",
    name: "漫剧锐线",
    desc: "零涂抹保纹理 · 专为 AI / 3D 漫剧定制",
    hudText: "漫剧锐线 · 零涂抹保纹理",
    uMode: 4,
  },
  {
    id: "anime_2d",
    short: "二次元",
    name: "二次元重绘",
    desc: "窄门限净底重描边 · 适合 2D 平涂番剧",
    hudText: "二次元重绘 · 净底重描边",
    uMode: 5,
  },
  {
    id: "off",
    short: "原画",
    name: "原画直通",
    desc: "关闭 GPU 超分 · 对比原始视频流",
    hudText: "原画直通 · 已关闭超分",
    uMode: 0,
  },
];

export const SR_PRESET_MAP = Object.fromEntries(
  SR_PRESETS.map((p) => [p.id, p]),
) as Record<SuperResMode, SuperResPresetInfo>;

export const SR_SHORT_LABEL = Object.fromEntries(
  SR_PRESETS.map((p) => [p.id, p.short]),
) as Record<SuperResMode, string>;

export const SR_FULL_LABEL = Object.fromEntries(
  SR_PRESETS.map((p) => [p.id, p.name]),
) as Record<SuperResMode, string>;

export function getSvgFilterUrl(mode: SuperResMode): string | undefined {
  return mode === "off" ? undefined : `url(#hg-sr-filter-${mode})`;
}

/**
 * 播放器超分多档位直达选单（深色毛玻璃浮层，兼容竖屏 / 横屏 / 独立播放器）。
 */
export function SuperResMenu({
  current,
  onSelect,
  placement = "down",
  align = "right",
  className = "",
}: {
  current: SuperResMode;
  onSelect: (mode: SuperResMode) => void;
  placement?: "down" | "up";
  align?: "right" | "left";
  className?: string;
}) {
  const posStyle: React.CSSProperties = {
    position: "absolute",
    ...(placement === "down" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" }),
    ...(align === "right" ? { right: 0 } : { left: 0 }),
    width: 232,
    maxHeight: "min(68vh, 324px)",
    overflowY: "auto",
    background: "rgba(14, 17, 24, 0.92)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 14px 36px rgba(0, 0, 0, 0.56)",
    borderRadius: 14,
    padding: 6,
    zIndex: 60,
  };

  return (
    <div
      role="menu"
      aria-label="GPU 画质超分档位选择"
      data-no-gesture
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={posStyle}
      className={`a-fade ${className}`}>
      <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5 text-[10.5px] font-semibold text-white/55">
        <span className="flex items-center gap-1">
          <ISparkF size={11} className="text-primary" />
          <span>GPU 画质超分档位</span>
        </span>
        <span className="text-[10px] text-white/40">实时切换</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {SR_PRESETS.map((preset) => {
          const active = current === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(preset.id);
              }}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[10px] text-left transition-colors pressable ${
                active ? "bg-white/14" : "hover:bg-white/8"
              }`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-bold ${active ? "text-primary" : "text-white/95"}`}>
                    {preset.name}
                  </span>
                  <span
                    className={`px-1.5 py-px rounded text-[9.5px] font-semibold ${
                      active ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"
                    }`}>
                    {preset.short}
                  </span>
                </div>
                <div className="text-[10px] leading-tight text-white/55 truncate mt-0.5">
                  {preset.desc}
                </div>
              </div>
              {active && <ICheck size={14} className="text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CoreAnimation / Metal 硬件卷积兜底滤镜：
 * 仅当设备不支持 WebGL2 或 iOS ManagedMediaSource 禁止 texImage2D 读取视频像素时启用，
 * 保证零黑屏并保留与各档位特征对应的基础画质增强。
 */
export function SuperResSvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: "absolute", pointerEvents: "none", opacity: 0 }}>
      <defs>
        <filter id="hg-sr-filter-natural" colorInterpolationFilters="sRGB">
          <feConvolveMatrix
            order="3"
            kernelMatrix="0 -0.18 0 -0.18 1.72 -0.18 0 -0.18 0"
            preserveAlpha="true"
          />
        </filter>
        <filter id="hg-sr-filter-cinema" colorInterpolationFilters="sRGB">
          <feConvolveMatrix
            order="3"
            kernelMatrix="-0.06 -0.22 -0.06 -0.22 2.12 -0.22 -0.06 -0.22 -0.06"
            preserveAlpha="true"
          />
          <feColorMatrix type="saturate" values="1.05" />
        </filter>
        <filter id="hg-sr-filter-crisp" colorInterpolationFilters="sRGB">
          <feConvolveMatrix
            order="3"
            kernelMatrix="-0.12 -0.34 -0.12 -0.34 2.84 -0.34 -0.12 -0.34 -0.12"
            preserveAlpha="true"
          />
        </filter>
        <filter id="hg-sr-filter-anime_3d" colorInterpolationFilters="sRGB">
          <feConvolveMatrix
            order="3"
            kernelMatrix="-0.08 -0.28 -0.08 -0.28 2.44 -0.28 -0.08 -0.28 -0.08"
            preserveAlpha="true"
          />
          <feColorMatrix type="saturate" values="1.05" />
        </filter>
        <filter id="hg-sr-filter-anime_2d" colorInterpolationFilters="sRGB">
          <feConvolveMatrix
            order="3"
            kernelMatrix="-0.14 -0.40 -0.14 -0.40 3.16 -0.40 -0.14 -0.40 -0.14"
            preserveAlpha="true"
          />
          <feColorMatrix type="saturate" values="1.08" />
        </filter>
      </defs>
    </svg>
  );
}

const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vScreenUv;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
  vScreenUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform vec2 uCanvasSize;
uniform vec2 uVideoSize;
uniform int uFit;
uniform int uMode;

in vec2 vScreenUv;
out vec4 fragColor;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 sampleClamped(vec2 uv, vec2 halfTexel) {
  return texture(uTex, clamp(uv, halfTexel, 1.0 - halfTexel)).rgb;
}

// 档位 1：自然清透（对角等值线抗锯齿 + 严格零过冲温和 RCAS，真人短剧耐看无硬边）
vec3 runNatural(vec2 uv, vec2 texel) {
  vec2 ht = texel * 0.5;
  vec3 c  = sampleClamped(uv, ht);
  vec3 n  = sampleClamped(uv + vec2(0.0, -texel.y), ht);
  vec3 s  = sampleClamped(uv + vec2(0.0,  texel.y), ht);
  vec3 w  = sampleClamped(uv + vec2(-texel.x, 0.0), ht);
  vec3 e  = sampleClamped(uv + vec2( texel.x, 0.0), ht);
  vec3 nw = sampleClamped(uv + vec2(-texel.x, -texel.y), ht);
  vec3 ne = sampleClamped(uv + vec2( texel.x, -texel.y), ht);
  vec3 sw = sampleClamped(uv + vec2(-texel.x,  texel.y), ht);
  vec3 se = sampleClamped(uv + vec2( texel.x,  texel.y), ht);

  float d1 = abs(luma(nw) - luma(se));
  float d2 = abs(luma(ne) - luma(sw));
  vec3 diagDir = d1 < d2 ? (nw + se) * 0.5 : (ne + sw) * 0.5;
  vec3 crossAvg = (n + s + w + e) * 0.25;
  vec3 edgeSmooth = mix(c, mix(crossAvg, diagDir, 0.45), 0.20);

  float lc = luma(c);
  float ln = luma(n), ls = luma(s), lw = luma(w), le = luma(e);
  float lMin = min(lc, min(min(ln, ls), min(lw, le)));
  float lMax = max(lc, max(max(ln, ls), max(lw, le)));
  float lRange = lMax - lMin;

  float gate = smoothstep(0.025, 0.088, lRange);
  float amp = clamp(min(lMin, 1.0 - lMax) / max(lMax, 1e-4), 0.0, 1.0);
  float wSharp = -0.14 * sqrt(amp) * gate;
  vec3 rcas = (c + (n + s + w + e) * wSharp) / max(1.0 + 4.0 * wSharp, 1e-4);
  vec3 sharp = rcas + (c - edgeSmooth) * (0.09 * gate);

  vec3 minC = min(c, min(min(n, s), min(w, e)));
  vec3 maxC = max(c, max(max(n, s), max(w, e)));
  vec3 clamped = clamp(sharp, minC, maxC);
  return mix(c, clamped, 0.76);
}

// 档位 2：影院质感（温和 RCAS + 局部通透微反差 Local Clarity + 去灰雾 S 曲线）
vec3 runCinema(vec2 uv, vec2 texel) {
  vec2 ht = texel * 0.5;
  vec3 c  = sampleClamped(uv, ht);
  vec3 n  = sampleClamped(uv + vec2(0.0, -texel.y), ht);
  vec3 s  = sampleClamped(uv + vec2(0.0,  texel.y), ht);
  vec3 w  = sampleClamped(uv + vec2(-texel.x, 0.0), ht);
  vec3 e  = sampleClamped(uv + vec2( texel.x, 0.0), ht);
  vec3 nw = sampleClamped(uv + vec2(-texel.x, -texel.y), ht);
  vec3 ne = sampleClamped(uv + vec2( texel.x, -texel.y), ht);
  vec3 sw = sampleClamped(uv + vec2(-texel.x,  texel.y), ht);
  vec3 se = sampleClamped(uv + vec2( texel.x,  texel.y), ht);

  float lc = luma(c);
  float ln = luma(n), ls = luma(s), lw = luma(w), le = luma(e);
  float lMin = min(lc, min(min(ln, ls), min(lw, le)));
  float lMax = max(lc, max(max(ln, ls), max(lw, le)));
  float lRange = lMax - lMin;

  float gate = smoothstep(0.020, 0.080, lRange);
  float amp = clamp(min(lMin, 1.0 - lMax) / max(lMax, 1e-4), 0.0, 1.0);
  float wSharp = -0.17 * sqrt(amp) * gate;
  vec3 rcas = (c + (n + s + w + e) * wSharp) / max(1.0 + 4.0 * wSharp, 1e-4);

  vec3 minC = min(c, min(min(n, s), min(w, e)));
  vec3 maxC = max(c, max(max(n, s), max(w, e)));
  vec3 rcasClamped = clamp(rcas, minC, maxC);

  // 局部立体微反差：仅在中高对比结构上增强前后景层次，暗部噪点区保持克制
  vec3 crossAvg = (n + s + w + e) * 0.25;
  vec3 diagAvg  = (nw + ne + sw + se) * 0.25;
  vec3 surround = crossAvg * 0.6 + diagAvg * 0.4;
  float clarityGate = smoothstep(0.018, 0.075, lRange);
  vec3 clarified = rcasClamped + (rcasClamped - surround) * (0.24 * clarityGate);

  vec3 min9 = min(minC, min(min(nw, ne), min(sw, se)));
  vec3 max9 = max(maxC, max(max(nw, ne), max(sw, se)));
  vec3 col = clamp(clarified, min9, max9);

  // 柔和胶片 S 曲线去低码率灰雾 + +5% 自然色彩净度
  col = mix(col, smoothstep(0.0, 1.0, col), 0.06);
  float outL = luma(col);
  return clamp(mix(vec3(outL), col, 1.05), 0.0, 1.0);
}

// 档位 3：超清锐利（高频适应 RCAS + 亚像素高频细节增强，适合模糊片源与小字）
vec3 runCrisp(vec2 uv, vec2 texel) {
  vec2 ht = texel * 0.5;
  vec3 c  = sampleClamped(uv, ht);
  vec3 n  = sampleClamped(uv + vec2(0.0, -texel.y), ht);
  vec3 s  = sampleClamped(uv + vec2(0.0,  texel.y), ht);
  vec3 w  = sampleClamped(uv + vec2(-texel.x, 0.0), ht);
  vec3 e  = sampleClamped(uv + vec2( texel.x, 0.0), ht);
  vec3 nw = sampleClamped(uv + vec2(-texel.x, -texel.y), ht);
  vec3 ne = sampleClamped(uv + vec2( texel.x, -texel.y), ht);
  vec3 sw = sampleClamped(uv + vec2(-texel.x,  texel.y), ht);
  vec3 se = sampleClamped(uv + vec2( texel.x,  texel.y), ht);

  float lc = luma(c);
  float ln = luma(n), ls = luma(s), lw = luma(w), le = luma(e);
  float lMin = min(lc, min(min(ln, ls), min(lw, le)));
  float lMax = max(lc, max(max(ln, ls), max(lw, le)));
  float lRange = lMax - lMin;

  float gate = smoothstep(0.016, 0.065, lRange);
  float amp = clamp(min(lMin, 1.0 - lMax) / max(lMax, 1e-4), 0.0, 1.0);
  float wSharp = -0.24 * sqrt(amp) * gate;
  vec3 rcas = (c + (n + s + w + e) * wSharp) / max(1.0 + 4.0 * wSharp, 1e-4);

  vec3 crossAvg = (n + s + w + e) * 0.25;
  vec3 sharp = rcas + (c - crossAvg) * (0.20 * gate);

  vec3 min9 = min(c, min(min(min(n, s), min(w, e)), min(min(nw, ne), min(sw, se))));
  vec3 max9 = max(c, max(max(max(n, s), max(w, e)), max(max(nw, ne), max(sw, se))));
  return clamp(sharp, min9 - 0.010 * gate, max9 + 0.010 * gate);
}

// 档位 4：漫剧锐线（零涂抹保纹理！不做双边磨皮，专注轮廓微收紧 + 发丝质感 RCAS 重塑）
vec3 runAnime3D(vec2 uv, vec2 texel) {
  vec2 ht = texel * 0.5;
  vec3 tl = sampleClamped(uv + vec2(-texel.x, -texel.y), ht);
  vec3 tc = sampleClamped(uv + vec2(0.0,      -texel.y), ht);
  vec3 tr = sampleClamped(uv + vec2( texel.x, -texel.y), ht);
  vec3 ml = sampleClamped(uv + vec2(-texel.x,  0.0), ht);
  vec3 mc = sampleClamped(uv, ht);
  vec3 mr = sampleClamped(uv + vec2( texel.x,  0.0), ht);
  vec3 bl = sampleClamped(uv + vec2(-texel.x,  texel.y), ht);
  vec3 bc = sampleClamped(uv + vec2(0.0,       texel.y), ht);
  vec3 br = sampleClamped(uv + vec2( texel.x,  texel.y), ht);

  float ltl = luma(tl), ltc = luma(tc), ltr = luma(tr);
  float lml = luma(ml), lmc = luma(mc), lmr = luma(mr);
  float lbl = luma(bl), lbc = luma(bc), lbr = luma(br);

  // 直接以原像素 mc 为基底：彻底杜绝 2.5D/AI 漫剧的塑料涂抹感
  float gx = (ltr + 2.0 * lmr + lbr) - (ltl + 2.0 * lml + lbl);
  float gy = (lbl + 2.0 * lbc + lbr) - (ltl + 2.0 * ltc + ltr);
  float gMag = length(vec2(gx, gy));
  vec2 dir = gMag > 1e-4 ? (vec2(gx, gy) / gMag) : vec2(0.0);

  // 仅对明确轮廓边做单跨度轻量收紧，发丝和肌肤细腻过渡完全不受平滑损伤
  float edgeMask = smoothstep(0.032, 0.145, gMag);
  vec3 pushed = mc;
  if (edgeMask > 0.01) {
    vec2 sNear = dir * (texel * 0.82);
    vec3 f1 = sampleClamped(uv + sNear, ht);
    vec3 b1 = sampleClamped(uv - sNear, ht);
    float lf1 = luma(f1), lb1 = luma(b1);
    vec3 darkSide = lf1 < lb1 ? f1 : b1;
    vec3 lightSide = lf1 > lb1 ? f1 : b1;
    float midL = 0.5 * (lf1 + lb1);
    vec3 target = (lmc < midL) ? darkSide : lightSide;
    pushed = mix(mc, target, 0.36 * edgeMask);
  }

  // 叠加 RCAS 精细纹理锐化，让发丝、服饰纹理与阴影边界同步变清晰
  float lMin = min(lmc, min(min(ltc, lbc), min(lml, lmr)));
  float lMax = max(lmc, max(max(ltc, lbc), max(lml, lmr)));
  float texGate = smoothstep(0.018, 0.070, lMax - lMin);
  float amp = clamp(min(lMin, 1.0 - lMax) / max(lMax, 1e-4), 0.0, 1.0);
  float wSharp = -0.18 * sqrt(amp) * texGate;
  vec3 rcas = (pushed + (tc + bc + ml + mr) * wSharp) / max(1.0 + 4.0 * wSharp, 1e-4);

  vec3 min9 = min(mc, min(min(min(tc, bc), min(ml, mr)), min(min(tl, tr), min(bl, br))));
  vec3 max9 = max(mc, max(max(max(tc, bc), max(ml, mr)), max(max(tl, tr), max(bl, br))));
  vec3 outC = clamp(rcas, min9, max9);

  // 轻微提升通透饱和度 (+5%)
  float outL = luma(outC);
  return clamp(mix(vec3(outL), outC, 1.05), 0.0, 1.0);
}

// 档位 5：二次元重绘（窄门限净底去蚊式噪点 + 双跨度 Anime4K 边缘重构 + 描边加固）
vec3 runAnime2D(vec2 uv, vec2 texel) {
  vec2 ht = texel * 0.5;
  vec3 tl = sampleClamped(uv + vec2(-texel.x, -texel.y), ht);
  vec3 tc = sampleClamped(uv + vec2(0.0,      -texel.y), ht);
  vec3 tr = sampleClamped(uv + vec2( texel.x, -texel.y), ht);
  vec3 ml = sampleClamped(uv + vec2(-texel.x,  0.0), ht);
  vec3 mc = sampleClamped(uv, ht);
  vec3 mr = sampleClamped(uv + vec2( texel.x,  0.0), ht);
  vec3 bl = sampleClamped(uv + vec2(-texel.x,  texel.y), ht);
  vec3 bc = sampleClamped(uv + vec2(0.0,       texel.y), ht);
  vec3 br = sampleClamped(uv + vec2( texel.x,  texel.y), ht);

  // 1. 窄门限颜色导向净底（系数 720.0：只清理极微小的平涂块压缩噪点，绝不糊掉精细阴影）
  vec3 bSum = mc;
  float wSum = 1.0;
  float w0 = exp(-dot(tl - mc, tl - mc) * 720.0); bSum += tl * w0; wSum += w0;
  float w1 = exp(-dot(tc - mc, tc - mc) * 720.0); bSum += tc * w1; wSum += w1;
  float w2 = exp(-dot(tr - mc, tr - mc) * 720.0); bSum += tr * w2; wSum += w2;
  float w3 = exp(-dot(ml - mc, ml - mc) * 720.0); bSum += ml * w3; wSum += w3;
  float w4 = exp(-dot(mr - mc, mr - mc) * 720.0); bSum += mr * w4; wSum += w4;
  float w5 = exp(-dot(bl - mc, bl - mc) * 720.0); bSum += bl * w5; wSum += w5;
  float w6 = exp(-dot(bc - mc, bc - mc) * 720.0); bSum += bc * w6; wSum += w6;
  float w7 = exp(-dot(br - mc, br - mc) * 720.0); bSum += br * w7; wSum += w7;
  vec3 celBase = bSum / wSum;

  float ltl = luma(tl), ltc = luma(tc), ltr = luma(tr);
  float lml = luma(ml), lmc = luma(mc), lmr = luma(mr);
  float lbl = luma(bl), lbc = luma(bc), lbr = luma(br);

  // 2. 双跨度 Sobel 梯度法线（0.80x + 1.30x）精准收窄 2D 线稿边界
  float gx = (ltr + 2.0 * lmr + lbr) - (ltl + 2.0 * lml + lbl);
  float gy = (lbl + 2.0 * lbc + lbr) - (ltl + 2.0 * ltc + ltr);
  float gMag = length(vec2(gx, gy));
  vec2 dir = gMag > 1e-4 ? (vec2(gx, gy) / gMag) : vec2(0.0);

  vec2 sNear = dir * (texel * 0.80);
  vec2 sFar  = dir * (texel * 1.30);
  vec3 f1 = sampleClamped(uv + sNear, ht);
  vec3 b1 = sampleClamped(uv - sNear, ht);
  vec3 f2 = sampleClamped(uv + sFar, ht);
  vec3 b2 = sampleClamped(uv - sFar, ht);
  float lf1 = luma(f1), lb1 = luma(b1);
  float lf2 = luma(f2), lb2 = luma(b2);

  vec3 fPeak = lf1 < lf2 ? f1 : f2;
  vec3 bPeak = lb1 < lb2 ? b1 : b2;
  vec3 fBright = lf1 > lf2 ? f1 : f2;
  vec3 bBright = lb1 > lb2 ? b1 : b2;

  float fMinL = min(lf1, lf2), bMinL = min(lb1, lb2);
  float fMaxL = max(lf1, lf2), bMaxL = max(lb1, lb2);
  vec3 darkSide = fMinL < bMinL ? fPeak : bPeak;
  vec3 lightSide = fMaxL > bMaxL ? fBright : bBright;

  float edgeMask = smoothstep(0.024, 0.135, gMag);
  vec3 pushed = celBase;
  if (edgeMask > 0.01) {
    float midL = 0.5 * (min(fMinL, bMinL) + max(fMaxL, bMaxL));
    vec3 target = (lmc < midL) ? darkSide : lightSide;
    pushed = mix(celBase, target, 0.52 * edgeMask);
  }

  // 3. 深色描边线芯适度压黑加固
  float avg8Luma = (ltl + ltc + ltr + lml + lmr + lbl + lbc + lbr) * 0.125;
  float lineDarkening = clamp((avg8Luma - lmc) * 0.36, 0.0, 0.05) * edgeMask;
  pushed *= (1.0 - lineDarkening);

  // 4. 极值保护反差锐化 + +8% 鲜明色彩补偿
  vec3 avg4 = (tc + bc + ml + mr) * 0.25;
  vec3 wideMin = min(mc, min(min(min(tc, bc), min(ml, mr)), min(min(f1, b1), min(f2, b2))));
  vec3 wideMax = max(mc, max(max(max(tc, bc), max(ml, mr)), max(max(f1, b1), max(f2, b2))));
  vec3 sharp = pushed + (pushed - avg4) * (0.45 * edgeMask);
  vec3 outC = clamp(sharp, wideMin, wideMax);

  outC = mix(outC, smoothstep(0.0, 1.0, outC), 0.05);
  float outL = luma(outC);
  return clamp(mix(vec3(outL), outC, 1.08), 0.0, 1.0);
}

void main() {
  float canvasAr = uCanvasSize.x / max(1.0, uCanvasSize.y);
  float videoAr = uVideoSize.x / max(1.0, uVideoSize.y);
  vec2 scale;
  if (uFit == 0) {
    // contain：超出视频区域直接填黑，保证宽高比与 <video object-contain> 像素对齐
    scale = canvasAr > videoAr ? vec2(canvasAr / videoAr, 1.0) : vec2(1.0, videoAr / canvasAr);
  } else {
    // cover：与 <video object-cover> 居中裁切对齐
    scale = canvasAr > videoAr ? vec2(1.0, videoAr / canvasAr) : vec2(canvasAr / videoAr, 1.0);
  }

  vec2 uv = (vScreenUv - 0.5) * scale + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 texel = 1.0 / max(uVideoSize, vec2(1.0));
  vec3 rgb;
  if (uMode == 2) rgb = runCinema(uv, texel);
  else if (uMode == 3) rgb = runCrisp(uv, texel);
  else if (uMode == 4) rgb = runAnime3D(uv, texel);
  else if (uMode == 5) rgb = runAnime2D(uv, texel);
  else rgb = runNatural(uv, texel);
  fragColor = vec4(rgb, 1.0);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

type GlPipeline = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  tex: WebGLTexture;
  vao: WebGLVertexArrayObject | null;
  vbo: WebGLBuffer;
  uTex: WebGLUniformLocation | null;
  uCanvasSize: WebGLUniformLocation | null;
  uVideoSize: WebGLUniformLocation | null;
  uFit: WebGLUniformLocation | null;
  uMode: WebGLUniformLocation | null;
};

function initGl(canvas: HTMLCanvasElement): GlPipeline | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }

  const prog = gl.createProgram();
  if (!prog) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }

  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  const tex = gl.createTexture();
  if (!vbo || !tex) {
    if (vao) gl.deleteVertexArray(vao);
    if (vbo) gl.deleteBuffer(vbo);
    if (tex) gl.deleteTexture(tex);
    gl.deleteProgram(prog);
    return null;
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  return {
    gl,
    prog,
    tex,
    vao,
    vbo,
    uTex: gl.getUniformLocation(prog, "uTex"),
    uCanvasSize: gl.getUniformLocation(prog, "uCanvasSize"),
    uVideoSize: gl.getUniformLocation(prog, "uVideoSize"),
    uFit: gl.getUniformLocation(prog, "uFit"),
    uMode: gl.getUniformLocation(prog, "uMode"),
  };
}

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  mode: SuperResMode;
  active?: boolean;
  ready?: boolean;
  fit?: "contain" | "cover";
  srcKey?: string;
  onFallbackChange?: (useSvgFallback: boolean) => void;
  onTrace?: (event: string, data?: Record<string, unknown>) => void;
};

type VideoWithVfc = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/**
 * WebGL2 → Metal GPU 实时视频超分画布：
 * - 当 mode !== "off" 且像素健康自检通过时覆盖在 <video> 之上；
 * - 若 WebGL2 不可用或 ManagedMediaSource 阻止视频帧读取，自动回退 SVG 卷积滤镜确保零黑屏。
 */
export default function SuperResCanvas({
  videoRef,
  mode,
  active = true,
  ready = true,
  fit = "contain",
  srcKey = "",
  onFallbackChange,
  onTrace,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GlPipeline | null>(null);
  const [svgFallback, setSvgFallback] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const verifiedRef = useRef(false);
  const blackFramesRef = useRef(0);
  const fallbackReportedRef = useRef(false);
  const probeBufRef = useRef(new Uint8Array(4));
  const drawFrameRef = useRef<(() => void) | null>(null);
  const syncSizeRef = useRef<(() => void) | null>(null);

  const modeRef = useRef(mode);
  const fitRef = useRef(fit);
  const activeRef = useRef(active);
  const readyRef = useRef(ready);
  modeRef.current = mode;
  fitRef.current = fit;
  activeRef.current = active;
  readyRef.current = ready;

  const triggerFallback = (reason: string) => {
    if (fallbackReportedRef.current) return;
    fallbackReportedRef.current = true;
    setSvgFallback(true);
    setCanvasReady(false);
    onFallbackChange?.(true);
    onTrace?.("sr.svg_fallback", { reason, mode: modeRef.current });
  };

  // 换源时重置像素健康自检
  useEffect(() => {
    verifiedRef.current = false;
    blackFramesRef.current = 0;
    fallbackReportedRef.current = false;
    setSvgFallback(false);
    setCanvasReady(false);
    onFallbackChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey]);

  // 追踪容器布局尺寸（clientWidth/clientHeight 不受 CSS rotate(90deg) 或双指缩放影响）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const syncSize = () => {
      const cssW = canvas.clientWidth || canvas.getBoundingClientRect().width;
      const cssH = canvas.clientHeight || canvas.getBoundingClientRect().height;
      if (cssW <= 0 || cssH <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
      const w = Math.min(2560, Math.max(2, Math.round(cssW * dpr)));
      const h = Math.min(2560, Math.max(2, Math.round(cssH * dpr)));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawFrameRef.current?.();
      }
    };
    syncSizeRef.current = syncSize;
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      syncSizeRef.current = null;
    };
  }, []);

  // 初始化 WebGL2 管线并在卸载时清理 GPU 资源
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      triggerFallback("webglcontextlost");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const pipe = initGl(canvas);
    if (!pipe) {
      triggerFallback("webgl2_init_failed");
      return () => canvas.removeEventListener("webglcontextlost", onContextLost);
    }
    glRef.current = pipe;

    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      const { gl, prog, tex, vao, vbo } = pipe;
      gl.deleteTexture(tex);
      gl.deleteBuffer(vbo);
      if (vao) gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      glRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 主渲染循环（支持播放中帧回调与暂停切换即时重绘）
  useEffect(() => {
    const video = videoRef.current as VideoWithVfc | null;
    const canvas = canvasRef.current;
    const pipe = glRef.current;
    if (!video || !canvas || !pipe || svgFallback || mode === "off" || !active) {
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let vfcId = 0;

    const drawFrame = () => {
      if (cancelled || fallbackReportedRef.current) return;
      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (vw <= 0 || vh <= 0 || video.readyState < 2) return;

      const cw = canvas.width;
      const ch = canvas.height;
      if (cw <= 0 || ch <= 0) return;

      const { gl, prog, tex, vao, uTex, uCanvasSize, uVideoSize, uFit, uMode } = pipe;
      try {
        gl.viewport(0, 0, cw, ch);
        gl.useProgram(prog);
        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

        gl.uniform1i(uTex, 0);
        gl.uniform2f(uCanvasSize, cw, ch);
        gl.uniform2f(uVideoSize, vw, vh);
        gl.uniform1i(uFit, fitRef.current === "cover" ? 1 : 0);
        gl.uniform1i(uMode, SR_PRESET_MAP[modeRef.current].uMode);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        // 首帧像素健康自检：确认视频帧非纯黑后展示画布并停止回读，避免影响性能
        if (!verifiedRef.current && video.currentTime > 0.05 && !video.paused) {
          const pts: [number, number][] = [
            [0.5, 0.5],
            [0.35, 0.38],
            [0.65, 0.38],
            [0.35, 0.62],
            [0.65, 0.62],
          ];
          const buf = probeBufRef.current;
          let nonBlack = false;
          for (const [fx, fy] of pts) {
            const px = Math.max(0, Math.min(cw - 1, Math.round(cw * fx)));
            const py = Math.max(0, Math.min(ch - 1, Math.round(ch * fy)));
            gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
            if (buf[0] + buf[1] + buf[2] > 6) {
              nonBlack = true;
              break;
            }
          }
          if (nonBlack) {
            verifiedRef.current = true;
            setCanvasReady(true);
            onTrace?.("sr.webgl2_ready", {
              mode: modeRef.current,
              vw,
              vh,
              cw,
              ch,
            });
          } else {
            blackFramesRef.current += 1;
            if (blackFramesRef.current >= 8 && video.currentTime >= 0.45) {
              triggerFallback("black_texture_samples");
            }
          }
        }
      } catch (err) {
        triggerFallback(err instanceof Error ? err.message : "texImage2D_error");
      }
    };

    const scheduleNext = () => {
      if (cancelled || fallbackReportedRef.current || rafId || vfcId) return;
      if (typeof video.requestVideoFrameCallback === "function" && !video.paused) {
        vfcId = video.requestVideoFrameCallback(() => {
          vfcId = 0;
          drawFrame();
          if (!video.paused) scheduleNext();
        });
      } else {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          drawFrame();
          if (!video.paused) scheduleNext();
        });
      }
    };

    // 切换模式 / seek / 暂停时立即重绘当前定格帧，方便用户静帧对比清晰度
    drawFrameRef.current = drawFrame;
    syncSizeRef.current?.();
    drawFrame();
    if (!video.paused) {
      scheduleNext();
    }

    const onVideoResumeOrUpdate = () => {
      drawFrame();
      if (!video.paused) {
        scheduleNext();
      }
    };
    const onPauseOrSeek = () => {
      drawFrame();
    };

    video.addEventListener("play", onVideoResumeOrUpdate);
    video.addEventListener("playing", onVideoResumeOrUpdate);
    video.addEventListener("loadeddata", onPauseOrSeek);
    video.addEventListener("seeked", onPauseOrSeek);
    video.addEventListener("pause", onPauseOrSeek);

    return () => {
      cancelled = true;
      drawFrameRef.current = null;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (vfcId && typeof video.cancelVideoFrameCallback === "function") {
        try {
          video.cancelVideoFrameCallback(vfcId);
        } catch {
          /* ignore */
        }
      }
      video.removeEventListener("play", onVideoResumeOrUpdate);
      video.removeEventListener("playing", onVideoResumeOrUpdate);
      video.removeEventListener("loadeddata", onPauseOrSeek);
      video.removeEventListener("seeked", onPauseOrSeek);
      video.removeEventListener("pause", onPauseOrSeek);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, active, ready, fit, svgFallback, srcKey]);

  const showCanvas = mode !== "off" && active && ready && !svgFallback && canvasReady;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        opacity: showCanvas ? 1 : 0,
        transition: "opacity .12s ease",
      }}
    />
  );
}
