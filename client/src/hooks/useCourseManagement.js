import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../services/courseService';

const CODE5 = /^\d{5}$/;

export function useCourseManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [lectures, setLectures] = useState([]);
  const [courseCode, setCourseCode] = useState('');
  const [teacherExams, setTeacherExams] = useState([]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showExamCreationModal, setShowExamCreationModal] = useState(false);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    timeLimit: 60,
    passingScore: 60,
    maxAttempts: 1,
    shuffleQuestions: true,
    randomizeOptions: true,
    questions: []
  });

  const invalidCourseCode = useMemo(() => !CODE5.test(courseCode), [courseCode]);

  // Tag management
  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setNewTag('');
  };

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  // Lecture management
  const addLecture = () =>
    setLectures(prev => [
      ...prev,
      {
        _tmpId: crypto.randomUUID(),
        lectureCode: '',
        title: '',
        content: [],
        quiz: [],
        isLocked: true,
        isExam: false,
        timeLimit: '',
        shuffleQuestions: false,
        exam: null,
        examRequired: false,
        passingScore: 60,
        estimatedDuration: '',
        difficulty: 'beginner'
      },
    ]);

  const removeLecture = (id) => setLectures(prev => prev.filter(l => l._tmpId !== id));

  const patchLecture = (id, patch) =>
    setLectures(prev => prev.map(l => (l._tmpId === id ? { ...l, ...patch } : l)));

  // Content management
  const addContent = (lectureId, type) => {
    const newContent = {
      _tmpId: crypto.randomUUID(),
      type,
      title: '',
      url: '',
      videoType: type === 'video' ? 'youtube' : undefined,
      videoId: '',
      duration: '',
      pdfSize: '',
      pdfPages: ''
    };

    setLectures(prev => {
      const updatedLectures = prev.map(l => 
        l._tmpId === lectureId 
          ? { ...l, content: [...(l.content || []), newContent] }
          : l
      );
      
      if (currentLecture && currentLecture._tmpId === lectureId) {
        const updatedLecture = updatedLectures.find(l => l._tmpId === lectureId);
        setCurrentLecture(updatedLecture);
      }
      
      return updatedLectures;
    });
  };

  const removeContent = (lectureId, contentId) => {
    setLectures(prev => {
      const updatedLectures = prev.map(l => 
        l._tmpId === lectureId 
          ? { ...l, content: l.content.filter(c => c._tmpId !== contentId) }
          : l
      );
      
      if (currentLecture && currentLecture._tmpId === lectureId) {
        const updatedLecture = updatedLectures.find(l => l._tmpId === lectureId);
        setCurrentLecture(updatedLecture);
      }
      
      return updatedLectures;
    });
  };

  const updateContent = (lectureId, contentId, field, value) => {
    setLectures(prev => {
      const updatedLectures = prev.map(l => 
        l._tmpId === lectureId 
          ? {
              ...l,
              content: l.content.map(c => 
                c._tmpId === contentId 
                  ? { ...c, [field]: value }
                  : c
              )
            }
          : l
      );
    
      if (currentLecture && currentLecture._tmpId === lectureId) {
        const updatedLecture = updatedLectures.find(l => l._tmpId === lectureId);
        setCurrentLecture(updatedLecture);
      }
      
      return updatedLectures;
    });
  };

  // Exam management
  const assignExam = (lectureId, examIdOrData, passingScore = 60) => {
    setLectures(prev => prev.map(l => 
      l._tmpId === lectureId 
        ? { 
            ...l, 
            exam: examIdOrData, 
            examRequired: true, 
            passingScore: parseInt(passingScore) || 60 
          }
        : l
    ));
  };

  const removeExam = (lectureId) => {
    setLectures(prev => prev.map(l => 
      l._tmpId === lectureId 
        ? { 
            ...l, 
            exam: null, 
            examRequired: false, 
            passingScore: 60 
          }
        : l
    ));
  };

  // Exam creation functions
  const addQuestion = () => {
    setExamData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        questionText: '',
        type: 'mcq',
        options: [
          { text: '', isCorrect: true, id: Date.now() + Math.random() },
          { text: '', isCorrect: false, id: Date.now() + Math.random() + 1 }
        ],
        points: 1,
        explanation: '',
        difficulty: 'medium'
      }]
    }));
  };

  const removeQuestion = (index) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index, field, value) => {
    setExamData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (questionIndex) => {
    setExamData(prev => {
      const newQuestions = [...prev.questions];
      const question = { ...newQuestions[questionIndex] };
      question.options = [...(question.options || []), {
        text: '',
        isCorrect: false,
        id: Date.now() + Math.random()
      }];
      newQuestions[questionIndex] = question;
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setExamData(prev => {
      const newQuestions = [...prev.questions];
      const question = { ...newQuestions[questionIndex] };
      question.options = question.options.filter((_, oi) => oi !== optionIndex);
      newQuestions[questionIndex] = question;
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    setExamData(prev => {
      const newQuestions = [...prev.questions];
      const question = { ...newQuestions[questionIndex] };
      const options = [...question.options];
      options[optionIndex] = { ...options[optionIndex], [field]: value };
      question.options = options;
      newQuestions[questionIndex] = question;
      return { ...prev, questions: newQuestions };
    });
  };

  const createExamForLecture = () => {
    if (!currentLecture) return;
    
    if (!examData.title.trim()) {
      alert('Exam title is required');
      return;
    }
    
    if (examData.questions.length === 0) {
      alert('At least one question is required');
      return;
    }

    // Validate questions
    for (let i = 0; i < examData.questions.length; i++) {
      const question = examData.questions[i];
      if (!question.questionText.trim()) {
        alert(`Question ${i + 1} text is required`);
        return;
      }
      if (question.type === 'mcq') {
        if (question.options.length < 2) {
          alert(`Question ${i + 1} must have at least 2 options`);
          return;
        }
        const hasCorrectOption = question.options.some(option => option.isCorrect);
        if (!hasCorrectOption) {
          alert(`Question ${i + 1} must have at least one correct answer marked`);
          return;
        }
        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].text.trim()) {
            alert(`Question ${i + 1}, Option ${j + 1} text is required`);
            return;
          }
        }
      }
      if (question.type === 'short_answer' && !question.correctAnswer?.trim()) {
        alert(`Question ${i + 1} must have a correct answer`);
        return;
      }
    }

    assignExam(currentLecture._tmpId, examData, examData.passingScore);
    
    setExamData({
      title: '',
      description: '',
      timeLimit: 60,
      passingScore: 60,
      maxAttempts: 1,
      shuffleQuestions: true,
      randomizeOptions: true,
      questions: []
    });
    
    setShowExamCreationModal(false);
    alert('Exam added to lecture successfully! It will be created when you submit the course.');
  };

  const hasBadLectureCodes = () => {
    const seen = new Set();
    for (const l of lectures) {
      if (!CODE5.test(l.lectureCode)) return true;
      if (seen.has(l.lectureCode)) return true;
      seen.add(l.lectureCode);
    }
    return false;
  };

  // Form submission
  const onSubmit = async (form, token) => {
    try {
      setLoading(true);
      setError('');

      if (invalidCourseCode) throw new Error('Course code must be exactly 5 digits.');
      if (lectures.length && hasBadLectureCodes()) {
        throw new Error('Every lecture needs a unique 5-digit code.');
      }

      // Validate lectures
      for (const lecture of lectures) {
        if (!lecture.title?.trim()) {
          throw new Error(`Lecture ${lecture.lectureCode || 'without code'} is missing a title.`);
        }
        if (!lecture.lectureCode?.trim()) {
          throw new Error(`Lecture "${lecture.title}" is missing a lecture code.`);
        }
        if (lecture.content && lecture.content.length > 0) {
          for (const content of lecture.content) {
            if (!content.title?.trim()) {
              throw new Error(`Lecture "${lecture.title}" has content without a title.`);
            }
            if (!content.url?.trim()) {
              throw new Error(`Lecture "${lecture.title}" has content without a URL.`);
            }
          }
        }
      }

      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price) || 0,
        tags,
        courseCode,
        lectures: lectures.map(l => ({
          lectureCode: l.lectureCode,
          title: l.title,
          content: (l.content || []).map(c => ({
            type: c.type,
            title: c.title,
            url: c.url,
            videoType: c.videoType,
            videoId: c.videoId,
            duration: c.duration ? Number(c.duration) : undefined,
            pdfSize: c.pdfSize ? Number(c.pdfSize) : undefined,
            pdfPages: c.pdfPages ? Number(c.pdfPages) : undefined
          })),
          quiz: l.quiz || [],
          isLocked: !!l.isLocked,
          isExam: !!l.isExam,
          timeLimit: l.timeLimit ? Number(l.timeLimit) : undefined,
          shuffleQuestions: !!l.shuffleQuestions,
          exam: null, // Don't send exam object here, it will be created separately
          examRequired: !!l.examRequired,
          passingScore: l.passingScore ? Number(l.passingScore) : 60,
          estimatedDuration: l.estimatedDuration ? Number(l.estimatedDuration) : undefined,
          difficulty: l.difficulty || 'beginner'
        })),
        examData: lectures
          .filter(l => l.exam && typeof l.exam === 'object' && l.exam.questions)
          .map(l => ({
            lectureIndex: lectures.indexOf(l),
            examData: l.exam
          }))
      };

      console.log('Frontend payload being sent:', JSON.stringify(payload, null, 2));

      const authToken =
        token ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken');

      const res = await createCourse(payload, authToken);
      const created = res.course || res.data?.course || res.data || res;
      navigate(`/courses/${created?._id || ''}`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Server error while creating course');
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    error,
    tags,
    newTag,
    lectures,
    courseCode,
    teacherExams,
    showContentModal,
    currentLecture,
    showExamModal,
    showExamCreationModal,
    examData,
    invalidCourseCode,

    // Setters
    setTags,
    setNewTag,
    setLectures,
    setCourseCode,
    setTeacherExams,
    setShowContentModal,
    setCurrentLecture,
    setShowExamModal,
    setShowExamCreationModal,
    setExamData,

    // Functions
    addTag,
    removeTag,
    addLecture,
    removeLecture,
    patchLecture,
    addContent,
    removeContent,
    updateContent,
    assignExam,
    removeExam,
    addQuestion,
    removeQuestion,
    updateQuestion,
    addOption,
    removeOption,
    updateOption,
    createExamForLecture,
    onSubmit
  };
}
