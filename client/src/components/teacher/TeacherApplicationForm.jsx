import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  BookOpen, 
  Heart, 
  Upload, 
  FileText, 
  Award, 
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import teacherApplicationService from '../../services/teacherApplicationService';
import toast from 'react-hot-toast';
import ThemeToggle from '../common/ThemeToggle';
import bg from '../auth/evening-b2g.jpg';

const TeacherApplicationForm = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [existingApplication, setExistingApplication] = useState(null);
  
  const [formData, setFormData] = useState({
    personalDetails: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    qualifications: {
      highestDegree: '',
      fieldOfStudy: '',
      university: '',
      graduationYear: new Date().getFullYear(),
      gpa: ''
    },
    experience: {
      yearsOfExperience: 0,
      previousPositions: [],
      teachingExperience: ''
    },
    specializations: [],
    motivation: {
      whyTeach: '',
      goals: '',
      contribution: ''
    }
  });
  
  const [files, setFiles] = useState({
    resume: null,
    certificates: [],
    identityDocument: null
  });
  
  const [portfolioLinks, setPortfolioLinks] = useState([]);

  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      const response = await teacherApplicationService.getMyApplication();
      setExistingApplication(response.data);
      
      if (response.data.applicationStatus === 'pending') {
        toast.info('You already have a pending application');
        navigate('/dashboard');
      } else if (response.data.applicationStatus === 'approved') {
        toast.success('Your application has been approved! You are now a teacher.');
        navigate('/dashboard');
      }
    } catch (error) {
      // No application exists, user can apply
      if (error.response?.status !== 404) {
        console.error('Error checking application:', error);
        toast.error('Error checking application status');
      }
    }
  };

  const steps = [
    { number: 1, title: 'Personal Details', icon: <User className="w-5 h-5" /> },
    { number: 2, title: 'Qualifications', icon: <GraduationCap className="w-5 h-5" /> },
    { number: 3, title: 'Experience', icon: <Briefcase className="w-5 h-5" /> },
    { number: 4, title: 'Specializations', icon: <BookOpen className="w-5 h-5" /> },
    { number: 5, title: 'Motivation', icon: <Heart className="w-5 h-5" /> },
    { number: 6, title: 'Documents', icon: <FileText className="w-5 h-5" /> }
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  // Helper functions for theme-aware styling
  const getInputClasses = () => `w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
    theme === 'dark'
      ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-violet-300/70'
      : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50'
  }`;

  const getSelectClasses = () => `w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
    theme === 'dark'
      ? 'bg-white/10 border-white/20 focus:border-white/30 text-white focus:ring-2 focus:ring-violet-300/70 [&>option]:text-black [&>option]:bg-white'
      : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 focus:ring-2 focus:ring-violet-500/50 [&>option]:text-black [&>option]:bg-white'
  }`;

  const getLabelClasses = () => `block text-sm font-medium mb-2 transition-colors duration-500 ${
    theme === 'dark' ? 'text-white' : 'text-slate-700'
  }`;

  const getHeadingClasses = () => `text-lg font-medium transition-colors duration-500 ${
    theme === 'dark' ? 'text-white' : 'text-slate-800'
  }`;

  const getButtonClasses = (variant = 'primary') => {
    const base = 'px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2';
    
    if (variant === 'secondary') {
      return `${base} ${
        theme === 'dark'
          ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
          : 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 shadow-md hover:shadow-lg'
      }`;
    }
    
    return `${base} ${
      theme === 'dark'
        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl'
    }`;
  };

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [
        ...prev.specializations,
        { subject: '', proficiencyLevel: 'intermediate', yearsOfExperience: 0 }
      ]
    }));
  };

  const removeSpecialization = (index) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const updateSpecialization = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }));
  };

  const addPreviousPosition = () => {
    setFormData(prev => ({
      ...prev,
      experience: {
        ...prev.experience,
        previousPositions: [
          ...prev.experience.previousPositions,
          { title: '', institution: '', duration: '', description: '' }
        ]
      }
    }));
  };

  const removePreviousPosition = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: {
        ...prev.experience,
        previousPositions: prev.experience.previousPositions.filter((_, i) => i !== index)
      }
    }));
  };

  const updatePreviousPosition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: {
        ...prev.experience,
        previousPositions: prev.experience.previousPositions.map((pos, i) => 
          i === index ? { ...pos, [field]: value } : pos
        )
      }
    }));
  };

  const addPortfolioLink = () => {
    setPortfolioLinks(prev => [
      ...prev,
      { title: '', url: '', description: '' }
    ]);
  };

  const removePortfolioLink = (index) => {
    setPortfolioLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updatePortfolioLink = (index, field, value) => {
    setPortfolioLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const handleFileChange = (fileType, event) => {
    const file = event.target.files[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [fileType]: file
      }));
    }
  };

  const handleCertificatesChange = (event) => {
    const fileList = Array.from(event.target.files);
    setFiles(prev => ({
      ...prev,
      certificates: fileList
    }));
  };

  const validateStep = (step) => {
    // Since nothing is mandatory anymore, always allow progression
    return true;
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const applicationData = {
        ...formData,
        portfolioLinks
      };

      await teacherApplicationService.submitApplication(applicationData, files);
      
      toast.success('Application submitted successfully!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Extract specific error message for user
      let errorMessage = 'Error submitting application';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show validation details if available
      if (error.response?.data?.details) {
        const validationDetails = Object.keys(error.response.data.details).map(key => {
          const detail = error.response.data.details[key];
          return `${key}: ${detail.message || detail}`;
        }).join('\n');
        
        errorMessage += `\n\nValidation details:\n${validationDetails}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (existingApplication && existingApplication.applicationStatus !== 'rejected') {
    return (
      <section
        className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
          theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
        }`}
        style={theme === 'dark' ? {
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        {/* Theme toggle */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle size="md" />
        </div>

        {/* Overlay */}
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className={`w-full max-w-2xl rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-10 transition-all duration-500 text-center ${
            theme === 'dark'
              ? 'border-white/15 bg-white/10 text-white'
              : 'border-slate-200/50 bg-white/90 text-slate-800'
          }`}>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className={`text-2xl font-bold mb-2 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>Application Status</h1>
            <p className={`mb-4 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-600'
            }`}>
              You have already submitted a teacher application.
            </p>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              existingApplication.applicationStatus === 'pending' 
                ? theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' : 'bg-yellow-100 text-yellow-800'
                : existingApplication.applicationStatus === 'approved'
                ? theme === 'dark' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-green-100 text-green-800'
                : theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-red-100 text-red-800'
            }`}>
              Status: {existingApplication.applicationStatus.charAt(0).toUpperCase() + existingApplication.applicationStatus.slice(1)}
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* Overlay */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      <div className="relative z-10 min-h-screen py-10 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <GraduationCap className={`w-12 h-12 mx-auto mb-4 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-700'
            }`} />
            <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", serif' }}>
              Teacher Application
            </h1>
            <p className={`mt-3 text-lg leading-relaxed transition-colors duration-500 ${
              theme === 'dark' ? 'text-white/85' : 'text-slate-700'
            }`}>Apply to become a teacher on SkillWise</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${
                    currentStep >= step.number 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : theme === 'dark' 
                        ? 'border-white/20 text-white/50' 
                        : 'border-slate-300 text-slate-500'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-16 mx-2 transition-colors duration-300 ${
                      currentStep > step.number 
                        ? 'bg-emerald-600' 
                        : theme === 'dark' ? 'bg-white/20' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className={`text-xl font-semibold transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                Step {currentStep}: {steps[currentStep - 1].title}
              </h2>
            </div>
          </div>

          {/* Form Content */}
          <div className={`rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-8 transition-all duration-500 ${
            theme === 'dark'
              ? 'border-white/15 bg-white/10 text-white'
              : 'border-slate-200/50 bg-white/90 text-slate-800'
          }`}>
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={getLabelClasses()}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.personalDetails.fullName}
                    onChange={(e) => handleInputChange('personalDetails', 'fullName', e.target.value)}
                    className={getInputClasses()}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.personalDetails.email}
                    onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)}
                    className={getInputClasses()}
                    disabled
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.personalDetails.phone}
                    onChange={(e) => handleInputChange('personalDetails', 'phone', e.target.value)}
                    className={getInputClasses()}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.personalDetails.dateOfBirth}
                    onChange={(e) => handleInputChange('personalDetails', 'dateOfBirth', e.target.value)}
                    className={getInputClasses()}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={getLabelClasses()}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.address.street}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'address', 'street', e.target.value)}
                      className={getInputClasses()}
                    />
                  </div>
                  <div>
                    <label className={getLabelClasses()}>
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.address.city}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'address', 'city', e.target.value)}
                      className={getInputClasses()}
                    />
                  </div>
                  <div>
                    <label className={getLabelClasses()}>
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.address.state}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'address', 'state', e.target.value)}
                      className={getInputClasses()}
                    />
                  </div>
                  <div>
                    <label className={getLabelClasses()}>
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.address.zipCode}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'address', 'zipCode', e.target.value)}
                      className={getInputClasses()}
                    />
                  </div>
                  <div>
                    <label className={getLabelClasses()}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.address.country}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'address', 'country', e.target.value)}
                      className={getInputClasses()}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Qualifications */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={getLabelClasses()}>
                    Highest Degree
                  </label>
                  <select
                    value={formData.qualifications.highestDegree}
                    onChange={(e) => handleInputChange('qualifications', 'highestDegree', e.target.value)}
                    className={getSelectClasses()}
                  >
                    <option value="">Select degree</option>
                    <option value="high-school">High School</option>
                    <option value="associate">Associate Degree</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="doctorate">Doctorate/PhD</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications.fieldOfStudy}
                    onChange={(e) => handleInputChange('qualifications', 'fieldOfStudy', e.target.value)}
                    className={getInputClasses()}
                    placeholder="e.g., Computer Science, Mathematics, Education"
                  />
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    University/Institution
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications.university}
                    onChange={(e) => handleInputChange('qualifications', 'university', e.target.value)}
                    className={getInputClasses()}
                  />
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={formData.qualifications.graduationYear}
                    onChange={(e) => handleInputChange('qualifications', 'graduationYear', parseInt(e.target.value))}
                    className={getInputClasses()}
                  />
                </div>
                <div>
                  <label className={getLabelClasses()}>
                    GPA (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    value={formData.qualifications.gpa}
                    onChange={(e) => handleInputChange('qualifications', 'gpa', parseFloat(e.target.value))}
                    className={getInputClasses()}
                    placeholder="e.g., 3.75"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Experience */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className={getLabelClasses()}>
                  Years of Overall Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience.yearsOfExperience}
                  onChange={(e) => handleInputChange('experience', 'yearsOfExperience', parseInt(e.target.value))}
                  className={getInputClasses()}
                />
              </div>
              
              <div>
                <label className={getLabelClasses()}>
                  Teaching Experience Description
                </label>
                <textarea
                  value={formData.experience.teachingExperience}
                  onChange={(e) => handleInputChange('experience', 'teachingExperience', e.target.value)}
                  className={`${getInputClasses()} h-32`}
                  placeholder="Describe your teaching experience, including any formal or informal teaching roles..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Previous Positions</h3>
                  <button
                    type="button"
                    onClick={addPreviousPosition}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                  >
                    <Plus className="w-4 h-4" />
                    Add Position
                  </button>
                </div>
                
                {formData.experience.previousPositions.map((position, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Position {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removePreviousPosition(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={getLabelClasses()}>
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={position.title}
                          onChange={(e) => updatePreviousPosition(index, 'title', e.target.value)}
                          className={getInputClasses()}
                        />
                      </div>
                      <div>
                        <label className={getLabelClasses()}>
                          Institution
                        </label>
                        <input
                          type="text"
                          value={position.institution}
                          onChange={(e) => updatePreviousPosition(index, 'institution', e.target.value)}
                          className={getInputClasses()}
                        />
                      </div>
                      <div>
                        <label className={getLabelClasses()}>
                          Duration
                        </label>
                        <input
                          type="text"
                          value={position.duration}
                          onChange={(e) => updatePreviousPosition(index, 'duration', e.target.value)}
                          className={getInputClasses()}
                          placeholder="e.g., Jan 2020 - Dec 2022"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={getLabelClasses()}>
                          Description
                        </label>
                        <textarea
                          value={position.description}
                          onChange={(e) => updatePreviousPosition(index, 'description', e.target.value)}
                          className={getInputClasses()}
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Specializations */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Subject Specializations</h3>
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              </div>
              
              {formData.specializations.length === 0 && (
                <div className="text-center py-8 text-foreground/60">
                  <BookOpen className="w-12 h-12 mx-auto mb-4" />
                  <p>Add at least one subject specialization</p>
                </div>
              )}
              
              {formData.specializations.map((spec, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Subject {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSpecialization(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={getLabelClasses()}>
                        Subject
                      </label>
                      <input
                        type="text"
                        value={spec.subject}
                        onChange={(e) => updateSpecialization(index, 'subject', e.target.value)}
                        className={getInputClasses()}
                        placeholder="e.g., Mathematics, Physics, Programming"
                      />
                    </div>
                    <div>
                      <label className={getLabelClasses()}>
                        Proficiency Level
                      </label>
                      <select
                        value={spec.proficiencyLevel}
                        onChange={(e) => updateSpecialization(index, 'proficiencyLevel', e.target.value)}
                        className={getSelectClasses()}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className={getLabelClasses()}>
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={spec.yearsOfExperience}
                        onChange={(e) => updateSpecialization(index, 'yearsOfExperience', parseInt(e.target.value))}
                        className={getInputClasses()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Motivation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <label className={getLabelClasses()}>
                  Why do you want to teach?
                </label>
                <textarea
                  value={formData.motivation.whyTeach}
                  onChange={(e) => handleInputChange('motivation', 'whyTeach', e.target.value)}
                  className={`${getInputClasses()} h-32`}
                  placeholder="Share your passion for teaching and what motivates you..."
                  maxLength="1000"
                />
                <div className="text-right text-sm text-foreground/60 mt-1">
                  {formData.motivation.whyTeach.length}/1000
                </div>
              </div>
              
              <div>
                <label className={getLabelClasses()}>
                  What are your teaching goals?
                </label>
                <textarea
                  value={formData.motivation.goals}
                  onChange={(e) => handleInputChange('motivation', 'goals', e.target.value)}
                  className={`${getInputClasses()} h-32`}
                  placeholder="Describe what you hope to achieve as a teacher..."
                  maxLength="1000"
                />
                <div className="text-right text-sm text-foreground/60 mt-1">
                  {formData.motivation.goals.length}/1000
                </div>
              </div>
              
              <div>
                <label className={getLabelClasses()}>
                  How will you contribute to SkillWise?
                </label>
                <textarea
                  value={formData.motivation.contribution}
                  onChange={(e) => handleInputChange('motivation', 'contribution', e.target.value)}
                  className={`${getInputClasses()} h-32`}
                  placeholder="Explain how you plan to contribute to our learning community..."
                  maxLength="1000"
                />
                <div className="text-right text-sm text-foreground/60 mt-1">
                  {formData.motivation.contribution.length}/1000
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Documents */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume Upload */}
                <div>
                  <label className={getLabelClasses()}>
                    Resume/CV
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <FileText className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange('resume', e)}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <div className="text-sm text-foreground/60 mb-2">
                        {files.resume ? files.resume.name : 'Click to upload resume'}
                      </div>
                      <div className="text-xs text-foreground/40">
                        PDF, DOC, DOCX (max 10MB)
                      </div>
                    </label>
                  </div>
                </div>

                {/* Identity Document Upload */}
                <div>
                  <label className={getLabelClasses()}>
                    Identity Document
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <CreditCard className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('identityDocument', e)}
                      className="hidden"
                      id="identity-upload"
                    />
                    <label htmlFor="identity-upload" className="cursor-pointer">
                      <div className="text-sm text-foreground/60 mb-2">
                        {files.identityDocument ? files.identityDocument.name : 'Click to upload ID'}
                      </div>
                      <div className="text-xs text-foreground/40">
                        PDF, JPG, PNG (max 10MB)
                      </div>
                    </label>
                  </div>
                </div>

                {/* Certificates Upload */}
                <div className="md:col-span-2">
                  <label className={getLabelClasses()}>
                    Certificates (Optional)
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Award className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleCertificatesChange}
                      className="hidden"
                      id="certificates-upload"
                    />
                    <label htmlFor="certificates-upload" className="cursor-pointer">
                      <div className="text-sm text-foreground/60 mb-2">
                        {files.certificates.length > 0 
                          ? `${files.certificates.length} certificate(s) selected` 
                          : 'Click to upload certificates'
                        }
                      </div>
                      <div className="text-xs text-foreground/40">
                        PDF, JPG, PNG (max 10MB each, up to 5 files)
                      </div>
                    </label>
                  </div>
                  {files.certificates.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Selected Certificates:</h4>
                      <ul className="text-sm text-foreground/70">
                        {files.certificates.map((file, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Links */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Portfolio Links (Optional)</h3>
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                  >
                    <Plus className="w-4 h-4" />
                    Add Link
                  </button>
                </div>
                
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Link {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removePortfolioLink(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={getLabelClasses()}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updatePortfolioLink(index, 'title', e.target.value)}
                          className={getInputClasses()}
                          placeholder="e.g., My Teaching Portfolio"
                        />
                      </div>
                      <div>
                        <label className={getLabelClasses()}>
                          URL
                        </label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updatePortfolioLink(index, 'url', e.target.value)}
                          className={getInputClasses()}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={getLabelClasses()}>
                          Description
                        </label>
                        <textarea
                          value={link.description}
                          onChange={(e) => updatePortfolioLink(index, 'description', e.target.value)}
                          className={getInputClasses()}
                          rows="2"
                          placeholder="Brief description of this portfolio item..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`${getButtonClasses('secondary')} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Previous
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className={getButtonClasses()}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`${getButtonClasses()} disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </button>
          )}
        </div>
        </div>
      </div>
    </section>
  );
};

export default TeacherApplicationForm;
