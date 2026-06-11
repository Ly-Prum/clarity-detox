'use client'
import { useRef, useEffect } from 'react'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export default function Brain3DCanvas({ color, act }: { color: string; act: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const actRef    = useRef(act)
  const colorRef  = useRef(color)

  useEffect(() => { actRef.current  = act   }, [act])
  useEffect(() => { colorRef.current = color }, [color])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr  = Math.min(window.devicePixelRatio || 1, 2)
    const SIZE = 260
    canvas.width        = SIZE * dpr
    canvas.height       = SIZE * dpr
    canvas.style.width  = `${SIZE}px`
    canvas.style.height = `${SIZE}px`

    const rawCtx = canvas.getContext('2d')
    if (!rawCtx) return
    const ctx = rawCtx   // TS narrowing: CanvasRenderingContext2D (non-null)
    ctx.scale(dpr, dpr)

    let animId: number
    let t = 0

    function frame() {
      const col = colorRef.current
      const act = actRef.current
      const [cr, cg, cb] = hexToRgb(col)

      const W  = SIZE, H = SIZE
      const cx = W / 2, cy = H / 2
      const r  = W * 0.40   // 脳の半径

      ctx.clearRect(0, 0, W, H)

      // ── 1. 外側ハロー（にじむ光） ─────────────────────────────────────
      const halo = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r * 1.55)
      halo.addColorStop(0, `rgba(${cr},${cg},${cb},${0.08 + act * 0.10})`)
      halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2)
      ctx.fill()

      // ── 2. 脳の輪郭（多層グロー） ─────────────────────────────────────
      // 外側のやわらかいブラーリング
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.28)`
      ctx.lineWidth   = 12
      ctx.shadowBlur  = 22
      ctx.shadowColor = col
      ctx.stroke()
      // コアライン（鮮明）
      ctx.beginPath()
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.70)`
      ctx.lineWidth   = 1.6
      ctx.shadowBlur  = 7
      ctx.shadowColor = col
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()

      // ── 3. 脳の内部クリップ ────────────────────────────────────────────
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      // 内部の暗い背景
      const bg = ctx.createRadialGradient(cx, cy - r * 0.1, 0, cx, cy, r)
      bg.addColorStop(0, 'rgba(6, 14, 36, 0.96)')
      bg.addColorStop(1, 'rgba(2, 5, 16, 0.98)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ── 4. 脳のしわ（フラクタルノイズ風テクスチャ）──────────────────
      for (let i = 0; i < 8; i++) {
        const fr = r * (0.18 + i * 0.11)
        ctx.beginPath()
        const S = 90
        for (let s = 0; s <= S; s++) {
          const ang = (s / S) * Math.PI * 2
          const w   = 1 + Math.sin(ang * (3 + i) + i * 1.6 + t * 0.04) * 0.095
          const fx  = cx + Math.cos(ang) * fr * w
          const fy  = cy + Math.sin(ang) * fr * w * 0.87
          s === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy)
        }
        ctx.closePath()
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.10)`
        ctx.lineWidth   = 0.8
        ctx.stroke()
      }

      // ── 5. 液体フィル ──────────────────────────────────────────────────
      // act=0 → 液面が底、act=1 → 液面が頂
      const fillCenterY = cy + r - act * 2 * r

      if (act > 0.012) {
        const STEPS = 160
        const waveY: number[] = []
        for (let i = 0; i <= STEPS; i++) {
          const x    = cx - r + (2 * r * i / STEPS)
          const relX = x - cx
          // 3波合成（振幅・周期・位相がすべて異なる不規則な揺れ）
          waveY.push(
            fillCenterY
            + Math.sin(relX * 0.054 + t * 1.38) * r * 0.073
            + Math.sin(relX * 0.098 + relX * 0.063 + t * 2.08) * r * 0.046
            + Math.sin(relX * 0.081 + t * 0.86) * r * 0.029
          )
        }

        // 液体のパス（波面から底まで）
        ctx.beginPath()
        ctx.moveTo(cx - r, waveY[0])
        for (let i = 1; i <= STEPS; i++) {
          ctx.lineTo(cx - r + (2 * r * i / STEPS), waveY[i])
        }
        ctx.lineTo(cx + r, cy + r + 6)
        ctx.lineTo(cx - r, cy + r + 6)
        ctx.closePath()

        // 縦方向グラデーション: 表面（明るい金）→ 底（深い琥珀）
        const topY = Math.min(...waveY)
        const vGrad = ctx.createLinearGradient(cx, topY, cx, cy + r)
        vGrad.addColorStop(0,    `rgba(${Math.min(255, cr+60)}, ${Math.min(255, cg+28)}, ${Math.max(0, cb-20)}, 0.95)`)
        vGrad.addColorStop(0.38, `rgba(${cr},${cg},${cb},0.92)`)
        vGrad.addColorStop(1,    `rgba(${Math.round(cr*0.22)},${Math.round(cg*0.22)},${Math.round(cb*0.10)},0.95)`)
        ctx.shadowBlur  = 28
        ctx.shadowColor = col
        ctx.fillStyle   = vGrad
        ctx.fill()
        ctx.shadowBlur  = 0

        // 放射状グラデーション: 中心が明るく端が暗い（立体感）
        const hy     = fillCenterY + r * 0.25
        const rGrad  = ctx.createRadialGradient(cx, hy, 0, cx, hy, r * 0.82)
        rGrad.addColorStop(0, `rgba(${Math.min(255, cr+45)},${Math.min(255, cg+20)},${cb},0.22)`)
        rGrad.addColorStop(1, `rgba(0,0,0,0.16)`)
        ctx.beginPath()
        ctx.moveTo(cx - r, waveY[0])
        for (let i = 1; i <= STEPS; i++) {
          ctx.lineTo(cx - r + (2 * r * i / STEPS), waveY[i])
        }
        ctx.lineTo(cx + r, cy + r + 6)
        ctx.lineTo(cx - r, cy + r + 6)
        ctx.closePath()
        ctx.fillStyle = rGrad
        ctx.fill()

        // コースティクス（液面下の揺らぐ屈折光）
        for (let ci = 0; ci < 10; ci++) {
          const seed = ci * 2.3999
          const cpx  = cx + Math.cos(seed + t * 0.28) * r * 0.38
          const cpy  = fillCenterY + r * 0.18 + Math.sin(seed * 1.4 + t * 0.52) * r * 0.22
          const cs   = r * (0.04 + Math.abs(Math.sin(t * 0.72 + ci)) * 0.048)
          const ca   = 0.10 + Math.sin(t * 0.88 + ci * 1.1) * 0.055
          const cGrd = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, cs)
          cGrd.addColorStop(0, `rgba(255,242,175,${ca * 3.2})`)
          cGrd.addColorStop(1, `rgba(255,242,175,0)`)
          ctx.fillStyle = cGrd
          ctx.beginPath()
          ctx.arc(cpx, cpy, cs, 0, Math.PI * 2)
          ctx.fill()
        }

        // 液面ハイライト（波頂の白い反射光）
        ctx.beginPath()
        ctx.moveTo(cx - r, waveY[0])
        for (let i = 1; i <= STEPS; i++) {
          ctx.lineTo(cx - r + (2 * r * i / STEPS), waveY[i])
        }
        ctx.strokeStyle = 'rgba(255,252,210,0.88)'
        ctx.lineWidth   = 1.9
        ctx.shadowBlur  = 14
        ctx.shadowColor = 'rgba(255,255,220,0.95)'
        ctx.stroke()
        ctx.shadowBlur  = 0
      }

      ctx.restore()  // クリップ解除

      // ── 6. パーティクル（ゆっくり漂うドット）────────────────────────
      const NPTS = 70
      for (let i = 0; i < NPTS; i++) {
        const s1   = (i * 137.508) % (Math.PI * 2)
        const s2   = (i * 97.32)   % (Math.PI * 2)
        const s3   = (i * 53.71)   % (Math.PI * 2)
        const dist = r * (1.14 + (i % 17) / 17 * 0.88)
        const ang  = s1 + t * (0.055 + (i % 5) * 0.007)
        const px   = cx + Math.cos(ang) * dist * (1 + 0.05 * Math.sin(t * 0.28 + s2))
        const py   = cy + Math.sin(ang) * dist * (1 + 0.05 * Math.sin(t * 0.34 + s3))
        const sz   = 0.6 + (i % 6) * 0.48
        const alp  = (0.22 + (i % 7) / 7 * 0.55) * (0.38 + act * 0.57)
        ctx.beginPath()
        ctx.arc(px, py, sz, 0, Math.PI * 2)
        ctx.fillStyle   = `rgba(${cr},${cg},${cb},${alp})`
        ctx.shadowBlur  = sz * 3
        ctx.shadowColor = col
        ctx.fill()
      }
      ctx.shadowBlur = 0

      t += 0.016
      animId = requestAnimationFrame(frame)
    }

    animId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animId)
  }, [])  // color/act は ref で読む → 再マウント不要

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', background: 'transparent' }}
    />
  )
}
