const { 
  Skill, 
  SkillUser, 
  UserSkillPreference, 
  AgeGroup, 
  CourseEnrollment, 
  SkillConnection 
} = require('../models/SkillConnect');
const User = require('../models/User');
const Course = require('../models/Course');

// Initialize skills data
const initializeSkills = async () => {
  try {
    const existingSkills = await Skill.countDocuments();
    if (existingSkills > 0) {
      return { success: true, message: 'Skills already initialized' };
    }

    const skillsData = [
      // Computer Science
      {
        name: 'Programming Fundamentals',
        category: 'Computer Science',
        description: 'Core programming concepts and problem-solving skills',
        icon: 'Code',
        color: '#3B82F6',
        subSkills: [
          { name: 'Variables and Data Types', description: 'Understanding basic data structures', difficulty: 'Beginner' },
          { name: 'Control Flow', description: 'Loops, conditionals, and decision making', difficulty: 'Beginner' },
          { name: 'Functions and Methods', description: 'Writing reusable code blocks', difficulty: 'Intermediate' },
          { name: 'Object-Oriented Programming', description: 'Classes, objects, and inheritance', difficulty: 'Intermediate' },
          { name: 'Data Structures', description: 'Arrays, lists, trees, and graphs', difficulty: 'Advanced' },
          { name: 'Algorithms', description: 'Sorting, searching, and optimization', difficulty: 'Advanced' }
        ]
      },
      {
        name: 'Web Development',
        category: 'Computer Science',
        description: 'Building websites and web applications',
        icon: 'Globe',
        color: '#10B981',
        subSkills: [
          { name: 'HTML/CSS', description: 'Structure and styling of web pages', difficulty: 'Beginner' },
          { name: 'JavaScript', description: 'Interactive web programming', difficulty: 'Intermediate' },
          { name: 'Frontend Frameworks', description: 'React, Vue, Angular', difficulty: 'Advanced' },
          { name: 'Backend Development', description: 'Server-side programming', difficulty: 'Advanced' },
          { name: 'Database Management', description: 'SQL and NoSQL databases', difficulty: 'Intermediate' },
          { name: 'DevOps', description: 'Deployment and CI/CD', difficulty: 'Expert' }
        ]
      },
      {
        name: 'Machine Learning',
        category: 'Computer Science',
        description: 'AI and data science fundamentals',
        icon: 'Brain',
        color: '#8B5CF6',
        subSkills: [
          { name: 'Statistics and Probability', description: 'Mathematical foundations', difficulty: 'Intermediate' },
          { name: 'Data Preprocessing', description: 'Cleaning and preparing data', difficulty: 'Intermediate' },
          { name: 'Supervised Learning', description: 'Classification and regression', difficulty: 'Advanced' },
          { name: 'Unsupervised Learning', description: 'Clustering and dimensionality reduction', difficulty: 'Advanced' },
          { name: 'Deep Learning', description: 'Neural networks and deep architectures', difficulty: 'Expert' },
          { name: 'Natural Language Processing', description: 'Text analysis and understanding', difficulty: 'Expert' }
        ]
      },

      // Physics
      {
        name: 'Classical Mechanics',
        category: 'Physics',
        description: 'Motion, forces, and energy in the macroscopic world',
        icon: 'Atom',
        color: '#EF4444',
        subSkills: [
          { name: 'Kinematics', description: 'Motion without considering forces', difficulty: 'Beginner' },
          { name: 'Dynamics', description: 'Forces and motion relationships', difficulty: 'Intermediate' },
          { name: 'Energy and Work', description: 'Conservation laws and energy transfer', difficulty: 'Intermediate' },
          { name: 'Rotational Motion', description: 'Angular motion and torque', difficulty: 'Advanced' },
          { name: 'Oscillations', description: 'Harmonic motion and waves', difficulty: 'Advanced' },
          { name: 'Fluid Mechanics', description: 'Behavior of liquids and gases', difficulty: 'Expert' }
        ]
      },
      {
        name: 'Quantum Physics',
        category: 'Physics',
        description: 'Physics at the atomic and subatomic scale',
        icon: 'Zap',
        color: '#F59E0B',
        subSkills: [
          { name: 'Wave-Particle Duality', description: 'Fundamental quantum concepts', difficulty: 'Intermediate' },
          { name: 'Uncertainty Principle', description: 'Heisenberg uncertainty relations', difficulty: 'Advanced' },
          { name: 'Quantum States', description: 'Superposition and entanglement', difficulty: 'Advanced' },
          { name: 'Quantum Mechanics Math', description: 'Schrödinger equation and operators', difficulty: 'Expert' },
          { name: 'Quantum Field Theory', description: 'Advanced quantum frameworks', difficulty: 'Expert' }
        ]
      },

      // Music Theory
      {
        name: 'Music Fundamentals',
        category: 'Music Theory',
        description: 'Basic building blocks of music',
        icon: 'Music',
        color: '#EC4899',
        subSkills: [
          { name: 'Notes and Intervals', description: 'Musical alphabet and pitch relationships', difficulty: 'Beginner' },
          { name: 'Scales and Modes', description: 'Major, minor, and modal scales', difficulty: 'Beginner' },
          { name: 'Chord Construction', description: 'Triads and extended chords', difficulty: 'Intermediate' },
          { name: 'Chord Progressions', description: 'Harmonic movement and function', difficulty: 'Intermediate' },
          { name: 'Voice Leading', description: 'Smooth melodic connections', difficulty: 'Advanced' },
          { name: 'Advanced Harmony', description: 'Jazz and contemporary harmony', difficulty: 'Expert' }
        ]
      },
      {
        name: 'Music Composition',
        category: 'Music Theory',
        description: 'Creating original musical works',
        icon: 'Edit3',
        color: '#06B6D4',
        subSkills: [
          { name: 'Melody Writing', description: 'Creating memorable melodic lines', difficulty: 'Beginner' },
          { name: 'Rhythm and Meter', description: 'Time signatures and rhythmic patterns', difficulty: 'Intermediate' },
          { name: 'Form and Structure', description: 'Song forms and musical architecture', difficulty: 'Intermediate' },
          { name: 'Orchestration', description: 'Writing for different instruments', difficulty: 'Advanced' },
          { name: 'Counterpoint', description: 'Multiple independent melodic lines', difficulty: 'Advanced' },
          { name: 'Contemporary Techniques', description: 'Modern compositional methods', difficulty: 'Expert' }
        ]
      },

      // Psychology
      {
        name: 'Cognitive Psychology',
        category: 'Psychology',
        description: 'Mental processes and thinking patterns',
        icon: 'Brain',
        color: '#84CC16',
        subSkills: [
          { name: 'Memory and Learning', description: 'How we store and retrieve information', difficulty: 'Beginner' },
          { name: 'Attention and Perception', description: 'How we focus and interpret stimuli', difficulty: 'Intermediate' },
          { name: 'Decision Making', description: 'Cognitive biases and judgment', difficulty: 'Intermediate' },
          { name: 'Language Processing', description: 'How we understand and produce language', difficulty: 'Advanced' },
          { name: 'Problem Solving', description: 'Strategies for overcoming challenges', difficulty: 'Advanced' },
          { name: 'Consciousness', description: 'Awareness and altered states', difficulty: 'Expert' }
        ]
      },
      {
        name: 'Social Psychology',
        category: 'Psychology',
        description: 'How people interact and influence each other',
        icon: 'Users',
        color: '#F97316',
        subSkills: [
          { name: 'Social Influence', description: 'Conformity, compliance, and obedience', difficulty: 'Beginner' },
          { name: 'Group Dynamics', description: 'How groups form and function', difficulty: 'Intermediate' },
          { name: 'Attitude Formation', description: 'How opinions and beliefs develop', difficulty: 'Intermediate' },
          { name: 'Prejudice and Stereotyping', description: 'Bias and discrimination processes', difficulty: 'Advanced' },
          { name: 'Interpersonal Relationships', description: 'Attraction, love, and conflict', difficulty: 'Advanced' },
          { name: 'Cultural Psychology', description: 'Cross-cultural differences in behavior', difficulty: 'Expert' }
        ]
      }
    ];

    await Skill.insertMany(skillsData);
    console.log('Skills initialized successfully');
    return { success: true, message: 'Skills initialized successfully' };
  } catch (error) {
    console.error('Error initializing skills:', error);
    return { success: false, message: error.message };
  }
};

