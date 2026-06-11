// ─── 共通: 3波合成の液面Y計算 ────────────────────────────────────────────────
const WAVE_FN = `
float liquidWave(vec3 wp, float fillY, float t) {
  return fillY
    + sin(wp.x * 2.8 + t * 1.4) * 0.10
    + sin(wp.x * 5.1 + wp.z * 3.2 + t * 2.1) * 0.06
    + sin(wp.z * 4.0 + t * 0.9) * 0.04;
}
`

// ─── 液体メッシュ: 頂点シェーダー ────────────────────────────────────────────
export const brainLiquidVert = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal   = normalize(normalMatrix * normal);
  vViewDir  = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// ─── 液体メッシュ: フラグメントシェーダー ────────────────────────────────────
// 液面以下を描画: 深い琥珀→明るい金のグラデーション + コースティクス + 液面ハイライト
export const brainLiquidFrag = `
uniform vec3  uColor;
uniform float uTime;
uniform float uFillY;
uniform float uAct;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

${WAVE_FN}

void main() {
  float wave = liquidWave(vWorldPos, uFillY, uTime);

  // 液面より上はこのシェーダーは描画しない
  if (vWorldPos.y > wave) discard;

  // 深さ (0=液面, 1=最深部)
  float depth = smoothstep(0.0, 3.6, wave - vWorldPos.y);

  // グラデーション: 明るい金(表面) → 深い琥珀(底)
  vec3 deepColor   = uColor * 0.28;
  vec3 brightColor = mix(uColor, vec3(1.0, 0.94, 0.38), 0.45);
  vec3 col = mix(brightColor, deepColor, depth);

  // 放射状エッジ暗化 (球の中央が明るく、端が暗い)
  float radial = length(vWorldPos.xz) / 1.5;
  col *= (1.0 - pow(radial, 2.0) * 0.50);

  // コースティクス (液面付近の明るい揺らぐ光の屈折パターン)
  float cx = sin(vWorldPos.x * 9.0 + uTime * 2.0) * sin(vWorldPos.z * 8.0 + uTime * 1.5);
  float caustic = pow(max(0.0, cx), 3.0) * 0.32 * (1.0 - depth);
  col += caustic * brightColor * 1.2;

  // 液面ハイライト: 波の頂点に白い反射光
  float surfaceProx = 1.0 - smoothstep(0.0, 0.18, wave - vWorldPos.y);
  col += surfaceProx * 0.90 * vec3(1.0, 0.97, 0.72);

  // 微細ノイズ (人工的なつるつる感を消す)
  float micro = sin(vWorldPos.x * 22.0) * cos(vWorldPos.y * 20.0) * sin(vWorldPos.z * 24.0) * 0.015;
  col += micro * uColor * 0.5;

  // 簡易拡散光
  float diffuse = max(0.25, dot(normalize(vNormal), normalize(vec3(1.0, 2.0, 1.5))));
  col *= (0.55 + diffuse * 0.45);

  gl_FragColor = vec4(col, 0.90);
}
`

// ─── 暗い部分（液面より上）: 頂点シェーダー ────────────────────────────────
export const brainDarkVert = `
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal   = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// ─── 暗い部分: フラグメントシェーダー ────────────────────────────────────────
// 液体シェーダーの補集合 (波面より上) を暗い半透明で塗る
export const brainDarkFrag = `
uniform float uTime;
uniform float uFillY;

varying vec3 vWorldPos;
varying vec3 vNormal;

${WAVE_FN}

void main() {
  float wave = liquidWave(vWorldPos, uFillY, uTime);
  if (vWorldPos.y <= wave) discard;

  // 法線でわずかに明暗をつけて立体感
  float rim = max(0.0, dot(normalize(vNormal), normalize(vec3(0.5, 1.0, 0.8))));
  float alpha = 0.30 + rim * 0.08;

  gl_FragColor = vec4(0.01, 0.025, 0.07, alpha);
}
`

// ─── 外側グローリム: 頂点シェーダー ─────────────────────────────────────────
export const brainGlowVert = `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vNormal  = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// ─── 外側グローリム: フラグメントシェーダー ──────────────────────────────────
// Fresnel 効果: エッジほど輝く (AdditiveBlending で重ねる)
export const brainGlowFrag = `
uniform vec3  uColor;
uniform float uAct;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float nDotV = dot(normalize(vNormal), normalize(vViewDir));
  float fresnel = pow(1.0 - abs(nDotV), 2.8);
  float glow = fresnel * (0.12 + uAct * 0.50);
  gl_FragColor = vec4(uColor, glow);
}
`

// ─── パーティクル: 頂点シェーダー ────────────────────────────────────────────
// aSize: 各パーティクルのサイズ (0.02–0.09)
// aOffset: ランダム位相シード (vec3)  → ゆっくり漂わせる
export const particleVert = `
attribute float aSize;
attribute vec3  aOffset;

uniform float uTime;
uniform float uAct;

varying float vAlpha;

void main() {
  // ゆっくり漂うドリフト
  vec3 pos = position + sin(uTime * 0.22 + aOffset) * 0.20;

  // 大きいパーティクルほど明るい
  float brightness = 0.30 + aSize * 8.5;
  vAlpha = (0.35 + uAct * 0.52) * brightness;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (520.0 / -mvPos.z);
  gl_Position  = projectionMatrix * mvPos;
}
`

// ─── パーティクル: フラグメントシェーダー ────────────────────────────────────
export const particleFrag = `
uniform vec3 uColor;

varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // エッジをやわらかくフェード
  float alpha = (1.0 - dist * 2.0) * vAlpha;
  gl_FragColor = vec4(uColor, alpha);
}
`
