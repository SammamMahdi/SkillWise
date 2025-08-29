import React, { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, CheckCircle2, Trash2, Eye, XCircle } from 'lucide-react'
import { communityService } from '../../services/communityService'
import ThemeToggle from '../common/ThemeToggle'
import DashboardButton from '../common/DashboardButton'

const ReportedPosts = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await communityService.listReports()
      if (res.success) setReports(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resolve = async (reportId, action) => {
    const resolutionNote = window.prompt('Add a note for the reporter/author (optional):', action === 'deleted_post' ? 'Removed due to guideline violation' : '')
    setResolvingId(reportId)
    try {
      const res = await communityService.resolveReport(reportId, action, resolutionNote || '')
      if (res.success) {
        setReports(prev => prev.map(r => r._id === reportId ? res.data : r))
      } else {
        alert(res.message || 'Failed to resolve report')
      }
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reported Posts</h1>
              <p className="text-foreground/80">Review and take action on community post reports</p>
            </div>
            <div className="flex items-center gap-3">
              <DashboardButton />
              <ThemeToggle size="md" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-foreground">Open Reports</h2>
            </div>
            <button onClick={load} className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg hover:bg-muted">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-foreground/70">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-foreground/70">No reports</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Post Preview</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Reason</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Reporter</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map(r => (
                    <tr key={r._id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm text-foreground/90 line-clamp-2">
                          {/* If this is a shared post, indicate original */}
                          {r.post?.sharedFrom ? (
                            <>
                              <div className="text-foreground/70 text-xs mb-1">Shared post reported — showing original content</div>
                              <div className="font-medium">{r.post.sharedFrom?.title || '(no title)'}</div>
                              <div className="text-foreground/80 line-clamp-2">{r.post.sharedFrom?.text || '(no content)'}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{r.post?.title || '(no title)'}</div>
                              <div className="text-foreground/80 line-clamp-2">{r.post?.text || '(no content)'}</div>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-foreground/60 mt-1">
                          Post ID: {r.post?.sharedFrom?._id || r.post?._id}
                          {r.post?.sharedFrom && <span className="ml-2 text-orange-600">(Shared Post)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-foreground/90">{r.reason}</td>
                      <td className="px-6 py-4 align-top text-sm text-foreground/80">{r.reporter?.name || 'User'}</td>
                      <td className="px-6 py-4 align-top">
                        <span className={`px-2 py-1 rounded-full text-xs ${r.status === 'open' ? 'bg-orange-100 text-orange-800' : r.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {r.status}
                        </span>
                        {r.resolutionNote && (
                          <div className="text-xs text-foreground/60 mt-1">{r.resolutionNote}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        {r.status !== 'open' ? (
                          <div className="text-foreground/50 text-sm">Resolved</div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* View full post content in a new tab if exists */}
                            {r.post && (
                              <a
                                href={`/community/posts/${r.post.sharedFrom?._id || r.post._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-muted flex items-center gap-2"
                                title={`View the ${r.post.sharedFrom ? 'original' : 'reported'} post`}
                                onClick={() => {
                                  console.log('Viewing post:', {
                                    reportedPostId: r.post._id,
                                    originalPostId: r.post.sharedFrom?._id,
                                    targetPostId: r.post.sharedFrom?._id || r.post._id,
                                    url: `/community/posts/${r.post.sharedFrom?._id || r.post._id}`
                                  })
                                }}
                              >
                                <Eye className="w-4 h-4" /> View
                              </a>
                            )}
                            <button
                              onClick={() => resolve(r._id, 'deleted_post')}
                              disabled={resolvingId === r._id}
                              className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Remove Post
                            </button>
                            <button
                              onClick={() => resolve(r._id, 'none')}
                              disabled={resolvingId === r._id}
                              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                            </button>
                            <button
                              onClick={() => resolve(r._id, 'other')}
                              disabled={resolvingId === r._id}
                              className="px-3 py-2 text-sm bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" /> Dismiss
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportedPosts


