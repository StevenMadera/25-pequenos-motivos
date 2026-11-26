import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, Heart } from 'lucide-react'

import { supabase } from '../../services/supabase'

export default function AdminLoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (loginError) {
        throw loginError
      }

      navigate('/admin/dashboard', { replace: true })
    } catch {
      setError('No fue posible iniciar sesión. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-decoration admin-decoration-one" />
      <div className="admin-login-decoration admin-decoration-two" />

      <section className="admin-login-card">
        <div className="admin-login-symbol">
          <Heart size={27} fill="currentColor" />
        </div>

        <span className="admin-login-eyebrow">
          ÁREA PRIVADA
        </span>

        <h1>Bienvenido</h1>

        <p className="admin-login-description">
          Accede al espacio de administración
          de 25 pequeños motivos para sonreír.
        </p>

        <form onSubmit={handleLogin} className="admin-login-form">
          <label htmlFor="admin-email">
            Correo electrónico
          </label>

          <div className="admin-input-wrapper">
            <Mail size={17} />

            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="tu@correo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label htmlFor="admin-password">
            Contraseña
          </label>

          <div className="admin-input-wrapper">
            <LockKeyhole size={17} />

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? 'Verificando acceso...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="admin-login-footer">
          <LockKeyhole size={12} />
          Acceso exclusivo para el administrador
        </p>
      </section>
    </main>
  )
}