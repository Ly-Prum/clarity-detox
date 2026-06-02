import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // 背景（角丸）
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  const r = size * 0.22
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // 白い円
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2)
  ctx.fill()

  // MD 文字
  ctx.fillStyle = '#3b82f6'
  ctx.font = `bold ${Math.round(size * 0.28)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('MD', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

writeFileSync('public/icon-192.png', generateIcon(192))
writeFileSync('public/icon-512.png', generateIcon(512))
writeFileSync('public/apple-touch-icon.png', generateIcon(180))
console.log('✅ Icons generated!')
