import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import aiService from '../../services/aiService'
import TopBar from '../dashboard/TopBar'
import bg from '../auth/a.jpg'

const AIRecommendations = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openUser, setOpenUser] = useState(false)
  const [openActions, setOpenActions] = useState(false)
  const userMenuRef = useRef(null)
  const actionsMenuRef = useRef(null)

  const handleLogout = async () => {
    // Handle logout logic here
    window.location.href = '/'
  }

  useEffect(() => {
    const onClick = (e) => {
      if (openUser && userMenuRef.current && !userMenuRef.current.contains(e.target)) setOpenUser(false)
      if (openActions && actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) setOpenActions(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') { setOpenUser(false); setOpenActions(false) } }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [openUser, openActions])

  const onSelect = (e) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setPages([])
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    try {
      setLoading(true)
      setError('')
      const response = await aiService.ocrCv(file)
      
      // Handle the new response format with page data
      if (response.pages && response.pages.length > 0) {
        setPages(response.pages.map(page => ({
          id: page.pageNumber,
          text: page.text.trim(),
          title: `Page ${page.pageNumber}`,
          confidence: page.confidence,
          wordCount: page.wordCount
        })))
      } else {
        // Fallback to old format
        const pageTexts = response.text.split(/\n\s*\n/).filter(page => page.trim().length > 0)
        setPages(pageTexts.map((pageText, index) => ({
          id: index + 1,
          text: pageText.trim(),
          title: `Page ${index + 1}`,
          confidence: 0,
          wordCount: pageText.split(/\s+/).length
        })))
      }
    } catch (err) {
      setError(err.message || 'Failed to perform OCR')
    } finally {
      setLoading(false)
    }
  }

  const accept = '.pdf,.png,.jpg,.jpeg,.webp'
  const displayHandle = user?.username || user?.handle
  const isCourseCreator = false // This page is for students only

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
      {/* Overlay for readability */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-subtle"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/15 rounded-full animate-pulse-subtle"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        <TopBar 
          user={user}
          openUser={openUser}
          setOpenUser={setOpenUser}
          openActions={openActions}
          setOpenActions={setOpenActions}
          userMenuRef={userMenuRef}
          actionsMenuRef={actionsMenuRef}
          isCourseCreator={isCourseCreator}
          handleLogout={handleLogout}
          displayHandle={displayHandle}
        />
        
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">AI Recommendations</h1>
            <p className="text-lg text-white/70">Upload your CV to extract text and get AI-powered insights</p>
          </div>

          {/* Role Warning */}
          {user?.role !== 'Student' && (
            <div className="mb-6 p-4 border border-yellow-500/30 rounded-xl bg-yellow-500/10 text-yellow-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <span>This tool is intended for students. Your role: {user?.role || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Upload CV</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Select CV File</label>
                <input 
                  type="file" 
                  accept={accept} 
                  onChange={onSelect} 
                  className="block w-full cursor-pointer text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 file:transition-all file:duration-300" 
                />
                <p className="text-xs text-white/60">Supported formats: PDF, PNG, JPG, JPEG, WebP (max 8MB)</p>
              </div>
              <button
                type="submit"
                disabled={!file || loading}
                className="px-6 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-semibold disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    Run OCR Analysis
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 border border-red-500/30 rounded-xl bg-red-500/10 text-red-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-red-400">❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Results Section */}
          {pages.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Extracted Content</h2>
                <div className="text-sm text-white/60">{pages.length} page{pages.length !== 1 ? 's' : ''} detected</div>
              </div>
              
              {/* Summary Statistics */}
              <div className="bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Document Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{pages.length}</div>
                    <div className="text-sm text-white/60">Total Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{pages.reduce((sum, page) => sum + page.wordCount, 0)}</div>
                    <div className="text-sm text-white/60">Total Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {pages.length > 0 ? Math.round(pages.reduce((sum, page) => sum + page.confidence, 0) / pages.length) : 0}%
                    </div>
                    <div className="text-sm text-white/60">Avg Confidence</div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-6">
                {pages.map((page, index) => (
                  <div key={page.id} className="bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                          {page.id}
                        </div>
                        <h3 className="text-lg font-semibold text-white">{page.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        {page.confidence > 0 && (
                          <div className="flex items-center gap-1">
                            <span>Confidence:</span>
                            <span className={`font-semibold ${page.confidence > 80 ? 'text-green-400' : page.confidence > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {Math.round(page.confidence)}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>Words:</span>
                          <span className="font-semibold text-white">{page.wordCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <pre className="whitespace-pre-wrap text-white/90 text-sm leading-relaxed font-mono">{page.text}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AIRecommendations


