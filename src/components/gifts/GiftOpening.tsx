import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Heart, Sparkles } from 'lucide-react'

import type { PublicAdventDay } from '../../types/advent'

interface GiftOpeningProps {
  day: PublicAdventDay | null
  onClose: () => void
}

export default function GiftOpening({
  day,
  onClose,
}: GiftOpeningProps) {
  const content = day?.content

  return (
    <AnimatePresence>
      {day && (
        <motion.div
          className="gift-opening-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.article
            className="gift-opening"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-opening-title"
            initial={{ opacity: 0, y: 35, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="gift-opening-header">
              <button
                type="button"
                className="gift-opening-back"
                onClick={onClose}
                aria-label="Volver al calendario"
              >
                <ArrowLeft size={19} />
                <span>Volver</span>
              </button>

              <span className="gift-opening-counter">
                DÍA {String(day.id).padStart(2, '0')} · 25
              </span>
            </header>

            <div className="gift-opening-content">
              <motion.div
                className="gift-opening-icon"
                initial={{ rotate: -12, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
              >
                <span className="gift-opening-icon-glow" />
                <Heart size={34} fill="currentColor" />
                <Sparkles
                  className="gift-opening-sparkle"
                  size={18}
                />
              </motion.div>

              <motion.p
                className="gift-opening-eyebrow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                UN PEQUEÑO DETALLE PARA TI
              </motion.p>

              <motion.h2
                id="gift-opening-title"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {content?.title || 'Un pequeño motivo para sonreír'}
              </motion.h2>

              <motion.div
                className="gift-opening-divider"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span />
                <Heart size={13} fill="currentColor" />
                <span />
              </motion.div>

              <motion.p
                className="gift-opening-message"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {content?.message ||
                  'Este espacio está preparado para su contenido.'}
              </motion.p>

              {content?.detail && (
                <motion.div
                  className="gift-opening-detail"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  {content.detail}
                </motion.div>
              )}

              {content?.closing && (
                <motion.p
                  className="gift-opening-closing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                >
                  {content.closing}
                </motion.p>
              )}

              <motion.button
                type="button"
                className="gift-opening-button"
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                Volver a mis regalos
                <span>♡</span>
              </motion.button>
            </div>

            <footer className="gift-opening-footer">
              PREPARADO CON CARIÑO
            </footer>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}