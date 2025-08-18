import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { use          <div className="text-center">
            <h1 className={`text-2xl font-semibold transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>Choose your username</h1>
            <p className={`mt-1 text-sm transition-colors duration-500 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-600'
            }`}>
              This will be your public handle. Allowed: a–z, 0–9, "." and "_", 3–20 chars.
            </p>
          </div> from '../../contexts/AuthContext'
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
    <div className={`min-h-screen relative transition-all duration-500 ${
      theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
    }`}>
      {/* Theme toggle - fixed position top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* background - only show image in dark mode */}
      {theme === 'dark' && (
        <img
          src={bg}
          alt=""
          className="pointer-events-none select-none object-cover w-full h-full absolute inset-0"
        />
      )}
      <div className={`absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-black/50'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* center card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className={`w-full max-w-md rounded-2xl border backdrop-blur-xl p-6 shadow-xl transition-all duration-500 ${
            theme === 'dark'
              ? 'border-white/10 bg-white/10 text-white'
              : 'border-slate-200/50 bg-white/80 text-slate-800'
          }`}
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Choose your username</h1>
            <p className="mt-1 text-sm text-white/80">
              This will be your public handle. Allowed: a–z, 0–9, “.” and “_”, 3–20 chars.
            </p>
          </div>

          {autoHandle && (
            <div className="mt-4 text-sm">
              Temporary handle:&nbsp;
              <code className="px-2 py-1 rounded bg-black/30 border border-white/10">
                {autoHandle}
              </code>
            </div>
          )}

          <div className="mt-5">
            <label className="block text-sm mb-2">Username</label>
            <div className="relative">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value.toLowerCase())}
                placeholder="your.name"
                className="w-full px-4 py-3 rounded-xl bg-black/30 outline-none border border-white/10 focus:border-white/30"
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
              {status === 'ok' && <span className="text-emerald-300">Available</span>}
              {status === 'taken' && <span className="text-rose-300">This username is taken</span>}
              {status === 'invalid' && <span className="text-rose-300">Invalid format</span>}
            </div>
          </div>

          {!!submitError && (
            <div className="mt-3 text-sm text-rose-300">{submitError}</div>
          )}

          <button
            type="submit"
            disabled={saving || status !== 'ok'}
            className="mt-4 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save username'}
          </button>

          <div className="mt-4 text-xs text-white/70 text-center">
            You can change this later (admin policy permitting).
          </div>
        </form>
      </div>
    </div>
  )
}
