import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, Save, BookOpen, GripVertical,
  Clock, Users, Target, Shuffle, Eye, EyeOff, AlertTriangle,
  CheckCircle, XCircle, HelpCircle, Settings, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import examService from '../../services/examService';
import { getTeacherCourses } from '../../services/courseService';
import { useAuth } from '../../contexts/AuthContext';

const CreateExamForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  
  const [examData, setExamData] = useState({
    courseId: courseId || '',
    title: '',
    description: '',
    timeLimit: 60,
    passingScore: 60,
    maxAttempts: 1,
    shuffleQuestions: true,
    randomizeOptions: true,
    questionsPerAttempt: null,
    availableFrom: '',
    availableUntil: '',
    antiCheat: {
      blockCopyPaste: true,
      blockTabSwitching: true,
      blockRightClick: true,
      fullScreenRequired: false,
      webcamRequired: false
    },
    questions: []
  });

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  // Calculate total points and estimated time
  useEffect(() => {
    const points = examData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    setTotalPoints(points);

    // Estimate time: MCQ = 1min, Short = 2min, Essay = 5min per question
    const time = examData.questions.reduce((sum, q) => {
      switch (q.type) {
        case 'mcq': return sum + 1;
        case 'short_answer': return sum + 2;
        case 'essay': return sum + 5;
        default: return sum + 1;
      }
    }, 0);
    setEstimatedTime(time);
  }, [examData.questions]);

  // Real-time validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (!examData.title.trim()) {
      errors.title = 'Title is required';
    } else if (examData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (examData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    if (!examData.courseId) errors.courseId = 'Course is required';

    if (examData.timeLimit < 5) errors.timeLimit = 'Minimum time limit is 5 minutes';
    if (examData.timeLimit > 300) errors.timeLimit = 'Maximum time limit is 300 minutes';

    if (examData.passingScore < 0 || examData.passingScore > 100) {
      errors.passingScore = 'Passing score must be between 0 and 100';
    }

    if (examData.questions.length === 0) {
      errors.questions = 'At least one question is required';
    }

    examData.questions.forEach((q, index) => {
      if (!q.questionText.trim()) {
        errors[`question_${index}_text`] = `Question ${index + 1} text is required`;
      }
      if (!q.points || q.points < 0) {
        errors[`question_${index}_points`] = `Question ${index + 1} must have positive points`;
      }
      if (q.type === 'mcq') {
        if (!q.options || q.options.length < 2) {
          errors[`question_${index}_options`] = `Question ${index + 1} needs at least 2 options`;
        }
        const hasCorrect = q.options?.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          errors[`question_${index}_correct`] = `Question ${index + 1} needs a correct answer`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [examData]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const fetchTeacherCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await getTeacherCourses(token);
      if (response.ok && response.courses) {
        setCourses(response.courses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to fetch courses');
      setCourses([]);
    }
  };

  const addQuestion = () => {
    const questionId = Date.now();
    const newQuestion = {
      id: questionId,
      questionText: '',
      type: 'mcq',
      options: [
        { text: '', isCorrect: false, id: questionId + 1 },
        { text: '', isCorrect: false, id: questionId + 2 }
      ],
      correctAnswer: '',
      maxWords: 100,
      points: 1,
      explanation: '',
      difficulty: 'medium'
    };

    setExamData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Auto-scroll to new question
    setTimeout(() => {
      const element = document.getElementById(`question-${newQuestion.id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Drag and drop functions
  const handleDragStart = (e, index) => {
    setDraggedQuestion(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedQuestion === null) return;

    const newQuestions = [...examData.questions];
    const draggedItem = newQuestions[draggedQuestion];

    // Remove dragged item
    newQuestions.splice(draggedQuestion, 1);

    // Insert at new position
    newQuestions.splice(dropIndex, 0, draggedItem);

    setExamData(prev => ({ ...prev, questions: newQuestions }));
    setDraggedQuestion(null);
  };

  const removeQuestion = (index) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = useCallback((index, field, value) => {
    setExamData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return {
        ...prev,
        questions: newQuestions
      };
    });
  }, []);

  const addOption = (questionIndex) => {
    setExamData(prev => {
      const newQuestions = prev.questions.map((q, i) => {
        if (i === questionIndex) {
          const newOption = {
            text: '',
            isCorrect: false,
            id: Date.now() + Math.random() // Add unique ID for better key handling
          };
          return {
            ...q,
            options: [...(q.options || []), newOption]
          };
        }
        return q;
      });

      return {
        ...prev,
        questions: newQuestions
      };
    });
  };

  const removeOption = useCallback((questionIndex, optionIndex) => {
    setExamData(prev => {
      const newQuestions = [...prev.questions];
      const question = { ...newQuestions[questionIndex] };
      question.options = question.options.filter((_, oi) => oi !== optionIndex);
      newQuestions[questionIndex] = question;
      return {
        ...prev,
        questions: newQuestions
      };
    });
  }, []);

  const updateOption = useCallback((questionIndex, optionIndex, field, value) => {
    setExamData(prev => {
      // Create a deep copy to avoid mutation
      const newQuestions = [...prev.questions];
      const question = { ...newQuestions[questionIndex] };
      const options = [...question.options];
      options[optionIndex] = { ...options[optionIndex], [field]: value };
      question.options = options;
      newQuestions[questionIndex] = question;

      return {
        ...prev,
        questions: newQuestions
      };
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!examData.courseId) {
      toast.error('Please select a course');
      return;
    }
    
    if (examData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate questions
    for (let i = 0; i < examData.questions.length; i++) {
      const question = examData.questions[i];
      
      if (!question.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      
      if (question.type === 'mcq') {
        if (question.options.length < 2) {
          toast.error(`Question ${i + 1} must have at least 2 options`);
          return;
        }
        
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
          toast.error(`Question ${i + 1} must have exactly one correct answer`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const response = await examService.createExam(examData);
      toast.success(response.message || 'Exam created successfully!');
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error('Create exam error:', error);

      // Handle validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.msg).join(', ');
        toast.error(`Validation Error: ${errorMessages}`);
      } else {
        toast.error(error.message || 'Failed to create exam');
      }
    } finally {
      setLoading(false);
    }
  };

  // Separate component for MCQ option to prevent re-render issues
  const MCQOption = React.memo(({ option, optionIndex, questionIndex, onUpdate, onRemove, canRemove }) => {
    const [localText, setLocalText] = useState(option.text || '');
    const inputRef = useRef(null);

    // Sync local state with prop when option changes from outside
    useEffect(() => {
      setLocalText(option.text || '');
    }, [option.text]);

    const handleTextChange = useCallback((e) => {
      const value = e.target.value;
      setLocalText(value); // Update local state immediately
      onUpdate(questionIndex, optionIndex, 'text', value); // Update parent state
    }, [questionIndex, optionIndex, onUpdate]);

    const handleCorrectChange = useCallback(() => {
      onUpdate(questionIndex, optionIndex, 'isCorrect', true);
    }, [questionIndex, optionIndex, onUpdate]);

    return (
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
          option.isCorrect
            ? 'bg-green-50 border-green-200'
            : 'bg-muted border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-center">
          <input
            type="radio"
            name={`question-${questionIndex}-correct`}
            checked={Boolean(option.isCorrect)}
            onChange={handleCorrectChange}
            className="text-primary focus:ring-primary"
          />
          <label
            className={`ml-2 text-xs font-medium cursor-pointer ${
              option.isCorrect ? 'text-green-600' : 'text-foreground/60'
            }`}
            onClick={handleCorrectChange}
          >
            {option.isCorrect ? '✓ Correct Answer' : 'Mark as Correct'}
          </label>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localText}
          onChange={handleTextChange}
          placeholder={`Enter option ${optionIndex + 1}...`}
          className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          autoComplete="off"
          spellCheck="false"
        />

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(questionIndex, optionIndex)}
            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
            title="Remove option"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  });

  const QuestionEditor = React.memo(({ question, index }) => (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Question {index + 1}</h3>
        <button
          type="button"
          onClick={() => removeQuestion(index)}
          className="text-red-600 hover:text-red-700 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Question Text</label>
          <textarea
            value={question.questionText}
            onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="Enter your question..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="mcq">Multiple Choice</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Points</label>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={question.difficulty}
              onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {question.type === 'mcq' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Answer Options</label>
              <button
                type="button"
                onClick={() => addOption(index)}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Option
              </button>
            </div>
            
            <div className="space-y-3">
              {question.options.map((option, optionIndex) => (
                <MCQOption
                  key={option.id || `${index}-option-${optionIndex}`}
                  option={option}
                  optionIndex={optionIndex}
                  questionIndex={index}
                  onUpdate={(qIndex, oIndex, field, value) => {
                    if (field === 'isCorrect' && value) {
                      // Set this option as correct and others as incorrect
                      const updatedOptions = question.options.map((opt, oi) => ({
                        ...opt,
                        isCorrect: oi === oIndex
                      }));
                      updateQuestion(qIndex, 'options', updatedOptions);
                    } else {
                      updateOption(qIndex, oIndex, field, value);
                    }
                  }}
                  onRemove={removeOption}
                  canRemove={question.options.length > 2}
                />
              ))}
            </div>

            {/* Validation message for MCQ */}
            {question.options && question.options.length > 0 && !question.options.some(opt => opt.isCorrect) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Please mark one option as the correct answer
              </div>
            )}
          </div>
        )}

        {question.type === 'short_answer' && (
          <div>
            <label className="block text-sm font-medium mb-2">Correct Answer (for auto-grading)</label>
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
              placeholder="Enter the correct answer..."
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {question.type === 'essay' && (
          <div>
            <label className="block text-sm font-medium mb-2">Maximum Words</label>
            <input
              type="number"
              min="50"
              value={question.maxWords}
              onChange={(e) => updateQuestion(index, 'maxWords', parseInt(e.target.value))}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Explanation (Optional)</label>
          <textarea
            value={question.explanation}
            onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
            className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows="2"
            placeholder="Explain the correct answer..."
          />
        </div>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to={`/courses/${courseId}`}
              className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course</span>
            </Link>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{examData.questions.length} Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-600" />
              <span>{totalPoints} Points</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>~{estimatedTime}min</span>
            </div>
          </div>
        </div>

        {/* Title and Course Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Exam</h1>
          <div className="flex items-center space-x-2 text-foreground/60">
            <BookOpen className="w-4 h-4" />
            <span>for {courses.find(c => c._id === examData.courseId)?.title || 'this course'}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {[
                { id: 'basic', label: 'Basic Info', icon: Settings },
                { id: 'questions', label: 'Questions', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Target },
                { id: 'preview', label: 'Preview', icon: Eye }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {id === 'questions' && examData.questions.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {examData.questions.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tab Content */}
          {activeTab === 'basic' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>

              {/* Course Info Banner */}
              <div className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {courses.find(c => c._id === examData.courseId)?.title || 'Loading course...'}
                    </p>
                    <p className="text-sm text-foreground/60">
                      Creating exam for this course
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Exam Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Exam Title *
                    <span className="text-xs text-foreground/60 ml-2">
                      ({examData.title.length}/200 characters, min 3)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={examData.title}
                    onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.title
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-border focus:ring-primary'
                    }`}
                    placeholder="e.g., JavaScript Fundamentals Quiz"
                    maxLength={200}
                    required
                  />
                  {validationErrors.title && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{validationErrors.title}</span>
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                    <span className="text-xs text-foreground/60 ml-2">(Optional)</span>
                  </label>
                  <textarea
                    value={examData.description}
                    onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows="4"
                    placeholder="Provide instructions or context for students taking this exam..."
                    maxLength={1000}
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    {examData.description.length}/1000 characters
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{examData.questions.length}</div>
                    <div className="text-xs text-foreground/60">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
                    <div className="text-xs text-foreground/60">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">~{estimatedTime}m</div>
                    <div className="text-xs text-foreground/60">Est. Time</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Questions</h2>
                  {examData.questions.length > 0 && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                      {examData.questions.length} question{examData.questions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-foreground/60">
                    Total: {totalPoints} points
                  </div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {examData.questions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <FileText className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No questions yet</h3>
                  <p className="text-foreground/60 mb-6">Start building your exam by adding your first question</p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Add Your First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {examData.questions.map((question, index) => (
                    <div
                      key={question.id || index}
                      id={`question-${question.id || index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`bg-background border border-border rounded-lg p-4 transition-all duration-200 ${
                        draggedQuestion === index
                          ? 'opacity-50 scale-95'
                          : 'hover:shadow-md hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2 mt-1">
                          <GripVertical className="w-4 h-4 text-foreground/40 cursor-grab" />
                          <span className="text-sm font-medium text-foreground/60">
                            Q{index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <QuestionEditor question={question} index={index} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Question Button at Bottom */}
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="bg-muted border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-foreground/60 hover:text-primary px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another Question</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Exam Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Time & Attempts */}
                <div className="space-y-6">
                  <h3 className="font-medium text-foreground flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Time & Attempts</span>
                  </h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">Time Limit (minutes) *</label>
                    <input
                      type="number"
                      value={examData.timeLimit}
                      onChange={(e) => setExamData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                      className={`w-full p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-colors ${
                        validationErrors.timeLimit
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border focus:ring-primary'
                      }`}
                      min="5"
                      max="300"
                      required
                    />
                    {validationErrors.timeLimit && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.timeLimit}</p>
                    )}
                    <p className="text-xs text-foreground/60 mt-1">
                      Recommended: {estimatedTime} minutes based on question types
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Maximum Attempts</label>
                    <select
                      value={examData.maxAttempts}
                      onChange={(e) => setExamData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={1}>1 attempt</option>
                      <option value={2}>2 attempts</option>
                      <option value={3}>3 attempts</option>
                      <option value={5}>5 attempts</option>
                      <option value={-1}>Unlimited</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
                    <input
                      type="number"
                      value={examData.passingScore}
                      onChange={(e) => setExamData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 0 }))}
                      className={`w-full p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-colors ${
                        validationErrors.passingScore
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border focus:ring-primary'
                      }`}
                      min="0"
                      max="100"
                    />
                    {validationErrors.passingScore && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.passingScore}</p>
                    )}
                  </div>
                </div>

                {/* Question Settings */}
                <div className="space-y-6">
                  <h3 className="font-medium text-foreground flex items-center space-x-2">
                    <Shuffle className="w-4 h-4" />
                    <span>Question Settings</span>
                  </h3>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={examData.shuffleQuestions}
                        onChange={(e) => setExamData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                        className="text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="font-medium">Shuffle Questions</span>
                        <p className="text-xs text-foreground/60">Randomize question order for each student</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={examData.randomizeOptions}
                        onChange={(e) => setExamData(prev => ({ ...prev, randomizeOptions: e.target.checked }))}
                        className="text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="font-medium">Randomize Options</span>
                        <p className="text-xs text-foreground/60">Shuffle multiple choice options</p>
                      </div>
                    </label>
                  </div>

                  {/* Anti-cheat Settings */}
                  <div>
                    <h4 className="font-medium text-foreground flex items-center space-x-2 mb-4">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Anti-cheat Measures</span>
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={examData.antiCheat.blockCopyPaste}
                          onChange={(e) => setExamData(prev => ({
                            ...prev,
                            antiCheat: { ...prev.antiCheat, blockCopyPaste: e.target.checked }
                          }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Block Copy/Paste</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={examData.antiCheat.blockTabSwitching}
                          onChange={(e) => setExamData(prev => ({
                            ...prev,
                            antiCheat: { ...prev.antiCheat, blockTabSwitching: e.target.checked }
                          }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Monitor Tab Switching</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={examData.antiCheat.blockRightClick}
                          onChange={(e) => setExamData(prev => ({
                            ...prev,
                            antiCheat: { ...prev.antiCheat, blockRightClick: e.target.checked }
                          }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Block Right Click</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={examData.antiCheat.fullScreenRequired}
                          onChange={(e) => setExamData(prev => ({
                            ...prev,
                            antiCheat: { ...prev.antiCheat, fullScreenRequired: e.target.checked }
                          }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Require Full Screen</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Eye className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Exam Preview</h2>
              </div>

              <div className="space-y-6">
                {/* Exam Header Preview */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                  <h1 className="text-2xl font-bold text-foreground mb-2">{examData.title || 'Untitled Exam'}</h1>
                  {examData.description && (
                    <p className="text-foreground/80 mb-4">{examData.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{examData.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>{examData.questions.length} questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span>{totalPoints} points</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{examData.passingScore}% to pass</span>
                    </div>
                  </div>
                </div>

                {/* Questions Preview */}
                {examData.questions.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Questions Preview</h3>
                    {examData.questions.map((question, index) => (
                      <div key={index} className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                              {question.points} pts
                            </span>
                            <span className="bg-secondary/10 text-secondary px-2 py-1 rounded capitalize">
                              {question.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <p className="text-foreground mb-3">{question.questionText || 'Question text not set'}</p>

                        {question.type === 'mcq' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded border ${
                                  option.isCorrect
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                {option.isCorrect && <CheckCircle className="w-4 h-4 inline mr-2" />}
                                {option.text || `Option ${optionIndex + 1}`}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'short_answer' && question.correctAnswer && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <span className="font-medium text-green-800">Expected Answer: </span>
                            <span className="text-green-700">{question.correctAnswer}</span>
                          </div>
                        )}

                        {question.type === 'essay' && (
                          <div className="text-sm text-foreground/60">
                            Maximum words: {question.maxWords}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/60">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No questions to preview yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Ready to Create?</h3>
                <p className="text-sm text-foreground/60">
                  {user?.role === 'Admin'
                    ? 'Your exam will be created and immediately available to students'
                    : 'Your exam will be created and submitted for admin review'
                  }
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {Object.keys(validationErrors).length > 0 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{Object.keys(validationErrors).length} error(s)</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Creating...'
                      : user?.role === 'Admin'
                        ? 'Create & Publish Exam'
                        : 'Create Exam'
                    }
                  </span>
                </button>
              </div>
            </div>

            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-2">Please fix the following errors:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {Object.entries(validationErrors).map(([key, error]) => (
                    <li key={key}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamForm;
