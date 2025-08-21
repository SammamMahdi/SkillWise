import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Star, 
  ArrowRight, 
  Filter, 
  RefreshCw, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Heart,
  Brain,
  BookOpen
} from 'lucide-react';
import * as THREE from 'three';
import { skillConnectService } from '../../services/skillConnectService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import AgeRestricted from '../common/AgeRestricted';
import bg from '../auth/evening-b2g.jpg';

const SkillConnect = () => {
  const { user } = useAuth();
  
  // Check if user is a child
  if (user?.role === 'child') {
    return (
      <AgeRestricted 
        title="SkillConnect"
        message="SkillConnect is designed for mature users who can handle advanced social networking and skill-based connections responsibly."
        redirectPath="/dashboard"
      />
    );
  }

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const connectionsRef = useRef([]);

  // Three.js floating animation setup
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create floating connection nodes
    const nodes = [];
    const nodeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const connectionLineGeometry = new THREE.BufferGeometry();
    
    // Create glowing materials for different skill categories
    const materials = {
      'Computer Science': new THREE.MeshBasicMaterial({ 
        color: 0x3B82F6, 
        transparent: true, 
        opacity: 0.8 
      }),
      'Physics': new THREE.MeshBasicMaterial({ 
        color: 0x10B981, 
        transparent: true, 
        opacity: 0.8 
      }),
      'Music Theory': new THREE.MeshBasicMaterial({ 
        color: 0xF59E0B, 
        transparent: true, 
        opacity: 0.8 
      }),
      'Psychology': new THREE.MeshBasicMaterial({ 
        color: 0xEF4444, 
        transparent: true, 
        opacity: 0.8 
      }),
      'default': new THREE.MeshBasicMaterial({ 
        color: 0x8B5CF6, 
        transparent: true, 
        opacity: 0.8 
      })
    };

    // Create random floating nodes
    for (let i = 0; i < 50; i++) {
      const material = Object.values(materials)[Math.floor(Math.random() * 5)];
      const node = new THREE.Mesh(nodeGeometry, material);
      
      node.position.x = (Math.random() - 0.5) * 10;
      node.position.y = (Math.random() - 0.5) * 10;
      node.position.z = (Math.random() - 0.5) * 10;
      
      node.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        originalPosition: node.position.clone()
      };
      
      nodes.push(node);
      scene.add(node);
    }

    // Create connection lines between nearby nodes
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x8B5CF6, 
      transparent: true, 
      opacity: 0.3 
    });

    camera.position.z = 5;
    sceneRef.current = { scene, camera, renderer, nodes, lineMaterial };

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Update node positions
      nodes.forEach(node => {
        node.position.add(node.userData.velocity);
        
        // Bounce off boundaries
        if (Math.abs(node.position.x) > 5) node.userData.velocity.x *= -1;
        if (Math.abs(node.position.y) > 5) node.userData.velocity.y *= -1;
        if (Math.abs(node.position.z) > 5) node.userData.velocity.z *= -1;
        
        // Add subtle floating motion
        node.position.y += Math.sin(Date.now() * 0.001 + node.position.x) * 0.001;
      });

      // Update connection lines
      const lineVertices = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = nodes[i].position.distanceTo(nodes[j].position);
          if (distance < 2) {
            lineVertices.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
            lineVertices.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
          }
        }
      }

      connectionLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
      
      // Remove old lines and add new ones
      scene.children = scene.children.filter(child => child.type !== 'Line');
      if (lineVertices.length > 0) {
        const connectionLines = new THREE.LineSegments(connectionLineGeometry, lineMaterial);
        scene.add(connectionLines);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Fetch user connections
  useEffect(() => {
    fetchConnections();
    fetchAvailableSkills();
  }, [currentPage, selectedSkills]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await skillConnectService.getConnections({
        page: currentPage,
        limit: 10,
        skills: selectedSkills
      });
      
      if (response.success) {
        const connectionsData = response.data?.connections || [];
        if (currentPage === 1) {
          setConnections(connectionsData);
        } else {
          setConnections(prev => [...prev, ...connectionsData]);
        }
        setHasMore(response.data?.pagination?.hasNext || false);
        connectionsRef.current = connectionsData;
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
      // Set connections to empty array on error to prevent map errors
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const response = await skillConnectService.getAllSkills();
      if (response.success) {
        setAvailableSkills(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchConnections();
    setRefreshing(false);
  };

  const handleSkillFilter = (skillId) => {
    setSelectedSkills(prev => {
      const newSkills = prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId];
      setCurrentPage(1);
      return newSkills;
    });
  };

  const handleConnect = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getSkillCategoryIcon = (category) => {
    switch (category) {
      case 'Computer Science': return <Zap className="w-4 h-4" />;
      case 'Physics': return <Target className="w-4 h-4" />;
      case 'Music Theory': return <Heart className="w-4 h-4" />;
      case 'Psychology': return <Brain className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Three.js Canvas */}
      <div 
        ref={mountRef} 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
          opacity: theme === 'dark' ? 0.6 : 0.3,
          filter: 'blur(0.5px)'
        }}
      />

      {/* Glassmorphism overlay */}
      <div className="relative z-10 min-h-screen bg-black/10 backdrop-blur-xl">
        {/* Header */}
        <motion.header 
          className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">SkillConnect</h1>
                    <p className="text-sm text-white/70">Discover your learning connections</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Filter className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Skills Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-6"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-7xl mx-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Filter by Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <motion.button
                      key={skill._id}
                      onClick={() => handleSkillFilter(skill._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedSkills.includes(skill._id)
                          ? 'bg-white/20 text-white border-2 border-white/40'
                          : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-2">
                        {getSkillCategoryIcon(skill.category)}
                        <span>{skill.name}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Message */}
          <motion.div 
            className="text-center mb-12"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome to SkillConnect, {user?.username || user?.name}! 
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Discover users with complementary skills and build meaningful learning connections.
            </p>
          </motion.div>

          {/* Connections Grid */}
          {loading && currentPage === 1 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center space-x-3 text-white">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-lg">Finding your skill connections...</span>
              </div>
            </div>
          ) : connections.length === 0 ? (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">No connections found</h3>
              <p className="text-white/70 mb-6">
                Try adjusting your skill filters or complete your skill preferences to find matches.
              </p>
              <motion.button
                onClick={() => navigate('/skill-connect/onboarding')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Complete Skill Profile
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.isArray(connections) && connections.map((connection, index) => (
                <motion.div
                  key={connection.user?._id || index}
                  className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => handleConnect(connection.user?.username || connection.user?._id)}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  {/* User Avatar */}
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {(connection.user.name || connection.user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-white mt-2">
                      {connection.user?.name || connection.user?.username || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-white/70">
                      {connection.user?.role || 'Student'}
                    </p>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">
                        {Math.round(connection.matchScore || 0)}% Match
                      </span>
                    </div>
                  </div>

                  {/* Common Skills */}
                  {connection.commonSkills && connection.commonSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white/80 mb-2">Common Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {connection.commonSkills.slice(0, 3).map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-white/90 border border-white/20"
                          >
                            {skill}
                          </span>
                        ))}
                        {connection.commonSkills.length > 3 && (
                          <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                            +{connection.commonSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Connect Button */}
                  <motion.button
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-medium group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Users className="w-4 h-4" />
                    <span>Connect</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && connections.length > 0 && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Load More Connections</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.button>
              
              <p className="text-sm text-white/60 mt-4">
                Showing {connections.length} connections • Up to 50 total
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SkillConnect;
