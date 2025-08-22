import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import aiService from '../../services/aiService'
import bg from '../auth/a.jpg'
import { useNavigate } from 'react-router-dom'

const AIRecommendations = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // New: user skills input and recommendations
  const [skillsInput, setSkillsInput] = useState('') // e.g., "React, Node.js, MongoDB"
  const [recommendations, setRecommendations] = useState(null)
  const [suggestionsText, setSuggestionsText] = useState('')
  const [matchedCourses, setMatchedCourses] = useState([])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { /* no nav menus here */ } }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [])

  const onSelect = (e) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setPages([])
    setError('')
    setRecommendations(null)
    setSuggestionsText('')
    setMatchedCourses([])
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
        // Check if content looks like a CV
        const allText = response.pages.map(p => p.text).join('\n\n').toLowerCase()
        const cvKeywords = ['experience', 'education', 'skills', 'work', 'job', 'employment', 'resume', 'cv', 'curriculum vitae', 'professional', 'career', 'qualifications', 'employment history', 'work history']
        const isCV = cvKeywords.some(keyword => allText.includes(keyword))
        
        if (!isCV) {
          setError('Sorry, this document does not appear to be a CV. Please upload a proper CV document.')
          return
        }
        
        setPages(response.pages.map(page => ({
          id: page.pageNumber,
          text: page.text.trim(),
          title: `Page ${page.pageNumber}`,
          confidence: page.confidence,
          wordCount: page.wordCount
        })))
        // Store CV text temporarily
        try { await aiService.storeTempCv(response.pages.map(p => p.text).join('\n\n')) } catch {}
      } else {
        // Fallback to old format
        const pageTexts = response.text.split(/\n\s*\n/).filter(page => page.trim().length > 0)
        
        // Check if content looks like a CV
        const allText = response.text.toLowerCase()
        const cvKeywords = ['experience', 'education', 'skills', 'work', 'job', 'employment', 'resume', 'cv', 'curriculum vitae', 'professional', 'career', 'qualifications', 'employment history', 'work history']
        const isCV = cvKeywords.some(keyword => allText.includes(keyword))
        
        if (!isCV) {
          setError('Sorry, this document does not appear to be a CV. Please upload a proper CV document.')
          return
        }
        
        setPages(pageTexts.map((pageText, index) => ({
          id: index + 1,
          text: pageText.trim(),
          title: `Page ${index + 1}`,
          confidence: 0,
          wordCount: pageText.split(/\s+/).length
        })))
        // Store CV text temporarily
        try { await aiService.storeTempCv(response.text) } catch {}
      }
    } catch (err) {
      setError(err.message || 'Failed to perform OCR')
    } finally {
      setLoading(false)
    }
  }

  const runRecommendations = async () => {
    try {
      setLoading(true)
      setError('')
      const list = skillsInput.split(',').map(s => s.trim()).filter(Boolean)
      if (list.length === 0) {
        setError('Please enter at least one skill (comma-separated).')
        return
      }
      const data = await aiService.recommendFromSkills(list)
      setRecommendations({
        skills_detected: data.skills_detected || list,
        recommended_courses: data.recommended_courses || []
      })
    } catch (e) {
      setError(e.message || 'Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  const recommendFromCv = async () => {
    try {
      setLoading(true)
      setError('')
      const text = pages.map(p => p.text).join('\n\n')
      if (!text || text.trim().length === 0) {
        setError('Scan PDF first to extract CV text.')
        return
      }
      const { suggestionsText, matchedCourseNames, courses } = await aiService.recommendFromCvText(text)
      setSuggestionsText(suggestionsText || '')
      setMatchedCourses(Array.isArray(courses) ? courses : [])
    } catch (e) {
      setError(e.message || 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  const accept = '.pdf,.docx'

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
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
          {/* Header Section */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">AI Recommendations</h1>
              <p className="text-lg text-white/70">Upload your CV to scan and get AI-powered insights</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl border border-white/10 transition-all duration-300">Back to Dashboard</button>
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
                <p className="text-xs text-white/60">Supported formats: PDF, DOCX (max 8MB)</p>
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
                    Scan PDF
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
                <h2 className="text-2xl font-semibold text-white">Scanned Content</h2>
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

          {/* Skills → Recommendations */}
          <div className="bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Get Course Recommendations</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Enter your skills (comma-separated)</label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g., React, Node.js, MongoDB"
                className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white/90 placeholder:text-white/40"
              />
              <button
                onClick={runRecommendations}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-semibold disabled:opacity-50 transition-all duration-300"
              >
                {loading ? 'Analyzing…' : 'Recommend Top 5 Courses'}
              </button>
              <div className="text-sm text-white/60">Or use your scanned results:</div>
              <button
                onClick={recommendFromCv}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-semibold disabled:opacity-50 transition-all duration-300"
              >
                {loading ? 'Analyzing…' : 'Suggest Courses From CV Text'}
              </button>
              {pages.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')
                      const text = pages.map(p => p.text).join('\n\n')
                      try { await aiService.storeTempCv(text) } catch {}
                      await aiService.suggestAddFromCv()
                      alert('Sent to admin for review.')
                    } catch (e) {
                      setError(e.message || 'Failed to send to admin')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 font-semibold disabled:opacity-50 transition-all duration-300"
                >
                  {loading ? 'Submitting…' : 'Send Recommendations To Admin'}
                </button>
              )}
            </div>

            {recommendations && (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-sm text-white/60 mb-2">Skills detected</div>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.skills_detected.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-primary/15 text-primary text-xs border border-primary/20">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-2">Recommended Courses</div>
                  {recommendations.recommended_courses.length > 0 ? (
                    <div className="grid gap-3">
                      {recommendations.recommended_courses.map((c, i) => (
                        <div key={i} className="p-4 rounded-xl border border-white/10 bg-card/20 backdrop-blur-sm">
                          <div className="font-semibold text-white">{c.courseName}</div>
                          {c.reason && <div className="text-sm text-white/70">{c.reason}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/70 text-sm">No recommendations available.</div>
                  )}
                </div>
              </div>
            )}

            {suggestionsText && (
              <div className="mt-6">
                <div className="text-sm text-white/60 mb-2">AI Suggestions (from CV text)</div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 whitespace-pre-wrap text-white/90 text-sm leading-relaxed">{suggestionsText}</div>
              </div>
            )}

            {matchedCourses.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Matched Courses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchedCourses.map((c, index) => (
                    <div 
                      key={c._id || index}
                      className="group bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="h-36 bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 flex items-center justify-center">
                        <span className="text-primary font-bold text-xl">SW</span>
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">{c.title}</h4>
                        <p className="text-white/70 text-sm mb-4 line-clamp-2">{c.description}</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => navigate(`/courses/${c._id}`, { state: { from: '/ai/recommendations' } })}
                            className="flex-1 px-4 py-2 bg-background/80 border border-white/10 rounded-lg hover:bg-foreground/5 hover:border-primary/50 hover:text-primary transition-all duration-200 text-sm"
                          >
                            View Details
                          </button>
                          {user?.role === 'Student' && (
                            <button
                              onClick={() => navigate(`/courses/${c._id}`, { state: { from: '/ai/recommendations' } })}
                              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 text-sm"
                            >
                              Enroll
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AIRecommendations


