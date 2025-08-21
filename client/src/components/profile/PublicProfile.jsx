import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Award, BookOpen, Calendar, Lock, Sparkles, Star, Zap, Heart, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import friendService from '../../services/friendService';
import { getProfilePicture } from '../../utils/profilePictureUtils';
import { fmtDate } from '../../utils/dateUtils';
import bg from '../auth/evening-b2g.jpg';

const PublicProfile = () => {
  const { handle } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug handle parameter
  console.log('PublicProfile handle:', handle);

  useEffect(() => {
    if (!handle || handle === 'undefined' || handle === 'null') {
      toast.error('Invalid profile handle');
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [handle]);

  const fetchProfile = async () => {
    if (!handle || handle === 'undefined' || handle === 'null') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await friendService.getPublicProfile(handle);
      setProfile(response.data.user);
    } catch (error) {
      console.error('Profile fetch error:', error);
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
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay matching auth page */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60" />
        
        {/* Enhanced Background Animation */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/5 rounded-full"
              style={{
                width: Math.random() * 120 + 40,
                height: Math.random() * 120 + 40,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 30 - 15, 0],
                opacity: [0.1, 0.6, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl"
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity },
            }}
          >
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay matching auth page */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60" />
        
        {/* Enhanced Background Animation */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-blue-400/10 rounded-full"
              style={{
                width: Math.random() * 100 + 30,
                height: Math.random() * 100 + 30,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: Math.random() * 5 + 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-lg bg-white/10 border border-white/25 rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-600/40"
            >
              <Users className="w-10 h-10 text-slate-300" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">Profile Not Found</h1>
            <p className="text-slate-300 mb-10 text-lg leading-relaxed">The user you're looking for doesn't exist in our galaxy.</p>
            <Link 
              to="/friends" 
              className="inline-flex items-center space-x-3 backdrop-blur-md bg-slate-700/20 hover:bg-slate-600/30 text-white px-8 py-4 rounded-2xl transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 shadow-lg group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Friends</span>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const canViewLearningProgress = profile.areFriends || profile.isOwnProfile;

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay matching auth page */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60" />

      {/* Enhanced Background Animation */}
      <div className="absolute inset-0">
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-blue-400/8 rounded-full"
            style={{
              width: Math.random() * 150 + 50,
              height: Math.random() * 150 + 50,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.05, 0.3, 0.05],
              scale: [1, 1.4, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating Sparkles and Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 360, 720],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          >
            <Sparkles className="w-6 h-6 text-blue-300/70" />
          </motion.div>
        ))}
        
        {/* Additional floating hearts */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`heart-${i}`}
            className="absolute"
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -200, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: Math.random() * 6,
            }}
          >
            <Heart className="w-4 h-4 text-pink-300/50" />
          </motion.div>
        ))}

        {/* Lightning bolts */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`zap-${i}`}
            className="absolute"
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: Math.random() * 8 + 4,
            }}
          >
            <Zap className="w-5 h-5 text-yellow-300/60" />
          </motion.div>
        ))}
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/friends" 
              className="flex items-center space-x-3 backdrop-blur-lg bg-slate-700/20 hover:bg-slate-600/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 shadow-lg group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Friends</span>
            </Link>
          </motion.div>
          
          {!profile.isOwnProfile && !profile.areFriends && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendFriendRequest}
              className="flex items-center space-x-3 backdrop-blur-lg bg-gradient-to-r from-blue-600/30 to-indigo-700/30 hover:from-blue-600/40 hover:to-indigo-700/40 text-white px-8 py-4 rounded-2xl transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50 shadow-2xl group"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-semibold">Send Friend Request</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-blue-300 rounded-full opacity-70"
              />
            </motion.button>
          )}
        </motion.div>

        {/* Cover Photo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl group"
        >
          <div
            className="h-72 sm:h-96 w-full bg-cover bg-center relative"
            style={{
              backgroundImage: profile.coverUrl 
                ? `url(${profile.coverUrl})` 
                : 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-800/30 to-transparent" />
            <div className="absolute inset-0 backdrop-blur-[1px] bg-slate-800/10" />
            
            {/* Cover photo overlay effects */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`cover-effect-${i}`}
                  className="absolute bg-blue-300/20 rounded-full"
                  style={{
                    width: Math.random() * 60 + 20,
                    height: Math.random() * 60 + 20,
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0, 0.4, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: Math.random() * 6 + 4,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Profile Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-lg bg-slate-800/20 border border-slate-600/30 rounded-3xl p-10 mb-8 shadow-2xl relative overflow-hidden"
        >
          {/* Card background effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`card-bg-${i}`}
                className="absolute bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full"
                style={{
                  width: Math.random() * 200 + 100,
                  height: Math.random() * 200 + 100,
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                }}
                animate={{
                  x: [0, 50, 0],
                  y: [0, -30, 0],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: Math.random() * 10 + 8,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 relative z-10">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative group"
            >
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-500 blur-lg"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <motion.img
                src={getProfilePicture(profile)}
                alt={profile.name}
                className="relative w-36 h-36 rounded-full object-cover border-4 border-slate-500/40 shadow-2xl"
                whileHover={{ 
                  boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.5)" 
                }}
              />
              
              {/* Profile photo glow effect */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
              />
            </motion.div>
            
            <div className="flex-1 space-y-6 relative">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-bold text-white bg-gradient-to-r from-slate-100 via-blue-200 to-slate-300 bg-clip-text text-transparent drop-shadow-lg"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {profile.name}
                </motion.h1>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <AnimatePresence>
                    {profile.areFriends && (
                      <motion.span 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="backdrop-blur-md bg-emerald-600/25 text-emerald-200 px-4 py-2 rounded-2xl text-sm border border-emerald-400/30 flex items-center space-x-2 shadow-lg"
                      >
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Friend</span>
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-emerald-300 rounded-full"
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {profile.isPeerMentor && (
                      <motion.span 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="backdrop-blur-md bg-purple-600/25 text-purple-200 px-4 py-2 rounded-2xl text-sm border border-purple-400/30 flex items-center space-x-2 shadow-lg"
                      >
                        <Award className="w-4 h-4" />
                        <span className="font-medium">Peer Mentor</span>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="w-2 h-2 bg-purple-300 rounded-full"
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl text-slate-300 text-center sm:text-left font-light tracking-wide"
              >
                @{profile.displayHandle}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-4 text-sm text-slate-300 justify-center sm:justify-start"
              >
                <motion.div 
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 backdrop-blur-md bg-gradient-to-r from-yellow-600/20 to-orange-600/20 px-5 py-3 rounded-2xl border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg group"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Award className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
                  </motion.div>
                  <span className="text-white font-semibold">{profile.xp} XP</span>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-yellow-400 rounded-full opacity-70"
                  />
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 backdrop-blur-md bg-gradient-to-r from-blue-600/20 to-indigo-600/20 px-5 py-3 rounded-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-lg group"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Star className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                  </motion.div>
                  <span className="text-white font-semibold">{profile.badges?.length || 0} badges</span>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-2 h-2 bg-blue-400 rounded-full opacity-70"
                  />
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 backdrop-blur-md bg-gradient-to-r from-emerald-600/20 to-teal-600/20 px-5 py-3 rounded-2xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 shadow-lg group"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 8, repeat: Infinity },
                      scale: { duration: 3, repeat: Infinity }
                    }}
                  >
                    <Calendar className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                  </motion.div>
                  <span className="text-white font-semibold">Joined {fmtDate(profile.createdAt)}</span>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                  />
                </motion.div>
              </motion.div>

              {profile.interests && profile.interests.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8"
                >
                  <h3 className="text-xl font-semibold text-slate-200 mb-4 text-center sm:text-left">Interests</h3>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    {profile.interests.map((interest, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ 
                          scale: 1.08, 
                          y: -5,
                          boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)"
                        }}
                        className="backdrop-blur-md bg-gradient-to-r from-slate-600/20 to-slate-700/20 text-slate-200 px-4 py-3 rounded-2xl text-sm border border-slate-500/30 hover:border-slate-400/50 transition-all duration-300 shadow-lg cursor-pointer relative overflow-hidden group"
                      >
                        <span className="relative z-10 font-medium">{interest}</span>
                        
                        {/* Hover effect overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={false}
                        />
                        
                        {/* Floating particle effect on hover */}
                        <motion.div
                          className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-300 rounded-full opacity-0 group-hover:opacity-100"
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 0.5,
                          }}
                          style={{
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Learning Progress - Only visible to friends */}
        {canViewLearningProgress ? (
          <div className="space-y-10">
            {/* Enrolled Courses */}
            {profile.dashboardData?.enrolledCourses && profile.dashboardData.enrolledCourses.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="backdrop-blur-lg bg-slate-800/20 border border-slate-600/30 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
              >
                {/* Card background effects */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={`course-bg-${i}`}
                      className="absolute bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"
                      style={{
                        width: Math.random() * 150 + 80,
                        height: Math.random() * 150 + 80,
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                      }}
                      animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: Math.random() * 8 + 6,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="text-3xl font-bold mb-8 flex items-center text-white"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="mr-4 p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30"
                    >
                      <BookOpen className="w-7 h-7 text-blue-300" />
                    </motion.div>
                    Current Courses
                    <motion.span 
                      className="ml-3 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-xl text-lg font-normal"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {profile.dashboardData.enrolledCourses.length}
                    </motion.span>
                  </motion.h2>
                  
                  <div className="grid gap-8">
                    {profile.dashboardData.enrolledCourses.map((enrollment, index) => {
                      const course = enrollment.course;
                      const progress = course?.lectures?.length > 0 
                        ? (enrollment.completedLectures?.length || 0) / course.lectures.length * 100 
                        : 0;
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 1.0 + index * 0.15 }}
                          whileHover={{ 
                            scale: 1.03, 
                            y: -5,
                            boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.3)"
                          }}
                          className="backdrop-blur-md bg-slate-700/15 border border-slate-500/30 rounded-3xl p-8 hover:border-slate-400/50 transition-all duration-500 group relative overflow-hidden"
                        >
                          {/* Course card glow effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            initial={false}
                          />
                          
                          <div className="relative z-10">
                            <h3 className="font-bold text-white mb-6 text-xl tracking-wide">{course?.title}</h3>
                            
                            <div className="relative w-full bg-slate-600/30 rounded-full h-4 mb-4 overflow-hidden border border-slate-500/30">
                              <motion.div 
                                className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 h-4 rounded-full relative overflow-hidden"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, delay: 1.1 + index * 0.15 }}
                              >
                                {/* Progress bar shimmer effect */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                  animate={{ x: ['-100%', '200%'] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                />
                              </motion.div>
                            </div>
                            
                            <p className="text-slate-300 text-lg">
                              <span className="font-semibold text-blue-300">{Math.round(progress)}%</span> complete • 
                              <span className="font-semibold text-white"> {enrollment.completedLectures?.length || 0}</span> of 
                              <span className="font-semibold text-white"> {course?.lectures?.length || 0}</span> lectures
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Certificates */}
            {profile.dashboardData?.certificates && profile.dashboardData.certificates.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="backdrop-blur-lg bg-slate-800/20 border border-slate-600/30 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
              >
                {/* Card background effects */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`cert-bg-${i}`}
                      className="absolute bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full"
                      style={{
                        width: Math.random() * 120 + 60,
                        height: Math.random() * 120 + 60,
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                      }}
                      animate={{
                        x: [0, 25, 0],
                        y: [0, -15, 0],
                        opacity: [0.1, 0.25, 0.1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: Math.random() * 10 + 8,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 }}
                    className="text-3xl font-bold mb-8 flex items-center text-white"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 4, repeat: Infinity },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="mr-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-400/30"
                    >
                      <Award className="w-7 h-7 text-yellow-300" />
                    </motion.div>
                    Certificates
                    <motion.span 
                      className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl text-lg font-normal"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: ["0 0 0 0 rgba(245, 158, 11, 0.4)", "0 0 0 10px rgba(245, 158, 11, 0)", "0 0 0 0 rgba(245, 158, 11, 0)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {profile.dashboardData.certificates.length}
                    </motion.span>
                  </motion.h2>
                  
                  <div className="grid gap-8">
                    {profile.dashboardData.certificates.map((cert, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 1.4 + index * 0.15 }}
                        whileHover={{ 
                          scale: 1.03, 
                          y: -5,
                          boxShadow: "0 20px 40px -10px rgba(245, 158, 11, 0.3)"
                        }}
                        className="backdrop-blur-md bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-400/30 rounded-3xl p-8 hover:border-yellow-400/50 transition-all duration-500 group relative overflow-hidden"
                      >
                        {/* Certificate glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-yellow-300/10 to-orange-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          initial={false}
                        />
                        
                        {/* Floating certificate icon */}
                        <motion.div
                          animate={{ 
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="absolute top-4 right-4 p-2 bg-yellow-400/20 rounded-xl border border-yellow-300/40"
                        >
                          <Award className="w-6 h-6 text-yellow-300" />
                        </motion.div>
                        
                        <div className="relative z-10">
                          <h3 className="font-bold text-white text-xl tracking-wide pr-12">{cert.course?.title}</h3>
                          <p className="text-yellow-200 mt-3 text-lg font-medium">
                            Completed on {fmtDate(cert.issueDate)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="backdrop-blur-lg bg-slate-800/20 border border-slate-600/30 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Private section background effects */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`private-bg-${i}`}
                  className="absolute bg-slate-600/10 rounded-full"
                  style={{
                    width: Math.random() * 100 + 50,
                    height: Math.random() * 100 + 50,
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.3, 0.1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: Math.random() * 8 + 6,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-24 h-24 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-600/40"
              >
                <Lock className="w-12 h-12 text-slate-300" />
              </motion.div>
              
              <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>
                Learning Progress Private
              </h2>
              <p className="text-slate-300 mb-12 text-xl leading-relaxed max-w-md mx-auto">
                You need to be friends with <span className="text-white font-semibold">{profile.name}</span> to view their learning progress.
              </p>
              
              {!profile.isOwnProfile && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendFriendRequest}
                  className="backdrop-blur-lg bg-gradient-to-r from-blue-600/30 to-indigo-700/30 hover:from-blue-600/40 hover:to-indigo-700/40 text-white px-10 py-5 rounded-2xl transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50 shadow-2xl group font-semibold text-lg"
                >
                  <span className="flex items-center space-x-3">
                    <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span>Send Friend Request</span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 bg-blue-300 rounded-full opacity-70"
                    />
                  </span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
