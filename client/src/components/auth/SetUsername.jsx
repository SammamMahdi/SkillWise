import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Check, X, Loader2 } from 'lucide-react'
import bg from './evening-bg.gif'
import { checkUsernameAvailable, setMyUsername } from '../../services/usernameService'
import ThemeToggle from '../common/ThemeToggle'

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/

export default function SetUsername() {
  const { user, token, setUser, refreshUser } = useAuth?.() || {}
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState(null) // 'ok' | 'taken' | 'invalid' | null
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const autoHandle = useMemo(() => user?.handle || '', [user])

  // IMPORTANT: robust token fallback
  const authToken =
    token ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('accessToken')

  // If user already has username, just go on
  useEffect(() => {
    if (user?.username) navigate('/dashboard')
  }, [user, navigate])

  // Debounced availability check
  useEffect(() => {
    if (!value) { setStatus(null); return }
    if (!USERNAME_RE.test(value)) { setStatus('invalid'); return }
    let alive = true
    setChecking(true)
    const t = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(value)
        if (!alive) return
        setStatus(res.available ? 'ok' : 'taken')
      } catch {
        if (alive) setStatus(null)
      } finally {
        if (alive) setChecking(false)
      }
    }, 350)
    return () => { alive = false; clearTimeout(t) }
  }, [value])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (status !== 'ok') return
    if (!authToken) {
      setSubmitError('You are not authenticated. Please log in again.')
      return
    }

    setSaving(true)
    try {
      const res = await setMyUsername(value, authToken)

      // Update context immediately if possible
      if (typeof refreshUser === 'function') {
        await refreshUser()
      } else if (typeof setUser === 'function') {
        setUser(prev => ({ ...(prev || {}), username: value }))
      } else {
        // last resort to avoid stale UI
        window.location.reload()
      }

      navigate('/dashboard') // or navigate(`/${value}`)
    } catch (err) {
      // 409 → taken; others → generic
      setStatus(err?.response?.status === 409 ? 'taken' : status)
      setSubmitError(err?.response?.data?.error || 'Failed to set username')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {/* Theme toggle - fixed position top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* Overlay for readability - different for light/dark */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Content grid */}
      <div className="relative z-10 min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 items-start lg:items-center py-10 sm:py-14">
        {/* LEFT: Branding (centered on mobile, left on lg+) */}
        <div className="lg:col-span-4 xl:col-span-5 flex items-start lg:items-center justify-center lg:justify-start text-center lg:text-left">
          <div className="px-8 sm:px-12 lg:pl-16 lg:pr-8">
            <h1
              className={`text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", serif' }}
            >
              SkillWise
            </h1>
            <p
              className={`mt-3 text-lg leading-relaxed transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/85' : 'text-slate-700'
              }`}
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
            >
              Choose your unique username
            </p>
          </div>
        </div>

        {/* RIGHT: Username form (center on mobile, right on lg+) */}
        <div className="lg:col-span-7 xl:col-span-6 lg:col-start-7 xl:col-start-8 flex justify-center lg:justify-end px-4 sm:px-8 lg:pl-8 lg:pr-24">
          <div className="w-full pb-8 mx-auto lg:ml-auto max-w-sm sm:max-w-md">
            <form
              onSubmit={onSubmit}
              className={`w-full max-w-sm sm:max-w-md md:max-w-lg min-h-[500px] rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-10 overflow-hidden transition-all duration-500 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-slate-200/50 bg-white/90 text-slate-800'
              }`}
            >
              <div className="text-center">
                <h1 className={`text-2xl font-semibold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Choose your username</h1>
                <p className={`mt-1 text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white/80' : 'text-slate-600'
                }`}>
                  This will be your public handle. Allowed: a–z, 0–9, "." and "_", 3–20 chars.
                </p>
              </div>

              {autoHandle && (
                <div className={`mt-4 text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white/80' : 'text-slate-600'
                }`}>
                  Temporary handle:&nbsp;
                  <code className={`px-2 py-1 rounded border transition-colors duration-500 ${
                    theme === 'dark' 
                      ? 'bg-black/30 border-white/10 text-white' 
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}>
                    {autoHandle}
                  </code>
                </div>
              )}

              <div className="mt-5">
                <label className={`block text-sm mb-2 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-700'
                }`}>Username</label>
                <div className="relative">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value.toLowerCase())}
                    placeholder="your.name"
                    className={`w-full px-4 py-3 rounded-xl outline-none border transition-all duration-300 ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-violet-300/70'
                        : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50'
                    }`}
                    autoFocus
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checking && <Loader2 className="h-5 w-5 animate-spin opacity-80" />}
                    {status === 'ok' && <Check className="h-5 w-5 text-emerald-400" />}
                    {(status === 'taken' || status === 'invalid') && <X className="h-5 w-5 text-rose-400" />}
                  </div>
                </div>

                <div className="mt-2 h-5 text-sm">
                  {status === 'ok' && <span className="text-emerald-400">Available</span>}
                  {status === 'taken' && <span className="text-rose-400">This username is taken</span>}
                  {status === 'invalid' && <span className="text-rose-400">Invalid format</span>}
                </div>
              </div>

              {!!submitError && (
                <div className="mt-3 text-sm text-rose-400">{submitError}</div>
              )}

              <button
                type="submit"
                disabled={saving || status !== 'ok'}
                className={`mt-4 w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save username'
                )}
              </button>

              <div className={`mt-4 text-xs text-center transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-500'
              }`}>
                You can change this later (admin policy permitting).
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
