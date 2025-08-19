import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, Tag, DollarSign, Clock, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { listCourses, enroll, checkEnrollment } from '../../services/courseService';
import { canSeeInternal, hasTeacherPermissions } from '../../utils/permissions';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 text-foreground relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/15 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section with Dashboard and Theme buttons */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <DashboardButton variant="secondary" />
              
              {/* Theme Toggle */}
              <ThemeToggle size="md" />
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3">
                Explore Courses
              </h1>
              <p className="text-foreground/60 text-lg">Discover and enroll to level up your skills</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground/40 w-5 h-5" />
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
                className={`w-full pl-12 pr-4 py-4 bg-card/80 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-lg ${
                  searchQuery ? 'border-primary/50 bg-primary/10' : ''
                }`}
              />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
              {searchQuery && !searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-300 ease-in-out">
                  {courses.map((c, index) => (
                    <div 
                      key={c._id} 
                      className="group bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 transform hover:scale-105 animate-fadeIn hover:border-primary/30"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 flex items-center justify-center group-hover:from-primary/30 group-hover:via-primary/40 group-hover:to-primary/50 transition-all duration-300">
                        <BookOpen className="w-16 h-16 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">{c.title}</h3>
                        </div>

                        <p className="text-foreground/70 text-sm mb-4 line-clamp-2 leading-relaxed">{c.description}</p>

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
                            <span className="font-medium">{c.tags?.slice(0, 3).join(', ') || 'No tags'}</span>
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
                              onClick={() => navigate(`/courses/${c._id}/admin`)}
                              className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200 font-medium"
                            >
                              Admin View
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
    </div>
  );
}
