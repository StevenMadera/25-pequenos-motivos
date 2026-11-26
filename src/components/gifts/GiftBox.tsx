
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'

import type { GiftDesign } from '../../data/giftDesigns'

interface GiftBoxProps {
  day: number
  design: GiftDesign
  unlocked: boolean
  onClick?: () => void
  compact?: boolean
}

type GiftCSSProperties = CSSProperties & {
  [key: `--${string}`]: string
}

export default function GiftBox({
  day,
  design,
  unlocked,
  onClick,
  compact = false,
}: GiftBoxProps) {

  const customStyles: GiftCSSProperties = {
    '--gift-paper': design.paper,
    '--gift-paper-light': design.paperLight,
    '--gift-ribbon': design.ribbon,
    '--gift-ribbon-light': design.ribbonLight,
    '--gift-bow': design.bow,
    '--gift-shadow': design.shadow,
  }

  const handleClick = () => {
    if (!unlocked) return
    onClick?.()
  }

  return (
    <motion.button
      type="button"
      className={`gift-card ${compact ? 'gift-card-compact' : ''} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
      style={customStyles}
      onClick={handleClick}
      disabled={!unlocked}
      whileHover={unlocked ? {
        y: -5,
        scale: 1.035,
      } : undefined}
      whileTap={unlocked ? {
        scale: 0.95,
      } : undefined}
      aria-label={`Regalo del día ${day}${unlocked ? ', disponible' : ', bloqueado'}`}
      aria-disabled={!unlocked}
    >
      <span className="gift-card-number">
        {String(day).padStart(2, '0')}
      </span>

      <span className="gift-card-scene">

        <span className="gift-card-glow" />

        <span className={`gift-object gift-shape-${design.shape}`}>

          <span className={`gift-pattern pattern-${design.pattern}`} />

          <span className="gift-side-highlight" />

          <span className="gift-ribbon-vertical" />
          <span className="gift-ribbon-horizontal" />

          <span className="gift-lid">
            <span className="gift-lid-ribbon" />
          </span>

          <span className="gift-bow">
            <span className="gift-bow-loop left" />
            <span className="gift-bow-loop right" />
            <span className="gift-bow-knot" />
            <span className="gift-bow-tail left" />
            <span className="gift-bow-tail right" />
          </span>

          {design.label && (
            <span className="gift-label">
              {design.label}
            </span>
          )}

          <span className="gift-decoration">
            {design.decoration}
          </span>
        </span>

        <span className="gift-object-shadow" />

        {unlocked && (
          <span className="gift-unlocked-sparkle">
            <Sparkles size={13} />
          </span>
        )}

      </span>

      <span className="gift-card-status">
        {unlocked ? (
          <>
            <Sparkles size={11} />
            Disponible
          </>
        ) : (
          <>
            <Lock size={10} />
            Esperándote
          </>
        )}
      </span>

    </motion.button>
  )
}
