import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SortAsc, SortDesc, BookOpen, User, Tag, DollarSign, Clock, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CourseGrid = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    tags: '',
    minPrice: '',
    maxPrice: '',
    teacher: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, filters, sortBy, currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'oldest' ? 'createdAt' : sortBy,
        sortOrder: sortBy === 'oldest' ? 'asc' : 'desc'
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (filters.tags) {
        params.append('tags', filters.tags);
      }

      if (filters.minPrice) {
        params.append('minPrice', filters.minPrice);
      }

      if (filters.maxPrice) {
        params.append('maxPrice', filters.maxPrice);
      }

      if (filters.teacher) {
        params.append('teacher', filters.teacher);
      }

      const response = await fetch(`/api/courses?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      setCourses(data.data.courses);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await fetch(`/api/learning/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to enroll in course');
      }

      // Show success message and refresh courses
      alert('Successfully enrolled in course!');
      fetchCourses();
    } catch (err) {
      alert(err.message);
      console.error('Error enrolling in course:', err);
    }
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatDuration = (lectures) => {
    if (!lectures || lectures.length === 0) return 'No lectures';
    const totalDuration = lectures.reduce((sum, lecture) => {
      const lectureDuration = lecture.content?.reduce((lectureSum, content) => {
        return lectureSum + (content.duration || 0);
      }, 0) || 0;
      return sum + lectureDuration;
    }, 0);
    
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Explore Courses</h1>
          <p className="text-foreground/60">Discover and enroll in courses to enhance your skills</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="Filter by tags..."
                  value={filters.tags}
                  onChange={(e) => handleFilterChange('tags', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No courses found</h3>
            <p className="text-foreground/60">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Course Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary" />
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                        {course.title}
                      </h3>
                    </div>

                    <p className="text-foreground/60 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Course Meta */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-foreground/60">
                        <User className="w-4 h-4 mr-2" />
                        <span>{course.teacher?.name || 'Unknown Instructor'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-foreground/60">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatDuration(course.lectures)}</span>
                      </div>

                      <div className="flex items-center text-sm text-foreground/60">
                        <Tag className="w-4 h-4 mr-2" />
                        <span>{course.tags?.slice(0, 2).join(', ') || 'No tags'}</span>
                      </div>

                      <div className="flex items-center text-sm font-medium text-primary">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>{formatPrice(course.price)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/courses/${course._id}`)}
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        View Details
                      </button>
                      {user?.role === 'Student' && (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                        >
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed"
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
};

export default CourseGrid;
