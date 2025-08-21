import React from 'react';
import { motion } from 'framer-motion';
import { Baby, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bg from '../auth/evening-b2g.jpg';

const AgeRestricted = ({ 
  title = "SkillConnect", 
  message = "This feature is designed for older users who can handle advanced social networking.",
  redirectPath = "/dashboard" 
}) => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Content */}
      <motion.div 
        className="relative z-10 w-full max-w-2xl mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12 text-center">
          {/* Icon */}
          <motion.div 
            className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Baby className="w-16 h-16 text-white/80" />
          </motion.div>

          {/* Main Message */}
          <motion.h1 
            className="text-6xl md:text-8xl font-black text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            GROW UP
          </motion.h1>

          {/* Subtitle */}
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-white mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {title} is Not For You
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {message}
          </motion.p>

          {/* Fun Age Requirements */}
          <motion.div 
            className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Requirements:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span>Must be 13+ years old</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full" />
                <span>Mature mindset required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span>Social responsibility</span>
              </div>
            </div>
          </motion.div>

          {/* Back Button */}
          <motion.button
            onClick={() => navigate(redirectPath)}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/80 hover:to-pink-600/80 text-white font-semibold rounded-xl backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>

          {/* Floating Elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Additional floating effects */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/40 rounded-full"
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-3/4 right-1/4 w-2 h-2 bg-purple-400/60 rounded-full"
        animate={{ 
          y: [0, -15, 0],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-pink-400/40 rounded-full"
        animate={{ 
          y: [0, -25, 0],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ 
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </div>
  );
};

export default AgeRestricted;
