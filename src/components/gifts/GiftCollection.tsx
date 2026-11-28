
import { motion } from 'framer-motion'
import GiftBox from './GiftBox'
import { giftDesigns } from '../../data/giftDesigns'
import type { PublicAdventDay } from '../../types/advent'

interface GiftCollectionProps {
  days: PublicAdventDay[]
  onSelect: (day: number) => void
  onTrapSelect?: () => void
}

export default function GiftCollection({
  days,
  onSelect,
  onTrapSelect,
}: GiftCollectionProps) {
  const daysById = new Map(days.map((day) => [day.id, day]))

  return (
    <div className="gift-collection">
      {giftDesigns.map((design, index) => {
        const day = daysById.get(design.id)
        const unlocked = day?.state === 'available'

        // El día 1 permite abrir la broma mientras siga bloqueado.
        const isTrapDay = design.id === 1 && day?.state === 'locked'

        return (
          <motion.div
            key={design.id}
            className={`
              gift-collection-item
              gift-size-${design.size}
              ${design.id === 25 ? 'gift-collection-final' : ''}
            `}
            data-day={design.id}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: index * 0.025,
              ease: 'easeOut',
            }}
          >
            <GiftBox
              day={design.id}
              design={design}
              unlocked={unlocked}
              allowLockedClick={isTrapDay}
              onClick={() => {
                if (isTrapDay) {
                  onTrapSelect?.()
                  return
                }

                if (unlocked) {
                  onSelect(design.id)
                }
              }}
              compact
            />
          </motion.div>
        )
      })}
    </div>
  )
}
