import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Award, BookOpen, Calendar, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import friendService from '../../services/friendService';
import { getProfilePicture } from '../../utils/profilePictureUtils';
import { fmtDate } from '../../utils/dateUtils';

const PublicProfile = () => {
  const { handle } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [handle]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await friendService.getPublicProfile(handle);
      setProfile(response.data.user);
    } catch (error) {
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      await friendService.sendFriendRequest(handle);
      toast.success('Friend request sent!');
      // Refresh profile to update friendship status
      fetchProfile();
    } catch (error) {
      toast.error(error.message || 'Failed to send friend request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-foreground/60 mb-4">The user you're looking for doesn't exist.</p>
          <Link to="/friends" className="text-primary hover:underline">
            ← Back to Friends
          </Link>
        </div>
      </div>
    );
  }

  const canViewLearningProgress = profile.areFriends || profile.isOwnProfile;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/friends" 
            className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Friends</span>
          </Link>
          
          {!profile.isOwnProfile && !profile.areFriends && profile.role === 'Student' && (
            <button
              onClick={sendFriendRequest}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Send Friend Request</span>
            </button>
          )}
        </div>

        {/* Cover Photo */}
        <div className="rounded-xl overflow-hidden border border-border bg-card mb-6">
          <div
            className="h-48 sm:h-60 w-full bg-cover bg-center relative"
            style={{
              backgroundImage: profile.coverUrl 
                ? `url(${profile.coverUrl})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <img
              src={getProfilePicture(profile)}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                {profile.areFriends && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    <Users className="w-4 h-4 inline mr-1" />
                    Friend
                  </span>
                )}
                {profile.isPeerMentor && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    <Award className="w-4 h-4 inline mr-1" />
                    Peer Mentor
                  </span>
                )}
              </div>
              <p className="text-foreground/60 mb-3">@{profile.displayHandle}</p>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-primary" />
                  <span>{profile.xp} XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-secondary" />
                  <span>{profile.badges?.length || 0} badges</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-foreground/60" />
                  <span>Joined {fmtDate(profile.createdAt)}</span>
                </div>
              </div>

              {profile.interests && profile.interests.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-foreground/80 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-primary/10 text-primary px-2 py-1 rounded text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Progress - Only visible to friends */}
        {canViewLearningProgress ? (
          <div className="space-y-6">
            {/* Enrolled Courses */}
            {profile.dashboardData?.enrolledCourses && profile.dashboardData.enrolledCourses.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Current Courses ({profile.dashboardData.enrolledCourses.length})
                </h2>
                <div className="grid gap-4">
                  {profile.dashboardData.enrolledCourses.map((enrollment, index) => {
                    const course = enrollment.course;
                    const progress = course?.lectures?.length > 0 
                      ? (enrollment.completedLectures?.length || 0) / course.lectures.length * 100 
                      : 0;
                    
                    return (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <h3 className="font-medium text-foreground mb-2">{course?.title}</h3>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-foreground/60">
                          {Math.round(progress)}% complete • {enrollment.completedLectures?.length || 0} of {course?.lectures?.length || 0} lectures
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Certificates */}
            {profile.dashboardData?.certificates && profile.dashboardData.certificates.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Certificates ({profile.dashboardData.certificates.length})
                </h2>
                <div className="grid gap-4">
                  {profile.dashboardData.certificates.map((cert, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <h3 className="font-medium text-foreground">{cert.course?.title}</h3>
                      <p className="text-sm text-foreground/60">
                        Completed on {fmtDate(cert.issueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Lock className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Learning Progress Private</h2>
            <p className="text-foreground/60 mb-4">
              You need to be friends with {profile.name} to view their learning progress.
            </p>
            {!profile.isOwnProfile && profile.role === 'Student' && (
              <button
                onClick={sendFriendRequest}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Send Friend Request
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
