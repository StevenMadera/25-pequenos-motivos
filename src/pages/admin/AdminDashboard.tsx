import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  Clock3,
  Eye,
  Gift,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Users,
  Globe,
  FileEdit,
} from 'lucide-react'

import { supabase } from '../../services/supabase'

interface DashboardStats {
  totalDays: number
  publishedDays: number
  totalSessions: number
  pageViews: number
  calendarViews: number
  giftOpens: number
  averageSeconds: number
  activeSessions: number
}

interface SessionRecord {
  session_id: string
  started_at: string
  last_seen_at: string
  ended_at: string | null
  active_seconds: number
  device_type: string | null
  browser_family: string | null
}

interface EventRecord {
  occurred_at: string
  event_name: string
  day_id: number | null
}

interface DailyActivity {
  date: string
  label: string
  visits: number
}

const TIMEZONE = 'America/Bogota'

function getLocalDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function getLastSevenDays(): DailyActivity[] {
  const today = new Date()
  const days: DailyActivity[] = []

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(today)
    date.setDate(date.getDate() - offset)

    const dateKey = getLocalDate(date)

    const label = new Intl.DateTimeFormat('es-CO', {
      timeZone: TIMEZONE,
      weekday: 'short',
    })
      .format(date)
      .replace('.', '')

    days.push({
      date: dateKey,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      visits: 0,
    })
  }

  return days
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0 min'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 1) {
    return `${remainingSeconds} s`
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0
    ? `${hours} h ${remainingMinutes} min`
    : `${hours} h`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getDeviceLabel(device: string | null): string {
  switch ((device || '').toLowerCase()) {
    case 'mobile':
      return 'Móvil'
    case 'tablet':
      return 'Tableta'
    case 'desktop':
      return 'Computador'
    default:
      return 'No identificado'
  }
}

function getDeviceIcon(device: string | null) {
  switch ((device || '').toLowerCase()) {
    case 'mobile':
      return Smartphone
    case 'tablet':
      return Tablet
    default:
      return Monitor
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalDays: 0,
    publishedDays: 0,
    totalSessions: 0,
    pageViews: 0,
    calendarViews: 0,
    giftOpens: 0,
    averageSeconds: 0,
    activeSessions: 0,
  })

  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>(
    getLastSevenDays(),
  )
  const [devices, setDevices] = useState<Record<string, number>>({})
  const [browsers, setBrowsers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      setEmail(user?.email ?? '')

      const [
        daysResult,
        publishedResult,
        sessionsCountResult,
        pageViewsResult,
        calendarViewsResult,
        giftOpensResult,
        sessionsResult,
        eventsResult,
      ] = await Promise.all([
        supabase
          .from('advent_days')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('advent_days')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),

        supabase
          .from('visitor_sessions')
          .select('session_id', { count: 'exact', head: true }),

        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_name', 'page_view'),

        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_name', 'calendar_view'),

        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_name', 'gift_open'),

        supabase
          .from('visitor_sessions')
          .select(
            'session_id, started_at, last_seen_at, ended_at, active_seconds, device_type, browser_family',
          )
          .order('started_at', { ascending: false })
          .limit(500),

        supabase
          .from('analytics_events')
          .select('occurred_at, event_name, day_id')
          .eq('event_name', 'page_view')
          .order('occurred_at', { ascending: false })
          .limit(5000),
      ])

      const results = [
        daysResult,
        publishedResult,
        sessionsCountResult,
        pageViewsResult,
        calendarViewsResult,
        giftOpensResult,
        sessionsResult,
        eventsResult,
      ]

      const failedResult = results.find((result) => result.error)

      if (failedResult?.error) {
        throw failedResult.error
      }

      const sessionRows = (sessionsResult.data ?? []) as SessionRecord[]
      const eventRows = (eventsResult.data ?? []) as EventRecord[]

      const totalActiveSeconds = sessionRows.reduce(
        (total, session) => total + (session.active_seconds || 0),
        0,
      )

      const averageSeconds = sessionRows.length > 0
        ? Math.round(totalActiveSeconds / sessionRows.length)
        : 0

      const now = Date.now()

      const activeSessions = sessionRows.filter((session) => {
        if (session.ended_at) return false

        const lastSeen = new Date(session.last_seen_at).getTime()

        return now - lastSeen <= 2 * 60 * 1000
      }).length

      setStats({
        totalDays: daysResult.count ?? 0,
        publishedDays: publishedResult.count ?? 0,
        totalSessions: sessionsCountResult.count ?? 0,
        pageViews: pageViewsResult.count ?? 0,
        calendarViews: calendarViewsResult.count ?? 0,
        giftOpens: giftOpensResult.count ?? 0,
        averageSeconds,
        activeSessions,
      })

      setSessions(sessionRows)

      const activity = getLastSevenDays()

      for (const event of eventRows) {
        const eventDate = getLocalDate(new Date(event.occurred_at))
        const matchingDay = activity.find(
          (day) => day.date === eventDate,
        )

        if (matchingDay) {
          matchingDay.visits += 1
        }
      }

      setDailyActivity(activity)

      const deviceCounts: Record<string, number> = {}
      const browserCounts: Record<string, number> = {}

      for (const session of sessionRows) {
        const device = getDeviceLabel(session.device_type)
        const browser = session.browser_family || 'No identificado'

        deviceCounts[device] = (deviceCounts[device] || 0) + 1
        browserCounts[browser] = (browserCounts[browser] || 0) + 1
      }

      setDevices(deviceCounts)
      setBrowsers(browserCounts)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error cargando dashboard:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los datos del panel.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin', { replace: true })
  }

  const maxVisits = Math.max(
    1,
    ...dailyActivity.map((day) => day.visits),
  )

  const deviceTotal = Object.values(devices).reduce(
    (total, value) => total + value,
    0,
  )

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Gift size={21} />
          </div>

          <div>
            <strong>Pequeños motivos</strong>
            <span>Administración</span>
          </div>
        </div>

        <nav className="admin-navigation">
  <Link
    to="/admin/dashboard"
    className="admin-nav-item active"
  >
    <CalendarDays size={18} />
    <span>Resumen general</span>
  </Link>

  <Link
    to="/admin/calendar"
    className="admin-nav-item"
  >
    <FileEdit size={18} />
    <span>Gestionar calendario</span>
  </Link>
