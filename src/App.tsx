import useAnalytics from './hooks/useAnalytics'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  AnimatePresence,
  motion,
} from 'framer-motion'
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import WelcomePage from './pages/WelcomePage'
import GiftCollection from './components/gifts/GiftCollection'
import GiftOpening from './components/gifts/GiftOpening'
const AdminLoginPage = lazy(
  () => import('./pages/admin/AdminLoginPage'),
)

const AdminDashboard = lazy(
  () => import('./pages/admin/AdminDashboard'),
)

const AdminGuard = lazy(
  () => import('./components/common/AdminGuard'),
)
const AdminCalendarPage = lazy(
  () => import('./pages/admin/AdminCalendarPage'),
)
import { getAdventCalendar } from './services/advent'
import type { PublicAdventDay } from './types/advent'

type Screen = 'welcome' | 'calendar'

function PublicApp() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [days, setDays] = useState<PublicAdventDay[]>([])
  const [serverDate, setServerDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCalendar = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getAdventCalendar()

      setDays(response.days)
      setServerDate(response.serverDate)
    } catch (err) {
      console.error('Error cargando calendario:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar el calendario.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const selectedGift =
    days.find((day) => day.id === selectedDay) ?? null

  const availableCount = days.filter(
    (day) => day.state === 'available',
  ).length

  const handleSelectDay = (dayId: number) => {
    const selected = days.find((day) => day.id === dayId)

    if (selected?.state !== 'available') {
      return
    }

    setSelectedDay(dayId)
  }

  const { track } = useAnalytics()

useEffect(() => {
  if (screen === 'calendar') {
    track('calendar_view')
  }
}, [screen, track])

useEffect(() => {
  if (selectedGift) {
    track('gift_open', selectedGift.id)
  }
}, [selectedGift, track])

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'welcome' ? (
          <WelcomePage
            key="welcome"
            onStart={() => setScreen('calendar')}
          />
        ) : (
          <motion.main
            key="calendar"
            className="calendar-page"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.45 }}
          >
            <header className="calendar-header">
              <button
                className="back-button"
                onClick={() => setScreen('welcome')}
              >
                <ArrowLeft size={19} />
                <span>Volver</span>
              </button>

              <span className="calendar-header-label">
                DICIEMBRE · 2026
              </span>
            </header>

            <section className="calendar-intro">
              <span className="calendar-small-label">
                <Sparkles size={13} />
                UNA SORPRESA CADA DÍA
              </span>

              <h1>
                25 pequeños motivos
                <br />
                <span>para sonreír</span>
              </h1>

              <p>
                Cada día guarda un pequeño detalle.
                Algunos recuerdos, algunas palabras y
                muchas razones para sonreír.
              </p>
            </section>

            <section className="calendar-progress">
              <div>
                <span>Tu colección de diciembre</span>
                <strong>{availableCount} de 25 regalos</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(availableCount / 25) * 100}%`,
                  }}
                />
              </div>

              <small>
                {serverDate
                  ? 'Calendario sincronizado.'
                  : 'Conectando con el calendario...'}
              </small>
            </section>

            <section className="calendar-gifts-section">
              {loading ? (
                <div className="calendar-loading">
                  <div className="admin-loading-spinner" />
                  <p>Preparando tus pequeños motivos...</p>
                </div>
              ) : error ? (
                <div className="calendar-error">
                  <p>No pudimos cargar el calendario.</p>
                  <small>{error}</small>

                  <button
                    type="button"
                    onClick={() => void loadCalendar()}
                  >
                    <RefreshCw size={15} />
                    Intentar nuevamente
                  </button>
                </div>
              ) : (
                <GiftCollection
                  days={days}
                  onSelect={handleSelectDay}
                />
              )}
            </section>

            <footer className="calendar-footer">
              <div className="calendar-footer-heart">
                <span>♡</span>
              </div>
              <p>Un detalle preparado especialmente para ti.</p>
            </footer>
          </motion.main>
        )}
      </AnimatePresence>

      <GiftOpening
  day={selectedGift}
  onClose={() => {
    if (selectedGift) {
      track('gift_close', selectedGift.id)
    }

    setSelectedDay(null)
  }}
/>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<PublicApp />} />

                <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <div className="admin-loading">
                  <div className="admin-loading-spinner" />
                  <span>Cargando administración...</span>
                </div>
              }
            >
              <AdminLoginPage />
            </Suspense>
          }
        />

        <Route
          element={
            <Suspense
              fallback={
                <div className="admin-loading">
                  <div className="admin-loading-spinner" />
                  <span>Verificando acceso...</span>
                </div>
              }
            >
              <AdminGuard />
            </Suspense>
          }
        >
          <Route
            path="/admin/dashboard"
            element={
              <Suspense
                fallback={
                  <div className="admin-loading">
                    <div className="admin-loading-spinner" />
                    <span>Cargando dashboard...</span>
                  </div>
                }
              >
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
  path="/admin/calendar"
  element={
    <Suspense
      fallback={
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <span>Cargando calendario...</span>
        </div>
      }
    >
      <AdminCalendarPage />
    </Suspense>
  }
/>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
