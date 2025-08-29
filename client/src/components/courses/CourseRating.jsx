import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { rateCourse, getCourseRatings, getMyRating } from '../../services/courseService';
import { toast } from 'react-hot-toast';
import StarRating from '../common/StarRating';

const CourseRating = ({ courseId, onRatingUpdate }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [myRating, setMyRating] = useState(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [review, setReview] = useState('');

  useEffect(() => {
    loadRatingData();
  }, [courseId]);

  const loadRatingData = async () => {
    try {
      setLoading(true);
      
      // Always try to get course ratings (public data)
      const ratingsRes = await getCourseRatings(courseId);
      if (ratingsRes.success) {
        setRatings(ratingsRes.data.ratings);
        setRatingStats(ratingsRes.data.ratingStats);
      }

      // Only try to get user's rating if they're logged in and have a valid token
      if (user && token) {
        try {
          const myRatingRes = await getMyRating(courseId, token);
                if (myRatingRes.success && myRatingRes.data) {
        setMyRating(myRatingRes.data);
        setCurrentRating(myRatingRes.data.rating);
        setReview(myRatingRes.data.review || '');
      }
        } catch (authError) {
          console.log('User not authenticated for rating data:', authError.message);
          // Don't show error toast for auth issues - user might just not be logged in
        }
      }
    } catch (error) {
      console.error('Error loading rating data:', error);
      toast.error('Failed to load rating data');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (rating) => {
    if (!user) {
      toast.error('Please log in to rate this course');
      return;
    }

    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await rateCourse(courseId, rating, review, token);
      
      if (response.success) {
        setMyRating({ rating, review, createdAt: new Date() });
        setCurrentRating(rating);
        setRatingStats(response.data);
        setShowReviewInput(false);
        toast.success(response.message);
        
        // Reload ratings to get updated list
        await loadRatingData();
        
        if (onRatingUpdate) {
          onRatingUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again to rate this course');
      } else {
        toast.error('Failed to submit rating');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingPercentage = (starCount) => {
    if (ratingStats.totalRatings === 0) return 0;
    return Math.round((ratingStats.ratingDistribution[starCount] / ratingStats.totalRatings) * 100);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Course Ratings</h3>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <span className="text-lg font-bold text-foreground">
            {ratingStats.averageRating.toFixed(1)}
          </span>
          <span className="text-foreground/60">({ratingStats.totalRatings} ratings)</span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-6">
        <h4 className="font-medium text-foreground mb-3">Rating Distribution</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm text-foreground/60">{stars}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getRatingPercentage(stars)}%` }}
                />
              </div>
              <span className="text-sm text-foreground/60 w-12 text-right">
                {ratingStats.ratingDistribution[stars]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* My Rating Section */}
      {user && (
        <div className="border-t border-border pt-6 mb-6">
          <h4 className="font-medium text-foreground mb-3">
            {myRating ? 'Update Your Rating' : 'Rate This Course'}
          </h4>
          
          <div className="space-y-4">
            <StarRating
              rating={currentRating}
              onRatingChange={(rating) => {
                setCurrentRating(rating);
                if (rating !== myRating?.rating) {
                  setShowReviewInput(true);
                }
              }}
              size="lg"
              showValue={true}
            />

            {showReviewInput && (
              <div className="space-y-3">
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Write a review (optional)..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows="3"
                  maxLength="500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/60">
                    {review.length}/500 characters
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReviewInput(false)}
                      className="px-4 py-2 text-foreground/60 hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRatingSubmit(currentRating)}
                      disabled={submitting || currentRating === 0}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Ratings */}
      {ratings.length > 0 && (
        <div className="border-t border-border pt-6">
          <h4 className="font-medium text-foreground mb-4">Recent Reviews</h4>
          <div className="space-y-4">
            {ratings.slice(0, 5).map((rating) => (
              <div key={rating._id} className="border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {rating.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">
                      {rating.user?.name || 'Anonymous'}
                    </span>
                  </div>
                  <StarRating rating={rating.rating} readonly size="sm" />
                </div>
                {rating.review && (
                  <p className="text-foreground/80 text-sm">{rating.review}</p>
                )}
                <div className="text-xs text-foreground/60 mt-2">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRating;
