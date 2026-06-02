import { createCanvas, loadImage } from 'canvas'
import { writeFileSync } from 'fs'

async function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // 白背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Clarityロゴを中央に描画（余白5%）
  const img = await loadImage('public/clarity-logo.png')
  const padding = size * 0.05
  const logoSize = size - padding * 2
  ctx.drawImage(img, padding, padding, logoSize, logoSize)

  return canvas.toBuffer('image/png')
}

const [i192, i512, i180] = await Promise.all([
  generateIcon(192),
  generateIcon(512),
  generateIcon(180),
])

writeFileSync('public/icon-192.png', i192)
writeFileSync('public/icon-512.png', i512)
writeFileSync('public/apple-touch-icon.png', i180)
console.log('✅ Clarity icons generated!')
