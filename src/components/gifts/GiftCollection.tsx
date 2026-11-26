import { motion } from 'framer-motion'

import GiftBox from './GiftBox'
import { giftDesigns } from '../../data/giftDesigns'
import type { PublicAdventDay } from '../../types/advent'

interface GiftCollectionProps {
  days: PublicAdventDay[]
  onSelect: (day: number) => void
}

export default function GiftCollection({
  days,
  onSelect,
}: GiftCollectionProps) {
  const daysById = new Map(
    days.map((day) => [day.id, day]),
  )

  return (
    <div className="gift-collection">
      {giftDesigns.map((design, index) => {
        const day = daysById.get(design.id)

        const unlocked = day?.state === 'available'

        return (
          <motion.div
            key={design.id}
            className="gift-collection-item"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
              delay: index * 0.025,
            }}
          >
            <GiftBox
              day={design.id}
              design={design}
              unlocked={unlocked}
              onClick={() => onSelect(design.id)}
              compact
            />
          </motion.div>
        )
      })}
    </div>
  )
}