// Get all skills grouped by category
const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ isActive: true }).sort({ category: 1, name: 1 });
    
    const groupedSkills = skills.reduce((groups, skill) => {
      const category = skill.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
      return groups;
    }, {});

    res.json({
      success: true,
      data: groupedSkills
    });
  } catch (error) {
    console.error('Error getting skills:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's skill preferences
const getUserSkillPreferences = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).populate('skillPreferences.selectedSkills.skill');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        skillPreferences: user.skillPreferences,
        hasCompletedOnboarding: user.skillPreferences?.hasCompletedSkillOnboarding || false
      }
    });
  } catch (error) {
    console.error('Error getting user skill preferences:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save user's skill preferences
const saveUserSkillPreferences = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { selectedSkills, isOnboarding = false } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's skill preferences
    user.skillPreferences = {
      selectedSkills: selectedSkills.map(skill => ({
        skill: skill.skillId,
        selectedSubSkills: skill.selectedSubSkills || [],
        proficiencyLevel: skill.proficiencyLevel || 'Beginner',
        addedAt: new Date()
      })),
      hasCompletedSkillOnboarding: isOnboarding || user.skillPreferences?.hasCompletedSkillOnboarding || false,
      lastUpdated: new Date()
    };

    await user.save();

    // Update skill user tracking
    await updateSkillUserTracking(userId, selectedSkills);

    // Update age groups and course enrollments for connection algorithm
    await updateUserConnections(userId);

    res.json({
      success: true,
      message: 'Skill preferences saved successfully',
      data: user.skillPreferences
    });
  } catch (error) {
    console.error('Error saving skill preferences:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update skill user tracking
const updateSkillUserTracking = async (userId, selectedSkills) => {
  try {
    // Remove user from all previous skill trackings
    await SkillUser.updateMany(
      { 'users.user': userId },
      { $pull: { users: { user: userId } } }
    );

    // Add user to new skill trackings
    for (const skillSelection of selectedSkills) {
      await SkillUser.findOneAndUpdate(
        { skill: skillSelection.skillId },
        {
          $addToSet: {
            users: {
              user: userId,
              selectedSubSkills: skillSelection.selectedSubSkills || [],
              proficiencyLevel: skillSelection.proficiencyLevel || 'Beginner',
              addedAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    // Update user counts in skills
    for (const skillSelection of selectedSkills) {
      const skillUserDoc = await SkillUser.findOne({ skill: skillSelection.skillId });
      await Skill.findByIdAndUpdate(
        skillSelection.skillId,
        { userCount: skillUserDoc ? skillUserDoc.users.length : 0 }
      );
    }
  } catch (error) {
    console.error('Error updating skill user tracking:', error);
  }
};

// Update user connections data
const updateUserConnections = async (userId) => {
  try {
    const user = await User.findById(userId).populate('dashboardData.enrolledCourses.course');
    if (!user) return;

    // Update age groups
    if (user.age) {
      // Remove from all age groups first
      await AgeGroup.updateMany(
        { users: userId },
        { $pull: { users: userId } }
      );

      // Find or create appropriate age group (5-year ranges)
      const ageGroupMin = Math.floor(user.age / 5) * 5;
      const ageGroupMax = ageGroupMin + 4;
      
      await AgeGroup.findOneAndUpdate(
        { 'ageRange.min': ageGroupMin, 'ageRange.max': ageGroupMax },
        {
          $addToSet: { users: userId },
          ageRange: { min: ageGroupMin, max: ageGroupMax }
        },
        { upsert: true, new: true }
      );
    }

    // Update course enrollments
    if (user.dashboardData?.enrolledCourses) {
      for (const enrollment of user.dashboardData.enrolledCourses) {
        if (enrollment.course) {
          await CourseEnrollment.findOneAndUpdate(
            { course: enrollment.course._id || enrollment.course },
            { $addToSet: { enrolledUsers: userId } },
            { upsert: true, new: true }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error updating user connections:', error);
  }
};

// Calculate skill connections for a user
const calculateSkillConnections = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    const connections = await calculateUserConnections(userId);
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedConnections = connections.slice(startIndex, endIndex);

    // Populate user details
    const populatedConnections = await Promise.all(
      paginatedConnections.map(async (connection) => {
        const user = await User.findById(connection.connectedUser)
          .select('name username handle avatarUrl skillPreferences')
          .populate('skillPreferences.selectedSkills.skill', 'name category');
        
        return {
          ...connection,
          user
        };
      })
    );

    res.json({
      success: true,
      data: {
        connections: populatedConnections,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(connections.length / limit),
          totalConnections: connections.length,
          hasNext: endIndex < connections.length,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error calculating skill connections:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Core algorithm for calculating user connections
const calculateUserConnections = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate('skillPreferences.selectedSkills.skill')
      .populate('dashboardData.enrolledCourses.course');

    if (!user || !user.skillPreferences?.selectedSkills?.length) {
      return [];
    }

    const userSkills = user.skillPreferences.selectedSkills.map(s => s.skill._id.toString());
    const userAge = user.age;
    const userCourses = user.dashboardData?.enrolledCourses?.map(e => e.course?._id?.toString()).filter(Boolean) || [];

    // Get all potential connections (users with skills)
    const potentialConnections = await User.find({
      _id: { $ne: userId },
      'skillPreferences.selectedSkills': { $exists: true, $ne: [] },
      'skillPreferences.hasCompletedSkillOnboarding': true
    }).populate('skillPreferences.selectedSkills.skill').populate('dashboardData.enrolledCourses.course');

    const connections = [];

    for (const otherUser of potentialConnections) {
      if (!otherUser.skillPreferences?.selectedSkills?.length) continue;

      const otherSkills = otherUser.skillPreferences.selectedSkills.map(s => s.skill._id.toString());
      const otherAge = otherUser.age;
      const otherCourses = otherUser.dashboardData?.enrolledCourses?.map(e => e.course?._id?.toString()).filter(Boolean) || [];

      // Calculate skill match (60% weight)
      const commonSkills = userSkills.filter(skill => otherSkills.includes(skill));
      const skillMatchScore = commonSkills.length > 0 ? (commonSkills.length / Math.max(userSkills.length, otherSkills.length)) * 60 : 0;

      // Calculate age match (20% weight)
      let ageMatchScore = 0;
      if (userAge && otherAge) {
        const ageDifference = Math.abs(userAge - otherAge);
        ageMatchScore = Math.max(0, (10 - ageDifference) / 10) * 20;
      }

      // Calculate course match (20% weight)
      const commonCourses = userCourses.filter(course => otherCourses.includes(course));
      const courseMatchScore = commonCourses.length > 0 ? (commonCourses.length / Math.max(userCourses.length, otherCourses.length)) * 20 : 0;

      // Total match score
      const totalScore = skillMatchScore + ageMatchScore + courseMatchScore;

      if (totalScore > 10) { // Only include meaningful matches
        connections.push({
          connectedUser: otherUser._id,
          matchScore: Math.round(totalScore),
          matchReasons: {
            skillsMatch: {
              score: Math.round(skillMatchScore),
              commonSkills: commonSkills
            },
            ageMatch: {
              score: Math.round(ageMatchScore),
              ageDifference: userAge && otherAge ? Math.abs(userAge - otherAge) : null
            },
            courseMatch: {
              score: Math.round(courseMatchScore),
              commonCourses: commonCourses
            }
          },
          lastCalculated: new Date()
        });
      }
    }

    // Sort by match score descending
    connections.sort((a, b) => b.matchScore - a.matchScore);

    // Limit to top 50
    return connections.slice(0, 50);
  } catch (error) {
    console.error('Error in calculateUserConnections:', error);
    return [];
  }
};

module.exports = {
  initializeSkills,
  getAllSkills,
  getUserSkillPreferences,
  saveUserSkillPreferences,
  calculateSkillConnections
};