</nav>

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              PANEL DE CONTROL
            </span>
            <h1>Resumen general</h1>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-refresh-button"
              onClick={() => void loadDashboard(true)}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'admin-spin' : ''}
              />
              Actualizar
            </button>

            <div className="admin-user">
              <ShieldCheck size={17} />
              <span>{email}</span>
            </div>
          </div>
        </header>

        <div className="admin-welcome">
          <div>
            <h2>Tu calendario está tomando forma.</h2>
            <p>
              Supervisa las visitas y la actividad de la experiencia digital.
            </p>
          </div>

          <CalendarDays size={34} />
        </div>

        {error && (
          <p className="admin-dashboard-error" role="alert">
            No fue posible cargar todos los datos: {error}
          </p>
        )}

        <section className="admin-stats">
          <article className="admin-stat-card">
            <div className="admin-stat-icon">
              <Eye size={20} />
            </div>
            <span>Visitas registradas</span>
            <strong>{loading ? '—' : stats.pageViews}</strong>
            <small>Vistas de página acumuladas</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon">
              <Users size={20} />
            </div>
            <span>Sesiones</span>
            <strong>{loading ? '—' : stats.totalSessions}</strong>
            <small>
              {stats.activeSessions} activas en los últimos 2 minutos
            </small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon">
              <Clock3 size={20} />
            </div>
            <span>Permanencia promedio</span>
            <strong>
              {loading ? '—' : formatDuration(stats.averageSeconds)}
            </strong>
            <small>Calculada sobre las últimas 500 sesiones</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon">
              <Gift size={20} />
            </div>
            <span>Regalos abiertos</span>
            <strong>{loading ? '—' : stats.giftOpens}</strong>
            <small>Interacciones registradas</small>
          </article>
        </section>

        <section className="admin-analytics-grid">
          <article className="admin-panel-card admin-activity-card">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-section-eyebrow">
                  TRÁFICO
                </span>
                <h3>Actividad de los últimos 7 días</h3>
              </div>

              <Activity size={20} />
            </div>

            <div className="admin-chart">
              {dailyActivity.map((day) => (
                <div className="admin-chart-column" key={day.date}>
                  <strong>{day.visits}</strong>

                  <div className="admin-chart-track">
                    <div
                      className="admin-chart-bar"
                      style={{
                        height: `${Math.max(
                          day.visits > 0 ? 8 : 2,
                          (day.visits / maxVisits) * 100,
                        )}%`,
                      }}
                    />
                  </div>

                  <span>{day.label}</span>
                </div>
              ))}
            </div>

            <p className="admin-panel-footnote">
              Visitas registradas por día, según la hora de Bogotá.
            </p>
          </article>

          <article className="admin-panel-card">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-section-eyebrow">
                  DISPOSITIVOS
                </span>
                <h3>Desde dónde ingresan</h3>
              </div>

              <Monitor size={20} />
            </div>

            <div className="admin-breakdown">
              {Object.entries(devices).length === 0 ? (
                <p className="admin-empty-state">
                  Aún no hay datos de dispositivos.
                </p>
              ) : (
                Object.entries(devices)
                  .sort((a, b) => b[1] - a[1])
                  .map(([device, count]) => {
                    const percentage = deviceTotal > 0
                      ? Math.round((count / deviceTotal) * 100)
                      : 0

                    const DeviceIcon =
                      device === 'Móvil'
                        ? Smartphone
                        : device === 'Tableta'
                          ? Tablet
                          : Monitor

                    return (
                      <div className="admin-breakdown-item" key={device}>
                        <div className="admin-breakdown-label">
                          <span>
                            <DeviceIcon size={16} />
                            {device}
                          </span>
                          <strong>{percentage}%</strong>
                        </div>

                        <div className="admin-breakdown-track">
                          <div
                            className="admin-breakdown-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <small>{count} sesiones recientes</small>
                      </div>
                    )
                  })
              )}
            </div>
          </article>
        </section>

        <section className="admin-analytics-grid admin-secondary-grid">
          <article className="admin-panel-card">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-section-eyebrow">
                  NAVEGADORES
                </span>
                <h3>Navegadores utilizados</h3>
              </div>

              <Globe size={20} />
            </div>

            <div className="admin-browser-list">
              {Object.entries(browsers).length === 0 ? (
                <p className="admin-empty-state">
                  Aún no hay datos de navegadores.
                </p>
              ) : (
                Object.entries(browsers)
                  .sort((a, b) => b[1] - a[1])
                  .map(([browser, count]) => (
                    <div className="admin-browser-row" key={browser}>
                      <span>{browser}</span>
                      <strong>{count}</strong>
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="admin-panel-card">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-section-eyebrow">
                  INTERACCIONES
                </span>
                <h3>Actividad dentro del calendario</h3>
              </div>

              <Activity size={20} />
            </div>

            <div className="admin-interaction-list">
              <div>
                <span>Vistas del calendario</span>
                <strong>{loading ? '—' : stats.calendarViews}</strong>
              </div>

              <div>
                <span>Aperturas de regalos</span>
                <strong>{loading ? '—' : stats.giftOpens}</strong>
              </div>

              <div>
                <span>Días registrados</span>
                <strong>{loading ? '—' : stats.totalDays}</strong>
              </div>

              <div>
                <span>Días publicados</span>
                <strong>{loading ? '—' : stats.publishedDays}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="admin-panel-card admin-sessions-card">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-section-eyebrow">
                AUDIENCIA
              </span>
              <h3>Últimas sesiones</h3>
              <p>Hasta 500 sesiones recientes.</p>
            </div>

            <Users size={20} />
          </div>

          {sessions.length === 0 ? (
            <p className="admin-empty-state">
              Todavía no hay sesiones registradas.
            </p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-sessions-table">
                <thead>
                  <tr>
                    <th>Dispositivo</th>
                    <th>Navegador</th>
                    <th>Inicio</th>
                    <th>Última actividad</th>
                    <th>Tiempo activo</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map((session) => {
                    const DeviceIcon = getDeviceIcon(
                      session.device_type,
                    )

                    const isActive =
                      !session.ended_at &&
                      Date.now() -
                        new Date(session.last_seen_at).getTime() <=
                        2 * 60 * 1000

                    return (
                      <tr key={session.session_id}>
                        <td>
                          <span className="admin-table-device">
                            <DeviceIcon size={16} />
                            {getDeviceLabel(session.device_type)}
                          </span>
                        </td>

                        <td>{session.browser_family || 'No identificado'}</td>
                        <td>{formatDate(session.started_at)}</td>
                        <td>{formatDate(session.last_seen_at)}</td>
                        <td>{formatDuration(session.active_seconds)}</td>
                        <td>
                          <span
                            className={
                              isActive
                                ? 'admin-session-status active'
                                : 'admin-session-status'
                            }
                          >
                            {isActive ? 'Activa' : 'Finalizada / inactiva'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel-card admin-calendar-summary">
          <div>
            <span className="admin-section-eyebrow">
              CALENDARIO
            </span>
            <h3>Estado de los 25 días</h3>
            <p>
              {stats.publishedDays} de {stats.totalDays} días publicados.
            </p>
          </div>

          <div className="admin-calendar-progress">
            <div
              style={{
                width: `${
                  stats.totalDays > 0
                    ? (stats.publishedDays / stats.totalDays) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </section>

        <footer className="admin-dashboard-footer">
          <span>
            {lastUpdated
              ? `Última actualización: ${formatDate(lastUpdated.toISOString())}`
              : 'Esperando datos...'}
          </span>
          <span>Zona horaria: America/Bogota</span>
        </footer>
      </section>
    </main>
  )
}