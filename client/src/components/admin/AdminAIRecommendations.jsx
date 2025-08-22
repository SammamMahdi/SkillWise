import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import aiService from '../../services/aiService'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import bg from '../auth/a.jpg'

const AdminAIRecommendations = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await aiService.listAdminRecommendations()
      setItems(res.data || [])
    } catch (e) {
      setError(e.message || 'Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onDelete = async (id) => {
    try {
      await aiService.deleteAdminRecommendation(id)
      setItems(prev => prev.filter(x => x._id !== id))
    } catch (e) {
      setError(e.message || 'Failed to delete')
    }
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'SuperUser')) {
    return <div className="p-6 text-red-400">Access denied.</div>
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
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-subtle"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/15 rounded-full animate-pulse-subtle"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">AI Course Suggestions (to Add)</h1>
              <p className="text-white/70">Review AI-proposed course names based on user CVs</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl border border-white/10 transition-all duration-300"
            >
              Back to Dashboard
            </button>
          </div>

          {loading && (
            <div className="bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-white/80">Loading…</div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm text-red-300 mb-6">{error}</div>
          )}
          {!loading && items.length === 0 && (
            <div className="bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-white/70">No items.</div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {items.map(item => (
              <div key={item._id} className="p-8 rounded-2xl border border-white/10 bg-card/20 backdrop-blur-sm">
                <div className="text-xs text-white/60 mb-2">From user</div>
                <div className="text-sm text-white/80 mb-4">{item.user?.name} <span className="text-white/50">({item.user?.email})</span></div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-6">
                  <pre className="whitespace-pre-wrap text-white/90 text-base leading-relaxed">{item.suggestionsText}</pre>
                </div>
                {Array.isArray(item.suggestedCourseNames) && item.suggestedCourseNames.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-white/60 mb-2">Proposed names</div>
                    <div className="flex flex-wrap gap-2">
                      {item.suggestedCourseNames.map((n, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-sm border border-primary/20">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 flex gap-2">
                  <button onClick={() => onDelete(item._id)} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl border border-white/10 hover:bg-red-500/30 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminAIRecommendations


