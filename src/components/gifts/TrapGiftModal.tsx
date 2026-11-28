
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Gift,
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import './TrapGiftModal.css'

import type {
  TrackedEvent,
  AnalyticsMetadata,
} from '../../services/analytics'

interface TrapGiftModalProps {
  unlockDate: string
  onClose: () => void
  onTrack: (
    eventName: TrackedEvent,
    dayId?: number,
    metadata?: AnalyticsMetadata,
  ) => void
  videoSrc?: string
}

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const messages = [
  'JAJAJA ¡CASI! ',
  'De verdad creíste que sería tan fácil?',
  'No me vas a atraparrrr.',
  'Mejor aprende a esperar mi vida. ',
  'Uy qué impaciencia!!!! ',
  'El regalo no se va a escapar... yo sí.',
]

function getCountdown(unlockDate: string): Countdown {
  // Las fechas del calendario se interpretan en hora de Bogotá (UTC-5).
  const target = new Date(`${unlockDate}T00:00:00-05:00`).getTime()
  const remaining = Math.max(0, target - Date.now())

  const days = Math.floor(remaining / 86_400_000)
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  const seconds = Math.floor((remaining % 60_000) / 1_000)

  return { days, hours, minutes, seconds }
}

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export default function TrapGiftModal({
  unlockDate,
  onClose,
  onTrack,
  videoSrc = `${import.meta.env.BASE_URL}assets/trap-video.mp4`,
}: TrapGiftModalProps) {
  const [phase, setPhase] = useState<'opening' | 'reveal'>('opening')
  const [countdown, setCountdown] = useState(() => getCountdown(unlockDate))
  const [muted, setMuted] = useState(false)
  const [escapeMessage, setEscapeMessage] = useState('')
  const [escapeCount, setEscapeCount] = useState(0)
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })

  const escapeAreaRef = useRef<HTMLDivElement>(null)
  const escapeButtonRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Tiempo desde que se abrió la sorpresa.
  const openedAtRef = useRef(Date.now())

  // Evita registrar múltiples reproducciones del mismo video.
  const videoPlayTracked = useRef(false)

  // Evita registrar el cierre más de una vez.
  const closeTracked = useRef(false)

  const particles = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        left: `${(index * 37 + 11) % 100}%`,
        delay: `${(index % 9) * 0.16}s`,
        duration: `${2.2 + (index % 5) * 0.45}s`,
        size: 3 + (index % 4) * 2,
      })),
    [],
  )

  useEffect(() => {
    vibrate([80, 50, 120])

    const openingTimer = window.setTimeout(() => {
      setPhase('reveal')
      vibrate([120, 70, 180, 70, 250])
    }, 5600)

    const countdownTimer = window.setInterval(() => {
      setCountdown(getCountdown(unlockDate))
    }, 1000)

    return () => {
      window.clearTimeout(openingTimer)
      window.clearInterval(countdownTimer)
      vibrate(0)
    }
  }, [unlockDate])

  // Reproducir el video al terminar la animación de apertura.
  useEffect(() => {
    if (phase === 'reveal' && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Algunos navegadores requieren interacción para reproducir el video.
      })
    }
  }, [phase])

  // Registrar el cierre y el tiempo que permaneció abierta la sorpresa.
  function closeTrap() {
    if (closeTracked.current) return

    closeTracked.current = true

    const durationSeconds = Math.max(
      0,
      Math.floor((Date.now() - openedAtRef.current) / 1000),
    )

    onTrack('trap_close', 1, {
      durationSeconds,
    })

    onClose()
  }

  // Registrar que decidió esperar.
  function waitForGift() {
    onTrack('trap_wait_click', 1)
    closeTrap()
  }

  // Mover el botón escapista y registrar cada interacción.
  function escapeButton() {
    const area = escapeAreaRef.current
    const button = escapeButtonRef.current

    if (!area || !button) return

    const areaRect = area.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()

    const maxX = Math.max(0, areaRect.width - buttonRect.width)
    const maxY = Math.max(0, areaRect.height - buttonRect.height)

    let nextX = Math.random() * maxX
    let nextY = Math.random() * maxY

    // Evita que el botón se quede demasiado cerca de su posición anterior.
    if (
      Math.abs(nextX - buttonPosition.x) < 65 &&
      Math.abs(nextY - buttonPosition.y) < 45
    ) {
      nextX = maxX - nextX
      nextY = maxY - nextY
    }

    setButtonPosition({
      x: Math.min(maxX, Math.max(0, nextX)),
      y: Math.min(maxY, Math.max(0, nextY)),
    })

    const nextCount = escapeCount + 1

    setEscapeCount(nextCount)
    setEscapeMessage(messages[(nextCount - 1) % messages.length])

    vibrate(35)
  }

  // Registrar los intentos de alcanzar el botón.
  function handleEscapeAttempt(interaction: string) {
    const nextAttempt = escapeCount + 1

    onTrack('trap_escape_attempt', 1, {
      interaction,
      attemptNumber: nextAttempt,
    })

    escapeButton()
  }

  const countdownReached =
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes === 0 &&
    countdown.seconds === 0

  return (
    <AnimatePresence>
      <motion.div
        className="trap-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Sorpresa del calendario"
      >
        <button
          className="trap-close-button"
          onClick={closeTrap}
          aria-label="Cerrar"
          type="button"
        >
          <X size={21} />
        </button>

        <div className="trap-particles" aria-hidden="true">
          {particles.map((particle) => (
            <span
              key={particle.id}
              className="trap-particle"
              style={{
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {phase === 'opening' ? (
            <motion.section
              key="opening"
              className="trap-opening"
              initial={{ scale: 0.65, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.3, opacity: 0, filter: 'blur(16px)' }}
              transition={{ duration: 0.65 }}
            >
              <motion.div
                className="trap-opening-aura"
                animate={{
                  scale: [0.9, 1.18, 0.95, 1.12],
                  opacity: [0.35, 0.85, 0.45, 0.8],
                }}
                transition={{ duration: 2.1, repeat: Infinity }}
              />

              <motion.div
                className="trap-opening-icon"
                animate={{
                  rotate: [-4, 4, -3, 3, 0],
                  scale: [1, 1.08, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Gift size={82} strokeWidth={1.25} />
                <Sparkles className="trap-opening-sparkle" size={30} />
              </motion.div>

              <motion.p
                className="trap-eyebrow"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                ALGO MUY ESPECIAL TE ESPERA
              </motion.p>

              <h2 className="trap-opening-title">
                ¿Estás preparada?
              </h2>

              <p className="trap-opening-subtitle">
                He preparado algo que no vas a olvidar...
              </p>

              <motion.div
                className="trap-opening-progress"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5.5, ease: 'easeInOut' }}
              />

              <motion.p
                className="trap-opening-wait"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Preparando tu sorpresa...
              </motion.p>
            </motion.section>
          ) : (
            <motion.section
              key="reveal"
              className="trap-reveal"
              initial={{ opacity: 0, scale: 0.78, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 17, stiffness: 120 }}
            >
              <motion.div
                className="trap-video-frame"
                initial={{ rotate: -2, scale: 0.85 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <video
                  ref={videoRef}
                  className="trap-video"
                  src={videoSrc}
                  autoPlay
                  loop
                  playsInline
                  muted={muted}
                  controls
                  preload="auto"
                  onPlay={() => {
                    if (!videoPlayTracked.current) {
                      videoPlayTracked.current = true
                      onTrack('trap_video_play', 1)
                    }
                  }}
                />

                <button
                  type="button"
                  className="trap-volume-button"
                  onClick={() => {
                    const nextMuted = !muted

                    setMuted(nextMuted)

                    onTrack(
                      nextMuted
                        ? 'trap_sound_muted'
                        : 'trap_sound_enabled',
                      1,
                    )
                  }}
                  aria-label={muted ? 'Activar sonido' : 'Silenciar video'}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  {muted ? 'Activar sonido' : 'Silenciar'}
                </button>
              </motion.div>

              <motion.div
                className="trap-message"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="trap-message-kicker">
                  <Heart size={15} fill="currentColor" />
                  SORPRESA, PRECIOSA
                  <Heart size={15} fill="currentColor" />
                </div>

                <h2>¿QUÉ PENSASTE? JAJAJSAJHS</h2>

                <p className="trap-countdown-intro">
                  ¡Todavía falta para que puedas abrirlooo!
                </p>

                {countdownReached ? (
                  <p className="trap-ready-message">
                    ¡AHORA SÍ! ¡YA PUEDES ABRIR TU REGALO! ❤️
                  </p>
                ) : (
                  <div className="trap-countdown">
                    <div>
                      <strong>{countdown.days}</strong>
                      <span>{countdown.days === 1 ? 'día' : 'días'}</span>
                    </div>

                    <div>
                      <strong>{String(countdown.hours).padStart(2, '0')}</strong>
                      <span>horas</span>
                    </div>

                    <div>
                      <strong>{String(countdown.minutes).padStart(2, '0')}</strong>
                      <span>minutos</span>
                    </div>

                    <div>
                      <strong>{String(countdown.seconds).padStart(2, '0')}</strong>
                      <span>segundos</span>
                    </div>
                  </div>
                )}

                <p className="trap-tease">
                  ¿Qué pasó? ¿No sabes esperar?
                </p>
              </motion.div>

              <div className="trap-actions">
                <button
                  type="button"
                  className="trap-wait-button"
                  onClick={waitForGift}
                >
                  Bueno, esperaré…
                </button>

                <div className="trap-escape-area" ref={escapeAreaRef}>
                  <button
                    ref={escapeButtonRef}
                    type="button"
                    className="trap-runaway-button"
                    style={{
                      left: `${buttonPosition.x}px`,
                      top: `${buttonPosition.y}px`,
                    }}
                    onPointerEnter={(event) => {
                      if (event.pointerType === 'mouse') {
                        onTrack('trap_escape_hover', 1, {
                          interaction: 'mouse',
                        })

                        escapeButton()
                      }
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      handleEscapeAttempt(event.pointerType)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleEscapeAttempt('keyboard')
                      }
                    }}
                  >
                    ¡QUIERO VERLO YA ANDRES!
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {escapeMessage && (
                    <motion.p
                      key={escapeCount}
                      className="trap-escape-message"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {escapeMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
