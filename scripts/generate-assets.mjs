import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const root = path.resolve(import.meta.dirname, "..")
const assetsDir = path.join(root, "assets")
fs.mkdirSync(assetsDir, { recursive: true })

const VOID = [14, 22, 33, 255]

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  typeBuffer.copy(out, 4)
  data.copy(out, 8)
  out.writeUInt32BE(crc(Buffer.concat([typeBuffer, data])), 8 + data.length)
  return out
}

function silverColor(x, y, top, left, width, height) {
  const vertical = (y - top) / Math.max(height, 1)
  const horizontal = (x - left) / Math.max(width, 1)
  const base = 118 + (1 - vertical) * 110
  const sheen = Math.max(0, 1 - Math.abs(horizontal - 0.28) * 4.5) * 55
  const shadow = vertical * 28
  const r = Math.min(255, Math.round(base + sheen - shadow))
  const g = Math.min(255, Math.round(base + 6 + sheen - shadow))
  const b = Math.min(255, Math.round(base + 12 + sheen - shadow))
  return [r, g, b, 255]
}

function fillRect(pixels, x, y, w, h, colorFn) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      pixels.set(`${px},${py}`, colorFn(px, py))
    }
  }
}

function drawDigitTwo(pixels, left, top, scale) {
  const w = 18 * scale
  const h = 28 * scale
  fillRect(pixels, left, top, w, 4 * scale, (x, y) => silverColor(x, y, top, left, w, h))
  fillRect(pixels, left + w - 4 * scale, top, 4 * scale, 10 * scale, (x, y) => silverColor(x, y, top, left, w, h))
  fillRect(pixels, left, top + 10 * scale, w, 4 * scale, (x, y) => silverColor(x, y, top, left, w, h))
  fillRect(pixels, left, top + 10 * scale, 4 * scale, 14 * scale, (x, y) => silverColor(x, y, top, left, w, h))
  fillRect(pixels, left, top + h - 4 * scale, w, 4 * scale, (x, y) => silverColor(x, y, top, left, w, h))
}

function drawDigitOne(pixels, left, top, scale) {
  const w = 12 * scale
  const h = 28 * scale
  fillRect(pixels, left + 4 * scale, top, 4 * scale, h, (x, y) => silverColor(x, y, top, left, w, h))
  fillRect(pixels, left, top + 4 * scale, 8 * scale, 4 * scale, (x, y) => silverColor(x, y, top, left, w, h))
}

function buildLogoPixels(width, height) {
  const pixels = new Map()
  const scale = Math.max(8, Math.round(width / 64))
  const digitHeight = 28 * scale
  const twoWidth = 18 * scale
  const oneWidth = 12 * scale
  const gap = 4 * scale
  const totalWidth = twoWidth + gap + oneWidth
  const left = Math.round((width - totalWidth) / 2)
  const top = Math.round((height - digitHeight) / 2)

  drawDigitTwo(pixels, left, top, scale)
  drawDigitOne(pixels, left + twoWidth + gap, top, scale)
  return pixels
}

function raster(width, height, transparent = false) {
  const bg = transparent ? [0, 0, 0, 0] : VOID
  const pixels = buildLogoPixels(width, height)
  const data = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = pixels.get(`${x},${y}`) ?? bg
      const offset = (y * width + x) * 4
      data[offset] = color[0]
      data[offset + 1] = color[1]
      data[offset + 2] = color[2]
      data[offset + 3] = color[3]
    }
  }
  return data
}

function writePngFromRaster(fileName, width, height, rasterData) {
  const data = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    data[y * (width * 4 + 1)] = 0
    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4
      const dst = y * (width * 4 + 1) + 1 + x * 4
      data[dst] = rasterData[src]
      data[dst + 1] = rasterData[src + 1]
      data[dst + 2] = rasterData[src + 2]
      data[dst + 3] = rasterData[src + 3]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(data)),
    chunk("IEND", Buffer.alloc(0)),
  ])

  fs.writeFileSync(path.join(assetsDir, fileName), png)
}

function composeSplash(width, height, logoSize) {
  const data = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height * 4; i += 4) {
    data[i] = VOID[0]
    data[i + 1] = VOID[1]
    data[i + 2] = VOID[2]
    data[i + 3] = VOID[3]
  }

  const logo = raster(logoSize, logoSize)
  const left = Math.round((width - logoSize) / 2)
  const top = Math.round(height / 2 - logoSize / 2 - 90)

  for (let y = 0; y < logoSize; y += 1) {
    for (let x = 0; x < logoSize; x += 1) {
      const src = (y * logoSize + x) * 4
      const dst = ((top + y) * width + (left + x)) * 4
      if (top + y < 0 || top + y >= height || left + x < 0 || left + x >= width) continue
      data[dst] = logo[src]
      data[dst + 1] = logo[src + 1]
      data[dst + 2] = logo[src + 2]
      data[dst + 3] = logo[src + 3]
    }
  }

  return data
}

writePngFromRaster("icon.png", 1024, 1024, raster(1024, 1024))
writePngFromRaster("adaptive-icon.png", 1024, 1024, raster(1024, 1024, true))

const splashWidth = 1080
const splashHeight = 1920
writePngFromRaster("splash.png", splashWidth, splashHeight, composeSplash(splashWidth, splashHeight, 460))

const notification = raster(96, 96, true)
for (let i = 0; i < notification.length; i += 4) {
  if (notification[i + 3] !== 0) {
    notification[i] = 255
    notification[i + 1] = 255
    notification[i + 2] = 255
    notification[i + 3] = 255
  }
}
writePngFromRaster("notification-icon.png", 96, 96, notification)

console.log(`Generated twentyone Android assets in ${assetsDir}`)
