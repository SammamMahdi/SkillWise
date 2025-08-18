import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Search,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video,
  Tag
} from 'lucide-react';
import { skillsService } from '../../services/skillsService';
import CreateSkillPost from './CreateSkillPost';
import SkillPostCard from './SkillPostCard';

const SkillsWall = () => {
  const [skillPosts, setSkillPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    pricing: '',
    level: '',
    skillTag: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const pricingTypes = ['free', 'barter', 'paid'];
  const postTypes = ['offer', 'request'];

  useEffect(() => {
    fetchSkillPosts();
  }, [filters, currentPage]);

  const fetchSkillPosts = async () => {
    try {
      setLoading(true);
      const response = await skillsService.getSkillPosts({
        ...filters,
        page: currentPage,
        limit: 12
      });

      if (response.success) {
        setSkillPosts(response.data.skillPosts);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching skill posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      pricing: '',
      level: '',
      skillTag: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handlePostCreated = (newPost) => {
    setSkillPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  const handlePostDeleted = (deletedPostId) => {
    setSkillPosts(prev => prev.filter(post => post._id !== deletedPostId));
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Skills Wall</h1>
              <p className="text-foreground/60 mt-1">
                Share your skills, find collaborators, and build your expertise
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-card rounded-lg border border-border p-6 mb-6 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-foreground/60" />
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 transition-all duration-200 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search skills..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-foreground/40 transition-all duration-200"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground transition-all duration-200"
            >
              <option value="">All Types</option>
              {postTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            {/* Pricing Filter */}
            <select
              value={filters.pricing}
              onChange={(e) => handleFilterChange('pricing', e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="">All Pricing</option>
              {pricingTypes.map(pricing => (
                <option key={pricing} value={pricing}>
                  {pricing.charAt(0).toUpperCase() + pricing.slice(1)}
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="">All Levels</option>
              {skillLevels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Skill Tag Filter */}
            <input
              type="text"
              placeholder="Filter by skill tag"
              value={filters.skillTag}
              onChange={(e) => handleFilterChange('skillTag', e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {skillPosts.map(post => (
                <SkillPostCard
                  key={post._id}
                  post={post}
                  onDeleted={handlePostDeleted}
                />
              ))}
            </div>

            {skillPosts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-foreground/40 text-lg mb-2">No skill posts found</div>
                <p className="text-foreground/60 mb-4">
                  Be the first to share a skill or adjust your filters
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Your First Post
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-accent'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreateSkillPost
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default SkillsWall;
