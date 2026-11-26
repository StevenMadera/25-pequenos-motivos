
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  FileEdit,
  Gift,
  LoaderCircle,
  Save,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../../services/supabase'

interface DayContent {
  title?: string
  message?: string
  detail?: string
  closing?: string
}

interface AdventDay {
  id: number
  unlock_date: string
  title: string | null
  content: DayContent
  is_published: boolean
  updated_at: string
}

const emptyContent: DayContent = {
  title: '',
  message: '',
  detail: '',
  closing: '',
}

export default function AdminCalendarPage() {
  const [email, setEmail] = useState('')
  const [days, setDays] = useState<AdventDay[]>([])
  const [selectedId, setSelectedId] = useState(1)

  const [unlockDate, setUnlockDate] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [detail, setDetail] = useState('')
  const [closing, setClosing] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedDay = days.find((day) => day.id === selectedId)

  const loadDays = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        { data: userData, error: userError },
        { data, error: daysError },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('advent_days')
          .select('id, unlock_date, title, content, is_published, updated_at')
          .order('id', { ascending: true }),
      ])

      if (userError) throw userError
      if (daysError) throw daysError

      setEmail(userData.user?.email ?? '')
      setDays((data ?? []) as AdventDay[])
    } catch (err) {
      console.error('Error cargando días:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los días.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDays()
  }, [loadDays])

  useEffect(() => {
    if (!selectedDay) return

    const content = selectedDay.content ?? emptyContent

    setUnlockDate(selectedDay.unlock_date)
    setTitle(content.title ?? selectedDay.title ?? '')
    setMessage(content.message ?? '')
    setDetail(content.detail ?? '')
    setClosing(content.closing ?? '')
    setError('')
    setSuccess('')
  }, [selectedDay])

  const saveDay = async (publish: boolean) => {
    if (!selectedDay) return

    setError('')
    setSuccess('')

    if (!unlockDate) {
      setError('Debes seleccionar una fecha de desbloqueo.')
      return
    }

    if (publish && (!title.trim() || !message.trim())) {
      setError(
        'Para publicar un día debes completar al menos el título y el mensaje.',
      )
      return
    }

    setSaving(true)

    try {
      const content: DayContent = {
        title: title.trim(),
        message: message.trim(),
        detail: detail.trim(),
        closing: closing.trim(),
      }

      const { data, error: updateError } = await supabase
        .from('advent_days')
        .update({
          unlock_date: unlockDate,
          title: title.trim() || null,
          content,
          is_published: publish ? true : selectedDay.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedId)
        .select('id, unlock_date, title, content, is_published, updated_at')
        .single()

      if (updateError) throw updateError

      setDays((current) =>
        current.map((day) =>
          day.id === selectedId
            ? (data as AdventDay)
            : day,
        ),
      )

      setSuccess(
        publish
          ? 'Día publicado correctamente.'
          : 'Borrador guardado correctamente.',
      )
    } catch (err) {
      console.error('Error guardando día:', err)

      const message = err instanceof Error
        ? err.message
        : 'No fue posible guardar los cambios.'

      setError(
        message.includes('duplicate') || message.includes('unique')
          ? 'Esa fecha ya está asignada a otro día. Elige una fecha diferente.'
          : message,
      )
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!selectedDay) return

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const { data, error: updateError } = await supabase
        .from('advent_days')
        .update({
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedId)
        .select('id, unlock_date, title, content, is_published, updated_at')
        .single()

      if (updateError) throw updateError

      setDays((current) =>
        current.map((day) =>
          day.id === selectedId
            ? (data as AdventDay)
            : day,
        ),
      )

      setSuccess('El día se retiró de publicación.')
    } catch (err) {
      console.error('Error retirando publicación:', err)
      setError('No fue posible retirar la publicación.')
    } finally {
      setSaving(false)
    }
  }

  const publishedCount = days.filter(
    (day) => day.is_published,
  ).length

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
          <Link to="/admin/dashboard" className="admin-nav-item">
            <CalendarDays size={18} />
            <span>Resumen general</span>
          </Link>

          <div className="admin-nav-item active">
            <FileEdit size={18} />
            <span>Gestionar calendario</span>
          </div>
        </nav>

        <Link
  to="/admin/dashboard"
  className="admin-logout-button"
>
  <ArrowLeft size={17} />
  Volver al resumen
</Link>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              ADMINISTRACIÓN
            </span>
            <h1>Gestionar calendario</h1>
          </div>

          <div className="admin-user">
            <ShieldCheck size={17} />
            <span>{email}</span>
          </div>
        </header>

        <section className="admin-welcome">
          <div>
            <h2>Los 25 pequeños motivos.</h2>
            <p>
              Configura las fechas y administra el estado de cada día.
              El contenido puede completarse más adelante.
            </p>
          </div>

          <CalendarDays size={34} />
        </section>

        <div className="admin-calendar-overview">
          <div>
            <span>Días configurados</span>
            <strong>{days.length} / 25</strong>
          </div>

          <div>
            <span>Días publicados</span>
            <strong>{publishedCount}</strong>
          </div>

          <div>
            <span>Borradores</span>
            <strong>{days.length - publishedCount}</strong>
          </div>
        </div>

        {error && (
          <div className="admin-editor-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-editor-alert success" role="status">
            <Check size={16} />
            {success}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <LoaderCircle className="admin-spin" size={28} />
            <span>Cargando calendario...</span>
          </div>
        ) : (
          <div className="admin-calendar-editor">
            <section className="admin-panel-card admin-day-selector">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-section-eyebrow">
                    SELECCIÓN
                  </span>
                  <h3>Selecciona un día</h3>
                </div>
                <Gift size={20} />
              </div>

              <div className="admin-day-grid">
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    className={[
                      'admin-day-option',
                      selectedId === day.id ? 'selected' : '',
                      day.is_published ? 'published' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedId(day.id)}
                  >
                    <strong>{String(day.id).padStart(2, '0')}</strong>
                    <span>
                      {day.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {selectedDay && (
              <section className="admin-panel-card admin-day-form">
                <div className="admin-panel-heading">
                  <div>
                    <span className="admin-section-eyebrow">
                      CONFIGURACIÓN DEL DÍA {String(selectedId).padStart(2, '0')}
                    </span>
                    <h3>
                      Editar día {selectedId}
                    </h3>
                    <p>
                      Los cambios se guardan en Supabase.
                    </p>
                  </div>

                  <span
                    className={
                      selectedDay.is_published
                        ? 'admin-editor-status published'
                        : 'admin-editor-status'
                    }
                  >
                    {selectedDay.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                <div className="admin-editor-fields">
                  <label className="admin-editor-field">
                    <span>Fecha de desbloqueo</span>
                    <input
                      type="date"
                      value={unlockDate}
                      onChange={(event) => setUnlockDate(event.target.value)}
                    />
                    <small>
                      La disponibilidad se valida con la fecha del servidor.
                    </small>
                  </label>

                  <label className="admin-editor-field">
                    <span>Título</span>
                    <input
                      type="text"
                      value={title}
                      maxLength={120}
                      placeholder="Pendiente de completar"
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>

                  <label className="admin-editor-field">
                    <span>Mensaje principal</span>
                    <textarea
                      value={message}
                      rows={4}
                      maxLength={5000}
                      placeholder="Este campo se completará posteriormente."
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </label>

                  <label className="admin-editor-field">
                    <span>Contenido adicional</span>
                    <textarea
                      value={detail}
                      rows={3}
                      maxLength={5000}
                      placeholder="Opcional"
                      onChange={(event) => setDetail(event.target.value)}
                    />
                  </label>

                  <label className="admin-editor-field">
                    <span>Cierre</span>
                    <textarea
                      value={closing}
                      rows={2}
                      maxLength={2000}
                      placeholder="Opcional"
                      onChange={(event) => setClosing(event.target.value)}
                    />
                  </label>
                </div>

                <div className="admin-editor-note">
                  <Eye size={17} />
                  <p>
                    Los campos están vacíos intencionalmente.
                    Podrás completarlos cuando prepares cada día.
                  </p>
                </div>

                <div className="admin-editor-actions">
                  <button
                    type="button"
                    className="admin-editor-save"
                    disabled={saving}
                    onClick={() => void saveDay(false)}
                  >
                    {saving ? (
                      <LoaderCircle size={16} className="admin-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {selectedDay.is_published ? 'Guardar cambios' : 'Guardar borrador'}
                  </button>

                  {selectedDay.is_published ? (
                    <button
                      type="button"
                      className="admin-editor-unpublish"
                      disabled={saving}
                      onClick={() => void handleUnpublish()}
                    >
                      <EyeOff size={16} />
                      Retirar publicación
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-editor-publish"
                      disabled={saving}
                      onClick={() => void saveDay(true)}
                    >
                      <Eye size={16} />
                      Publicar día
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
