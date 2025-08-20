import React, { useState } from 'react';
import {
  Star,
  Clock,
  DollarSign,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { skillsService } from '../../services/skillsService';
import ContactModal from './ContactModal';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';

const SkillPostCard = ({ post, onDeleted }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id || user?._id;
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };
  
  // Handle posts with null/undefined user (deleted users)
  if (!post.user) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden opacity-50">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-500">Deleted User</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-500 mb-2">{post.title}</h3>
          <p className="text-gray-400 text-sm">This post is from a deleted user account.</p>
        </div>
      </div>
    );
  }
  
  const isOwner = post.user._id === currentUserId;

  const getPricingColor = (pricing) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'barter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paid': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeColor = (type) => {
    return type === 'offer' 
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  };

  const handleContact = () => {
    if (!isAuthenticated || !currentUserId) {
      notificationService.warning('Please log in to contact other users.');
      return;
    }
    
    if (isOwner) {
      notificationService.info('This is your own post.');
      return;
    }
    
    setShowContactModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setLoading(true);
      await skillsService.deleteSkillPost(post._id);
      onDeleted(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const averageRating = post.reviews.length > 0 
    ? post.reviews.reduce((sum, review) => sum + review.rating, 0) / post.reviews.length 
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/10">
              {post.user.avatarUrl ? (
                <img
                  src={post.user.avatarUrl}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{post.user.name}</h4>
              <div className="flex items-center space-x-2 text-sm text-foreground/60">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-foreground/60" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => {/* TODO: Implement edit */}}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-accent flex items-center space-x-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{loading ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Type */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-foreground text-lg flex-1">{post.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getTypeColor(post.type)}`}>
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </span>
        </div>

        {/* Description */}
        <p className="text-foreground/70 text-sm mb-4 line-clamp-3">{post.description}</p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {post.images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={`/uploads/${image}`}
                    alt={`Skill ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  {index === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">+{post.images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Intro */}
        {post.videoIntro && (
          <div className="mb-4 p-3 bg-accent rounded-lg flex items-center space-x-2">
            <Video className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Video introduction available</span>
          </div>
        )}

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.skillTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>

        {/* Level and Pricing */}
        <div className="flex items-center justify-between mb-4">
          {post.level && (
            <span className="text-sm font-medium text-foreground/70">
              Level: {post.level}
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPricingColor(post.pricing)}`}>
            {post.pricing === 'paid' && post.priceAmount 
              ? `$${post.priceAmount}` 
              : post.pricing.charAt(0).toUpperCase() + post.pricing.slice(1)
            }
          </span>
        </div>

        {/* Barter Request */}
        {post.pricing === 'barter' && post.barterRequest && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Looking for:</strong> {post.barterRequest}
            </p>
          </div>
        )}

        {/* Reviews */}
        {post.reviews.length > 0 && (
          <div className="mb-4 flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-foreground/60">
              {averageRating.toFixed(1)} ({post.reviews.length} review{post.reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Badge */}
        {post.badgeEarned && (
          <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              🏆 {post.badgeEarned}
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-border bg-accent/30">
        <div className="flex items-center justify-center">
          {!isOwner ? (
            <button 
              onClick={handleContact}
              className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact {post.user.name}</span>
            </button>
          ) : (
            <div className="text-sm text-foreground/60 py-2 font-medium">
              This is your post
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        recipientUser={post.user}
        skillPost={post}
      />

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default SkillPostCard;
