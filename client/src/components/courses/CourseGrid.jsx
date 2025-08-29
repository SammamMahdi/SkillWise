import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, Tag, DollarSign, Clock, Copy, CheckCircle, Sparkles, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import bg from '../auth/a.jpg';
import { listCourses, enroll, checkEnrollment } from '../../services/courseService';
import { canSeeInternal, hasTeacherPermissions } from '../../utils/permissions';
import UniversalTopBar from '../common/UniversalTopBar';
import CourseThreeJSBackground from './CourseThreeJSBackground';

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CourseGrid() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false); // Separate loading state for search
  const [err, setErr] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ tags: '', minPrice: '', maxPrice: '', teacher: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasPrevPage: false, hasNextPage: false });
  const [enrollmentStatus, setEnrollmentStatus] = useState({});

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 800); // Increased delay for smoother experience
  const debouncedFilters = useDebounce(filters, 800);

  // Check enrollment status for all courses
  const checkEnrollmentStatus = useCallback(async (courseIds) => {
    if (!user || user.role !== 'Student') return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const statusMap = {};
    
    try {
      // Check enrollment status for each course
      await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            const isEnrolled = await checkEnrollment(courseId, token);
            statusMap[courseId] = isEnrolled;
          } catch (error) {
            console.error(`Failed to check enrollment for course ${courseId}:`, error);
            statusMap[courseId] = false;
          }
        })
      );
      
      setEnrollmentStatus(statusMap);
    } catch (error) {
      console.error('Failed to check enrollment statuses:', error);
    }
  }, [user]);

  // Memoize fetchCourses to prevent unnecessary re-renders
  const fetchCourses = useCallback(async (isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      const params = {
        page,
        limit: 12,
        sortBy: sortBy === 'newest' || sortBy === 'oldest' ? 'createdAt' : sortBy,
        sortOrder: sortBy === 'oldest' ? 'asc' : 'desc',
      };
      
      // Only add search params if they actually have values
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      if (debouncedFilters.tags && debouncedFilters.tags.trim()) {
        params.tags = debouncedFilters.tags.trim();
      }
      if (debouncedFilters.minPrice && debouncedFilters.minPrice.trim()) {
        params.minPrice = debouncedFilters.minPrice.trim();
      }
      if (debouncedFilters.maxPrice && debouncedFilters.maxPrice.trim()) {
        params.maxPrice = debouncedFilters.maxPrice.trim();
      }
      if (debouncedFilters.teacher && debouncedFilters.teacher.trim()) {
        params.teacher = debouncedFilters.teacher.trim();
      }

      const res = await listCourses(params);
      
      // Handle different response structures
      let coursesData = [];
      let paginationData = { currentPage: 1, totalPages: 1, hasPrevPage: false, hasNextPage: false };
      
      if (res.data && res.data.courses) {
        // New API structure: { success: true, data: { courses, pagination } }
        coursesData = res.data.courses;
        paginationData = res.data.pagination || paginationData;
      } else if (res.courses) {
        // Old API structure: { courses, pagination }
        coursesData = res.courses;
        paginationData = res.pagination || paginationData;
      }
      
      setCourses(coursesData);
      setPagination(paginationData);
      
      // Check enrollment status for the fetched courses
      if (coursesData.length > 0) {
        const courseIds = coursesData.map(course => course._id);
        checkEnrollmentStatus(courseIds);
      }
    } catch (e) {
      setErr(e.message || 'Failed to fetch courses');
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [debouncedSearchQuery, debouncedFilters, sortBy, page, checkEnrollmentStatus]);

  // Reset page to 1 when search or filters change, but don't fetch immediately
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, debouncedFilters, sortBy]);

  // Fetch courses only when debounced values change or page changes
  useEffect(() => {
    // Don't fetch if search query is empty and no filters are applied
    const hasSearchOrFilters = (debouncedSearchQuery && debouncedSearchQuery.trim()) || 
                              Object.values(debouncedFilters).some(val => val && val.trim());
    
    if (hasSearchOrFilters || page > 1) {
      fetchCourses(true); // This is a search/filter operation
    } else if (page === 1) {
      // Initial load or reset to page 1
      fetchCourses(false); // This is initial load
    }
  }, [debouncedSearchQuery, debouncedFilters, sortBy, page, fetchCourses]);

  const handleEnroll = async (courseId) => {
    try {
      await enroll(courseId, localStorage.getItem('token'));
      alert('Enrolled!');
      // Update enrollment status for this course
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: true }));
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
    <>
      <UniversalTopBar variant="transparent" />
      <CourseThreeJSBackground />
      <section className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section with Glass Card */}
            <div className="mb-8">
              <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm">
                      <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl backdrop-blur-sm">
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    Explore Courses
                  </h1>
                  <p className="text-foreground/70 text-xl max-w-2xl mx-auto">
                    Discover premium courses designed to elevate your skills and accelerate your learning journey
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-6 text-sm text-foreground/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{courses.length} Active Courses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Expert Instructors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Interactive Learning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-1 shadow-xl">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-foreground/50 w-5 h-5 z-10" />
                <input
                  type="text"
                  placeholder="Search courses by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    // Clear error when user starts typing
                    if (err) setErr('');
                  }}
                  className={`w-full pl-14 pr-4 py-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-0 rounded-xl focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all duration-300 text-lg placeholder:text-foreground/50 hover:bg-white/30 dark:hover:bg-black/30 ${
                    searchQuery ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                  }`}
                />
                {searchLoading && (
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
                {searchQuery && !searchLoading && (
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results Count */}
            {searchQuery && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg text-foreground/70">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  Found {courses.length} course{courses.length !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-center text-foreground/80">Filter & Sort Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/70">Tags</label>
                  <input
                    value={filters.tags}
                    onChange={(e) => { setFilters(p => ({ ...p, tags: e.target.value })); }}
                    placeholder="javascript, math"
                    className="w-full px-4 py-2 bg-background/80 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/70">Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => { setFilters(p => ({ ...p, minPrice: e.target.value })); }}
                    className="w-full px-4 py-2 bg-background/80 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/70">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => { setFilters(p => ({ ...p, maxPrice: e.target.value })); }}
                    className="w-full px-4 py-2 bg-background/80 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/70">Instructor</label>
                  <input
                    value={filters.teacher}
                    onChange={(e) => { setFilters(p => ({ ...p, teacher: e.target.value })); }}
                    placeholder="Name or id"
                    className="w-full px-4 py-2 bg-background/80 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/70">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); }}
                    className="w-full px-4 py-2 bg-background/80 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_low">Price: Low → High</option>
                    <option value="price_high">Price: High → Low</option>
                    <option value="title">Title A–Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {!!err && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-rose-300 text-sm">
              {err}
            </div>
          )}

          {/* Grid */}
          <div className="relative">
            {searchLoading && courses.length > 0 && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-sm">Updating search results...</span>
                  </div>
                </div>
              </div>
            )}
            
            {!courses.length ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                <div className="text-foreground/60">No courses found.</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 transition-all duration-300 ease-in-out">
                  {courses.map((c, index) => (
                    <div
                      key={c._id}
                      className="group bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 transform hover:-translate-y-2 animate-fadeIn hover:border-primary/40 hover:bg-white/20 dark:hover:bg-black/20"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative h-52 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20 transition-all duration-500 overflow-hidden">
                        {/* Animated background elements */}
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute top-4 right-4 w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
                          <div className="absolute bottom-6 left-6 w-4 h-4 bg-blue-500/20 rounded-full animate-bounce"></div>
                          <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-purple-500/20 rounded-full animate-ping"></div>
                        </div>
                        <div className="relative z-10 p-6 text-center">
                          <BookOpen className="w-20 h-20 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 mx-auto mb-2" />
                          <div className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Course</div>
                        </div>
                        {c.price === 0 && (
                          <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">Free</span>
                        )}
                        {c.price > 0 && (
                          <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">${c.price}</span>
                        )}
                      </div>

                      <div className="p-6 bg-white/5 dark:bg-black/5 backdrop-blur-sm">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300 mb-2">{c.title}</h3>
                          <p className="text-foreground/70 text-sm line-clamp-2 leading-relaxed">{c.description}</p>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-xs text-foreground/70">
                            <span className="font-medium">Public Code:</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-background/50 px-2 py-1 rounded text-xs">{c.publicCode || '—'}</code>
                              {c.publicCode && (
                                <button 
                                  className="opacity-70 hover:opacity-100 hover:text-primary transition-all duration-200" 
                                  onClick={() => copy(c.publicCode)}
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {canSeeInternal(user) && c.courseCode && (
                            <div className="flex items-center justify-between text-xs text-foreground/60">
                              <span className="font-medium">Internal:</span>
                              <div className="flex items-center gap-2">
                                <code className="bg-background/50 px-2 py-1 rounded text-xs">{c.courseCode}</code>
                                <button 
                                  className="opacity-70 hover:opacity-100 hover:text-primary transition-all duration-200" 
                                  onClick={() => copy(c.courseCode)}
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors duration-200">
                            <User className="w-4 h-4 mr-2 text-primary/60" /> 
                            <span className="font-medium">{c.teacher?.name || 'Unknown Instructor'}</span>
                          </div>
                          <div className="flex items-center text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors duration-200">
                            <Clock className="w-4 h-4 mr-2 text-primary/60" /> 
                            <span className="font-medium">{duration(c.lectures)}</span>
                          </div>
                          <div className="flex items-center text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors duration-200">
                            <Tag className="w-4 h-4 mr-2 text-primary/60" /> 
                            {c.tags?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {c.tags.slice(0,3).map((t,i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">{t}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="font-medium">No tags</span>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors duration-200">
                            <Star className="w-4 h-4 mr-2 text-yellow-400" />
                            <span className="font-medium">
                              {c.ratingStats?.averageRating ? `${c.ratingStats.averageRating.toFixed(1)}/5` : 'No ratings'}
                            </span>
                            {c.ratingStats?.totalRatings > 0 && (
                              <span className="text-foreground/40 ml-1">({c.ratingStats.totalRatings})</span>
                            )}
                          </div>
                          <div className="flex items-center text-lg font-bold text-primary group-hover:text-primary/80 transition-colors duration-200">
                            <DollarSign className="w-5 h-5 mr-2" /> 
                            {formatPrice(c.price)}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => navigate(`/courses/${c._id}`)}
                            className="flex-1 px-4 py-3 bg-background/80 border border-border rounded-lg hover:bg-foreground/5 hover:border-primary/50 hover:text-primary transition-all duration-200 font-medium"
                          >
                            View Details
                          </button>
                          {user?.role === 'Student' && (
                            enrollmentStatus[c._id] ? (
                              <button
                                onClick={() => navigate(`/courses/${c._id}`)}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                View Course
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEnroll(c._id)}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 font-medium"
                              >
                                Enroll
                              </button>
                            )
                          )}
                          {hasTeacherPermissions(user) && (
                            <button
                              onClick={() => navigate(`/courses/${c._id}/edit`)}
                              className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200 font-medium"
                            >
                              Edit Course
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
      </div>
    </section>
    </>
  );
}
