
import { motion } from 'framer-motion'
import { Heart, Sparkles, Stars } from 'lucide-react'

interface WelcomePageProps {
  onStart: () => void
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <main className="welcome-page">

      {/* Fondo decorativo */}
      <div className="welcome-background">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        {Array.from({ length: 18 }).map((_, index) => (
          <motion.div
            key={index}
            className="floating-particle"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: [0.15, 0.7, 0.15],
              y: [-10, -70, -10],
              x: [0, index % 2 === 0 ? 15 : -15, 0],
            }}
            transition={{
              duration: 5 + (index % 4),
              repeat: Infinity,
              delay: index * 0.3,
              ease: 'easeInOut',
            }}
            style={{
              left: `${(index * 37 + 11) % 100}%`,
              top: `${(index * 23 + 9) % 100}%`,
            }}
          >
            {index % 3 === 0 ? '✧' : '·'}
          </motion.div>
        ))}
      </div>

      {/* Contenido principal */}
      <section className="welcome-content">

        <motion.div
          className="welcome-eyebrow"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Sparkles size={14} />
          <span>UNA PEQUEÑA SORPRESA PARA TI</span>
          <Sparkles size={14} />
        </motion.div>

        <motion.div
          className="gift-stage"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 1.1,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="gift-halo" />

          <motion.div
            className="gift-decoration decoration-left"
            animate={{ rotate: [0, 8, -5, 0], y: [0, -7, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            ✧
          </motion.div>

          <motion.div
            className="gift-decoration decoration-right"
            animate={{ rotate: [0, -10, 6, 0], y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            ♡
          </motion.div>

          {/* Caja de regalo */}
          <motion.div
            className="hero-gift"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="hero-gift-shadow" />

            <div className="hero-gift-lid">
              <div className="hero-gift-lid-ribbon" />
              <div className="hero-gift-bow">
                <span className="bow-loop bow-loop-left" />
                <span className="bow-loop bow-loop-right" />
                <span className="bow-knot" />
                <span className="bow-tail bow-tail-left" />
                <span className="bow-tail bow-tail-right" />
              </div>
            </div>

            <div className="hero-gift-box">
              <div className="hero-gift-ribbon" />
              <div className="hero-gift-front">
                <Heart size={23} fill="currentColor" />
              </div>
            </div>
          </motion.div>

          <div className="gift-ground-decoration">
            <span>✧</span>
            <span>·</span>
            <span>✧</span>
          </div>
        </motion.div>

        <motion.div
          className="welcome-copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="welcome-pretitle">
            Para ti, Paula
          </p>

          <h1>
            Un diciembre
            <br />
            <span>diferente...</span>
          </h1>

          <div className="welcome-divider">
            <span />
            <Stars size={15} />
            <span />
          </div>

          <p className="welcome-description">
            Preparé algo para ti. Un pequeño detalle
            para cada día, porque hay personas que
            hacen que cualquier mes sea especial.
          </p>

          <p className="welcome-personal-note">
            Y tú eres una de ellas.
          </p>
        </motion.div>

        <motion.div
          className="welcome-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.button
            className="welcome-button"
            onClick={onStart}
            whileHover={{ scale: 1.035 }}
            whileTap={{ scale: 0.96 }}
          >
            <span>Descubrir mi diciembre</span>
            <span className="button-arrow">→</span>
          </motion.button>

          <p className="welcome-footer">
            <Heart size={11} fill="currentColor" />
            Hecho especialmente para ti
          </p>
        </motion.div>

      </section>
    </main>
  )
}
