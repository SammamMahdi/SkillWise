import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ChevronRight, 
  Sparkles, 
  Brain, 
  Code, 
  Globe, 
  Music, 
  Users, 
  Atom,
  Zap,
  Edit3,
  X,
  ArrowRight,
  SkipForward
} from 'lucide-react';
import { skillConnectService } from '../../services/skillConnectService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import bg from '../auth/evening-b2g.jpg';

const iconMap = {
  Code: Code,
  Globe: Globe,
  Brain: Brain,
  Atom: Atom,
  Zap: Zap,
  Music: Music,
  Edit3: Edit3,
  Users: Users
};

const SkillOnboarding = () => {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [skillsData, setSkillsData] = useState({});
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedSkillDetails, setSelectedSkillDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const steps = [
    'Welcome',
    'Select Skills',
    'Customize Skills',
    'Complete'
  ];

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await skillConnectService.getAllSkills();
      if (response.success) {
        setSkillsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skill) => {
    const skillId = skill._id;
    const isSelected = selectedSkills.includes(skillId);
    
    if (isSelected) {
      setSelectedSkills(prev => prev.filter(id => id !== skillId));
      setSelectedSkillDetails(prev => {
        const updated = { ...prev };
        delete updated[skillId];
        return updated;
      });
    } else {
      setSelectedSkills(prev => [...prev, skillId]);
      setSelectedSkillDetails(prev => ({
        ...prev,
        [skillId]: {
          skill: skill,
          selectedSubSkills: [],
          proficiencyLevel: 'Beginner'
        }
      }));
    }
  };

  const handleSubSkillToggle = (skillId, subSkillName) => {
    setSelectedSkillDetails(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        selectedSubSkills: prev[skillId].selectedSubSkills.includes(subSkillName)
          ? prev[skillId].selectedSubSkills.filter(name => name !== subSkillName)
          : [...prev[skillId].selectedSubSkills, subSkillName]
      }
    }));
  };

  const handleProficiencyChange = (skillId, level) => {
    setSelectedSkillDetails(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        proficiencyLevel: level
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      
      const skillPreferences = selectedSkills.map(skillId => ({
        skillId,
        selectedSubSkills: selectedSkillDetails[skillId]?.selectedSubSkills || [],
        proficiencyLevel: selectedSkillDetails[skillId]?.proficiencyLevel || 'Beginner'
      }));

      const response = await skillConnectService.saveUserSkillPreferences(skillPreferences, true);
      
      if (response.success) {
        toast.success('Welcome to SkillConnect! Your preferences have been saved.');
        // Update user context to reflect completed onboarding
        await updateProfile({ 
          skillPreferences: { 
            ...response.data,
            hasCompletedSkillOnboarding: true 
          } 
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving skill preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}>
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading skills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
    }`}
    style={theme === 'dark' ? {
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    } : {}}>
      {/* Overlay for readability */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-subtle"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/15 rounded-full animate-pulse-subtle"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card/20 backdrop-blur-sm border border-white/10 text-foreground/40'
                  }`}>
                    {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      index < currentStep ? 'bg-primary' : 'bg-card/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-xl font-semibold text-foreground text-center">
              {steps[currentStep]}
            </h2>
          </div>

          {/* Step Content */}
          <div className="bg-card/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {currentStep === 0 && (
              <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
            )}
            
            {currentStep === 1 && (
              <SkillSelectionStep
                skillsData={skillsData}
                selectedSkills={selectedSkills}
                onSkillSelect={handleSkillSelect}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            )}
            
            {currentStep === 2 && (
              <SkillCustomizationStep
                selectedSkills={selectedSkills}
                selectedSkillDetails={selectedSkillDetails}
                onSubSkillToggle={handleSubSkillToggle}
                onProficiencyChange={handleProficiencyChange}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            )}
            
            {currentStep === 3 && (
              <CompletionStep
                selectedSkills={selectedSkills}
                selectedSkillDetails={selectedSkillDetails}
                onComplete={handleComplete}
                onPrevious={handlePrevious}
                saving={saving}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep = ({ onNext, onSkip }) => (
  <div className="text-center">
    <div className="mb-8">
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Welcome to SkillConnect!
      </h1>
      <p className="text-lg text-foreground/80 mb-6 leading-relaxed">
        Discover and connect with like-minded learners who share your interests and skills. 
        Let's build your learning profile to find your perfect study companions.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-primary/10 rounded-xl p-4">
          <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground mb-1">Smart Matching</h3>
          <p className="text-sm text-foreground/60">Connect based on skills, age, and courses</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-4">
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground mb-1">Community</h3>
          <p className="text-sm text-foreground/60">Join a network of passionate learners</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-4">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground mb-1">Growth</h3>
          <p className="text-sm text-foreground/60">Learn together and achieve more</p>
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <button
        onClick={onSkip}
        className="px-6 py-3 text-foreground/60 hover:text-foreground transition-colors duration-200 flex items-center space-x-2"
      >
        <SkipForward className="w-4 h-4" />
        <span>Skip for now</span>
      </button>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center space-x-2 font-semibold"
      >
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Skill Selection Step Component
const SkillSelectionStep = ({ skillsData, selectedSkills, onSkillSelect, onNext, onPrevious }) => (
  <div>
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Skills</h2>
      <p className="text-foreground/70">Select the skills you're interested in or currently learning</p>
    </div>

    <div className="space-y-6 mb-8">
      {Object.entries(skillsData).map(([category, skills]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-white/10 pb-2">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => {
              const IconComponent = iconMap[skill.icon] || Code;
              const isSelected = selectedSkills.includes(skill._id);
              
              return (
                <div
                  key={skill._id}
                  onClick={() => onSkillSelect(skill)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-card/10 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-card/20'
                    }`} style={{ backgroundColor: isSelected ? skill.color : undefined }}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-1">{skill.name}</h4>
                      <p className="text-sm text-foreground/60 leading-relaxed">{skill.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          skill.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                          skill.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          skill.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {skill.difficulty}
                        </span>
                        {skill.userCount > 0 && (
                          <span className="text-xs text-foreground/40">
                            {skill.userCount} learners
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        className="px-6 py-3 text-foreground/60 hover:text-foreground transition-colors duration-200"
      >
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={selectedSkills.length === 0}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Continue ({selectedSkills.length} selected)</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Skill Customization Step Component
const SkillCustomizationStep = ({ 
  selectedSkills, 
  selectedSkillDetails, 
  onSubSkillToggle, 
  onProficiencyChange, 
  onNext, 
  onPrevious 
}) => (
  <div>
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-2">Customize Your Skills</h2>
      <p className="text-foreground/70">Select specific areas and set your proficiency level</p>
    </div>

    <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
      {selectedSkills.map((skillId) => {
        const skillDetail = selectedSkillDetails[skillId];
        if (!skillDetail) return null;
        
        const skill = skillDetail.skill;
        const IconComponent = iconMap[skill.icon] || Code;
        
        return (
          <div key={skillId} className="bg-card/10 border border-white/10 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: skill.color }}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{skill.name}</h3>
                <p className="text-sm text-foreground/60">{skill.category}</p>
              </div>
            </div>

            {/* Proficiency Level */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Your Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                  <button
                    key={level}
                    onClick={() => onProficiencyChange(skillId, level)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                      skillDetail.proficiencyLevel === level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card/20 text-foreground/60 hover:bg-card/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-skills */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Areas of Interest (optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {skill.subSkills.map((subSkill) => (
                  <label
                    key={subSkill.name}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-card/20 cursor-pointer transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={skillDetail.selectedSubSkills.includes(subSkill.name)}
                      onChange={() => onSubSkillToggle(skillId, subSkill.name)}
                      className="rounded border-white/20 bg-card/20 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{subSkill.name}</span>
                      <p className="text-xs text-foreground/50">{subSkill.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        className="px-6 py-3 text-foreground/60 hover:text-foreground transition-colors duration-200"
      >
        Previous
      </button>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center space-x-2 font-semibold"
      >
        <span>Continue</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Completion Step Component
const CompletionStep = ({ selectedSkills, selectedSkillDetails, onComplete, onPrevious, saving }) => (
  <div className="text-center">
    <div className="mb-8">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h2>
      <p className="text-foreground/70 mb-6">
        Here's a summary of your skills. You can always update these later in your profile.
      </p>

      <div className="bg-card/10 border border-white/10 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Selected Skills ({selectedSkills.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectedSkills.map((skillId) => {
            const skillDetail = selectedSkillDetails[skillId];
            if (!skillDetail) return null;
            
            const skill = skillDetail.skill;
            const IconComponent = iconMap[skill.icon] || Code;
            
            return (
              <div key={skillId} className="flex items-center space-x-3 p-3 bg-card/20 rounded-lg">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: skill.color }}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">{skill.name}</h4>
                  <p className="text-xs text-foreground/60">{skillDetail.proficiencyLevel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={saving}
        className="px-6 py-3 text-foreground/60 hover:text-foreground transition-colors duration-200 disabled:opacity-50"
      >
        Previous
      </button>
      <button
        onClick={onComplete}
        disabled={saving}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center space-x-2 font-semibold disabled:opacity-50"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <span>Complete Setup</span>
            <Check className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  </div>
);

export default SkillOnboarding;
