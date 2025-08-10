import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, Tag, DollarSign, Clock, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { listCourses, enroll } from '../../services/courseService';

const canSeeInternal = (user) => user?.role === 'Teacher' || user?.role === 'Admin';

export default function CourseGrid() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ tags: '', minPrice: '', maxPrice: '', teacher: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasPrevPage: false, hasNextPage: false });

  useEffect(() => { fetchCourses(); /* eslint-disable-next-line */ }, [searchQuery, filters, sortBy, page]);

  async function fetchCourses() {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        sortBy: sortBy === 'newest' || sortBy === 'oldest' ? 'createdAt' : sortBy,
        sortOrder: sortBy === 'oldest' ? 'asc' : 'desc',
      };
      if (searchQuery) params.search = searchQuery;
      if (filters.tags) params.tags = filters.tags;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.teacher) params.teacher = filters.teacher;

      const res = await listCourses(params);
      setCourses(res.data?.courses || res.courses || []);
      setPagination(res.data?.pagination || pagination);
    } catch (e) {
      setErr(e.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      await enroll(courseId, localStorage.getItem('token'));
      alert('Enrolled!');
      fetchCourses();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to enroll');
    }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const formatPrice = (p) => (p === 0 ? 'Free' : `$${p}`);
  const duration = (lectures) => {
    const total = (lectures || []).reduce((sum, l) => {
      const secs = (l.content || []).reduce((s, c) => s + (c.duration || 0), 0);
      return sum + secs;
    }, 0);
    if (!total) return 'No lectures';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="bg-card rounded-lg p-6 h-64" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Explore Courses</h1>
          <p className="text-foreground/60">Discover and enroll to level up.</p>
        </div>

        {/* Search + Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses…"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <button className="px-6 py-3 rounded-lg bg-primary text-white">Search</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm mb-2">Tags</label>
                <input
                  value={filters.tags}
                  onChange={(e) => { setFilters(p => ({ ...p, tags: e.target.value })); setPage(1); }}
                  placeholder="javascript, math"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Min Price</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => { setFilters(p => ({ ...p, minPrice: e.target.value })); setPage(1); }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Max Price</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => { setFilters(p => ({ ...p, maxPrice: e.target.value })); setPage(1); }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Instructor</label>
                <input
                  value={filters.teacher}
                  onChange={(e) => { setFilters(p => ({ ...p, teacher: e.target.value })); setPage(1); }}
                  placeholder="Name or id"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price_low">Price: Low → High</option>
                  <option value="price_high">Price: High → Low</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {!!err && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-rose-300 text-sm">
            {err}
          </div>
        )}

        {/* Grid */}
        {!courses.length ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <div className="text-foreground/60">No courses found.</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((c) => (
                <div key={c._id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary" />
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold line-clamp-2">{c.title}</h3>
                    </div>

                    <p className="text-foreground/70 text-sm mt-1 line-clamp-2">{c.description}</p>

                    <div className="space-y-2 mt-3">
                      <div className="text-xs text-foreground/70 flex items-center gap-2">
                        Public Code: <code>{c.publicCode || '—'}</code>
                        {c.publicCode && <button className="opacity-70 hover:opacity-100" onClick={() => copy(c.publicCode)}><Copy className="w-3 h-3" /></button>}
                      </div>

                      {canSeeInternal(user) && c.courseCode && (
                        <div className="text-xs text-foreground/60 flex items-center gap-2">
                          Internal: <code>{c.courseCode}</code>
                          <button className="opacity-70 hover:opacity-100" onClick={() => copy(c.courseCode)}><Copy className="w-3 h-3" /></button>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-foreground/60">
                        <User className="w-4 h-4 mr-2" /> {c.teacher?.name || 'Unknown Instructor'}
                      </div>
                      <div className="flex items-center text-sm text-foreground/60">
                        <Clock className="w-4 h-4 mr-2" /> {duration(c.lectures)}
                      </div>
                      <div className="flex items-center text-sm text-foreground/60">
                        <Tag className="w-4 h-4 mr-2" /> {c.tags?.slice(0, 3).join(', ') || 'No tags'}
                      </div>
                      <div className="flex items-center text-sm font-medium text-primary">
                        <DollarSign className="w-4 h-4 mr-2" /> {formatPrice(c.price)}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/courses/${c._id}`)}
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg hover:bg-foreground/5"
                      >
                        View Details
                      </button>
                      {user?.role === 'Student' && (
                        <button
                          onClick={() => handleEnroll(c._id)}
                          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                        >
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 bg-card border border-border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">Page {pagination.currentPage} of {pagination.totalPages}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 bg-card border border-border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
