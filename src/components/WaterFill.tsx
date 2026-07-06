import { useEffect, useRef } from 'react'

/* ════════════════════════════════════════════════════════
   WaterFill — canvas tabanlı gerçekçi su simülasyonu.

   Fizik modeli:
   • Seviye  : hedefe yay-sönümle (spring) yükselir, hafif taşar
   • Eğim    : cihaz gamma açısını az-sönümlü yay takip eder →
               telefon çevrilince su gerçek gibi çalkalanıp durulur
   • Slosh   : ivme değişimi + eğim hızı + su ekleme dalga
               genliğini besler, üstel olarak söner
   • Yüzey   : eğim düzlemi + iki katmanlı gezen sinüs dalgaları
   • Kabarcık: su eklenince patlama, çalkantıda süreklilik
   ════════════════════════════════════════════════════════ */

const MIN_FRAC = 0.10 // boşken bile alt barın üstünde ince bir su bandı dursun
const MAX_FRAC = 0.94 // hedefe ulaşınca ekran neredeyse tamamen dolar

type PermissionCapable = { requestPermission?: () => Promise<'granted' | 'denied'> }

interface Bubble {
  x: number
  y: number
  r: number
  v: number      // yükselme hızı px/sn
  drift: number  // yatay salınım fazı
}

export default function WaterFill({ ml, goalMl }: { ml: number; goalMl: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const targetRef = useRef(MIN_FRAC)
  const pourRef = useRef(0) // su eklenince > 0 — döngü içinde tüketilir
  const prevMlRef = useRef(ml)

  const frac = Math.min(ml / Math.max(goalMl, 1), 1)
  targetRef.current = MIN_FRAC + (MAX_FRAC - MIN_FRAC) * frac

  useEffect(() => {
    if (ml > prevMlRef.current) {
      const added = ml - prevMlRef.current
      pourRef.current = Math.min(1.6, pourRef.current + 0.55 + Math.min(added / 900, 0.7))
    }
    prevMlRef.current = ml
  }, [ml])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* ── fizik durumu ── */
    let level = targetRef.current
    let levelV = 0
    let tilt = 0
    let tiltV = 0
    let tiltTarget = 0
    let slosh = 0
    let t = 0
    let hasOrientation = false
    let lastAX: number | null = null
    let bubbles: Bubble[] = []

    const spawnBubble = (burst: boolean) => {
      bubbles.push({
        x: Math.random() * W,
        y: H - Math.random() * (burst ? H * 0.3 : 20),
        r: 1.5 + Math.random() * (burst ? 4 : 2.5),
        v: 26 + Math.random() * 55,
        drift: Math.random() * Math.PI * 2,
      })
    }

    /* ── sensörler ── */
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return
      hasOrientation = true
      const g = Math.max(-32, Math.min(32, e.gamma))
      tiltTarget = g * (Math.PI / 180) * 0.6
    }
    const onMotion = (e: DeviceMotionEvent) => {
      const ax = e.accelerationIncludingGravity?.x
      if (ax == null) return
      if (lastAX != null) {
        const d = ax - lastAX
        slosh = Math.min(2.2, slosh + Math.abs(d) * 0.05)
        tiltV += d * 0.005
      }
      lastAX = ax
    }
    // Masaüstünde sensör yok — imleç hafif eğim versin ki sahne ölü durmasın
    const onPointer = (e: PointerEvent) => {
      if (hasOrientation) return
      tiltTarget = (e.clientX / Math.max(W, 1) - 0.5) * 0.22
    }

    const enableSensors = () => {
      window.addEventListener('deviceorientation', onOrient)
      window.addEventListener('devicemotion', onMotion)
    }
    const DOE = window.DeviceOrientationEvent as (typeof DeviceOrientationEvent & PermissionCapable) | undefined
    const DME = window.DeviceMotionEvent as (typeof DeviceMotionEvent & PermissionCapable) | undefined
    const needsPermission = typeof DOE?.requestPermission === 'function'
    const requestSensors = () => {
      const asks: Promise<unknown>[] = []
      if (typeof DOE?.requestPermission === 'function') asks.push(DOE.requestPermission())
      if (typeof DME?.requestPermission === 'function') asks.push(DME.requestPermission())
      Promise.allSettled(asks).then((results) => {
        if (results.some((r) => r.status === 'fulfilled' && r.value === 'granted')) enableSensors()
      })
    }
    // iOS 13+ sensör izni yalnızca kullanıcı dokunuşu içinde istenebilir
    if (needsPermission) window.addEventListener('pointerdown', requestSensors, { once: true })
    else enableSensors()
    window.addEventListener('pointermove', onPointer)

    /* ── çizim ── */
    const surfaceYAt = (x: number, baseY: number, amp: number, phase: number, dir: 1 | -1): number =>
      baseY
      + (x - W / 2) * Math.tan(tilt)
      + amp * Math.sin(x * 0.011 + phase * dir)
      + amp * 0.45 * Math.sin(x * 0.027 - phase * 1.6 * dir)

    const traceSurface = (baseY: number, amp: number, phase: number, dir: 1 | -1) => {
      ctx.beginPath()
      ctx.moveTo(-4, surfaceYAt(-4, baseY, amp, phase, dir))
      for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, surfaceYAt(x, baseY, amp, phase, dir))
      ctx.lineTo(W + 4, H + 4)
      ctx.lineTo(-4, H + 4)
      ctx.closePath()
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const baseY = H * (1 - level)
      const amp = Math.min(H * 0.045, 3.5 + slosh * 26 + Math.abs(tiltV) * 42)

      // Arka dalga — koyu, yavaş, ters yönde gezer (derinlik hissi)
      ctx.fillStyle = 'rgba(37,99,235,0.26)'
      traceSurface(baseY - 9, amp * 0.72, t * 1.1, 1)
      ctx.fill()

      // Ön gövde — açıktan koyuya dikey degrade
      const grad = ctx.createLinearGradient(0, Math.max(0, baseY - H * 0.06), 0, H)
      grad.addColorStop(0, 'rgba(125,211,252,0.82)')
      grad.addColorStop(0.35, 'rgba(56,189,248,0.72)')
      grad.addColorStop(1, 'rgba(29,78,216,0.88)')
      ctx.fillStyle = grad
      traceSurface(baseY, amp, t * 1.6, -1)
      ctx.fill()

      // Yüzey parlaması — su çizgisinde ince beyaz ışıltı
      ctx.beginPath()
      ctx.moveTo(-4, surfaceYAt(-4, baseY, amp, t * 1.6, -1) - 1)
      for (let x = 0; x <= W + 8; x += 8) {
        ctx.lineTo(x, surfaceYAt(x, baseY, amp, t * 1.6, -1) - 1)
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 1.6
      ctx.stroke()

      // Kabarcıklar
      ctx.strokeStyle = 'rgba(255,255,255,0.38)'
      ctx.lineWidth = 1
      for (const b of bubbles) {
        ctx.beginPath()
        ctx.arc(b.x + Math.sin(b.drift) * 5, b.y, b.r, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    /* ── ana döngü ── */
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      t += dt

      // Su ekleme darbesi: dalga enerjisi + rastgele yalpalama + kabarcık patlaması
      if (pourRef.current > 0) {
        slosh = Math.min(2.4, slosh + pourRef.current)
        tiltV += (Math.random() - 0.5) * 0.5 * pourRef.current
        const burst = Math.round(8 + pourRef.current * 8)
        for (let i = 0; i < burst; i++) spawnBubble(true)
        pourRef.current = 0
      }

      // Seviye yayı — az sönümlü: yükselirken hafifçe taşar, oturur
      const levelAcc = (targetRef.current - level) * 18 - levelV * 5.2
      levelV += levelAcc * dt
      level += levelV * dt

      // Eğim yayı — az sönümlü: gamma'yı takip eder, bırakınca çalkalanarak durulur
      const tiltAcc = (tiltTarget - tilt) * 26 - tiltV * 2.6
      tiltV += tiltAcc * dt
      tilt += tiltV * dt

      // Çalkantı enerjisi: eğim hızından beslenir, üstel söner
      slosh = Math.max(0, slosh * Math.exp(-1.5 * dt) + Math.abs(tiltV) * dt * 2.0)

      // Kabarcık yaşam döngüsü
      if (level > MIN_FRAC + 0.005 && Math.random() < dt * (1.2 + slosh * 12)) spawnBubble(false)
      const baseY = H * (1 - level)
      bubbles = bubbles.filter((b) => {
        b.y -= b.v * dt
        b.drift += dt * 3
        return b.y > baseY + 8
      })
      if (bubbles.length > 80) bubbles.splice(0, bubbles.length - 80)

      draw()
      raf = requestAnimationFrame(frame)
    }

    if (reduced) {
      // Hareket azaltma açık: animasyonsuz, düz yüzeyli tek kare; seviye değişince yeniden çiz
      const drawStatic = () => {
        level = targetRef.current
        tilt = 0
        slosh = 0
        bubbles = []
        draw()
      }
      drawStatic()
      const iv = window.setInterval(drawStatic, 400)
      return () => {
        window.clearInterval(iv)
        window.removeEventListener('resize', resize)
        window.removeEventListener('pointermove', onPointer)
        window.removeEventListener('pointerdown', requestSensors)
        window.removeEventListener('deviceorientation', onOrient)
        window.removeEventListener('devicemotion', onMotion)
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', requestSensors)
      window.removeEventListener('deviceorientation', onOrient)
      window.removeEventListener('devicemotion', onMotion)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, width: '100%', height: '100%' }}
      aria-hidden
    />
  )
}
