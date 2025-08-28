import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Save, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, updateCourse, updateLectureAutoQuiz } from '../../services/courseService';
import examService from '../../services/examService';
import { useCourseManagement } from '../../hooks/useCourseManagement';
import toast from 'react-hot-toast';
import BasicInformationSection from './BasicInformationSection';
import LecturesSection from './LecturesSection';
import ContentManagementModal from './ContentManagementModal';
import ExamAssignmentModal from './ExamAssignmentModal';
import ExamCreationModal from './ExamCreationModal';
import AutoQuizModal from './AutoQuizModal';

export default function EditCourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const methods = useForm();
  const courseManagement = useCourseManagement();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  const {
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
    onSubmit: handleSubmitForm
  } = courseManagement;

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const response = await getCourse(id);
        const courseData = response.course || response.data || response;
        
        if (!courseData) {
          setError('Course not found');
          return;
        }

        // Check if user is the course owner
        if (courseData.teacher?._id !== user?._id && user?.role !== 'Admin') {
          setError('You do not have permission to edit this course');
          return;
        }

        setCourse(courseData);
        
        // Populate form with existing data
        methods.reset({
          title: courseData.title,
          description: courseData.description,
          price: courseData.price || 0
        });

        // Set course management state
        setCourseCode(courseData.courseCode || '');
        setTags(courseData.tags || []);
        setLectures(courseData.lectures?.map(lecture => ({
          ...lecture,
          _tmpId: lecture._id || crypto.randomUUID(),
          content: lecture.content?.map(content => ({
            ...content,
            _tmpId: content._id || crypto.randomUUID()
          })) || []
        })) || []);

      } catch (err) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      loadCourse();
    }
  }, [id, user, methods, setCourseCode, setTags, setLectures]);

  // Fetch teacher exams for assignment
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await examService.getTeacherExams();
        if (response.success) {
          setTeacherExams(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };
    
    if (token) {
      fetchExams();
    }
  }, [token, setTeacherExams]);

  // Gate: only Teacher/Admin
  if (user?.role !== 'Teacher' && user?.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Access Denied</h3>
          <p className="text-foreground/60">Only teachers/admins can edit courses.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-foreground/60">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Error</h3>
          <p className="text-foreground/60">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (form) => {
    try {
      // Prepare the update payload
      // Sanitize lectures/content to satisfy backend validation
      const sanitizedLectures = lectures.map(l => ({
        _id: l._id,
        lectureCode: l.lectureCode,
        title: (l.title || '').trim() || `Lecture ${l.lectureCode || ''}`.trim(),
        description: l.description || '',
        content: (l.content || []).map(c => {
          const type = c.type;
          const url = (c.url || '').trim();
          const title = (c.title || '').trim() || (type === 'video' ? 'Video' : type === 'pdf' ? 'Document' : 'Content');
          let videoType = c.videoType;
          let videoId = (c.videoId || '').trim();
          if (type === 'video' && (!videoId || videoId.length === 0)) {
            // Try to derive YouTube ID from URL if applicable
            if (url.includes('youtube.com/watch')) {
              const v = url.split('v=')[1]?.split('&')[0];
              if (v) videoId = v;
              videoType = videoType || 'youtube';
            } else if (url.includes('youtu.be/')) {
              const v = url.split('youtu.be/')[1]?.split('?')[0];
              if (v) videoId = v;
              videoType = videoType || 'youtube';
            }
          }
          return {
            _id: c._id,
            type,
            title,
            url,
            videoType,
            videoId,
            duration: c.duration ? Number(c.duration) : undefined,
            pdfSize: c.pdfSize ? Number(c.pdfSize) : undefined,
            pdfPages: c.pdfPages ? Number(c.pdfPages) : undefined
          };
        }),
        quiz: l.quiz || [],
        isLocked: !!l.isLocked,
        isExam: !!l.isExam,
        timeLimit: l.timeLimit ? Number(l.timeLimit) : undefined,
        shuffleQuestions: !!l.shuffleQuestions,
        exam: l.exam || null,
        examRequired: !!l.examRequired,
        passingScore: l.passingScore ? Number(l.passingScore) : 60,
        estimatedDuration: l.estimatedDuration ? Number(l.estimatedDuration) : undefined,
        difficulty: l.difficulty || 'beginner',
        autoQuizEnabled: l.autoQuizEnabled !== false,
        autoQuiz: (l.autoQuiz || []).map(q => ({
          question: q.question,
          type: q.type || 'mcq',
          options: q.type === 'mcq' ? (q.options || []) : [],
          correctAnswer: q.correctAnswer,
          points: q.points ? Number(q.points) : 1
        }))
      }));

      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price) || 0,
        tags,
        courseCode,
        lectures: sanitizedLectures,
        examData: lectures
          .filter(l => l.exam && typeof l.exam === 'object' && l.exam.questions)
          .map(l => ({
            lectureIndex: lectures.indexOf(l),
            examData: l.exam
          }))
      };

      console.log('Updating course with payload:', JSON.stringify(payload, null, 2));

      const authToken = token || localStorage.getItem('token');
      await updateCourse(id, payload, authToken);
      
      toast.success('Course updated successfully!');
      navigate(`/courses/${id}`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Server error while updating course');
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Edit Course</h1>
            <button
              onClick={() => navigate(`/courses/${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </button>
          </div>

          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg">
                {error}
              </div>
            )}

            <BasicInformationSection
              courseCode={courseCode}
              setCourseCode={setCourseCode}
              invalidCourseCode={invalidCourseCode}
              tags={tags}
              newTag={newTag}
              setNewTag={setNewTag}
              addTag={addTag}
              removeTag={removeTag}
            />

            <LecturesSection
              lectures={lectures}
              addLecture={addLecture}
              removeLecture={removeLecture}
              patchLecture={patchLecture}
              setCurrentLecture={setCurrentLecture}
              setShowContentModal={setShowContentModal}
              setShowExamModal={setShowExamModal}
              setShowExamCreationModal={setShowExamCreationModal}
              setExamData={setExamData}
              setShowAutoQuizModal={courseManagement.setShowAutoQuizModal}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/courses/${id}`)}
                className="px-6 py-3 bg-background border border-border rounded-lg hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                disabled={courseManagement.loading}
              >
                {courseManagement.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ContentManagementModal
        showContentModal={showContentModal}
        currentLecture={currentLecture}
        setShowContentModal={setShowContentModal}
        addContent={addContent}
        removeContent={removeContent}
        updateContent={updateContent}
      />

      <ExamAssignmentModal
        showExamModal={showExamModal}
        currentLecture={currentLecture}
        setShowExamModal={setShowExamModal}
        teacherExams={teacherExams}
        lectures={lectures}
        assignExam={assignExam}
        removeExam={removeExam}
        patchLecture={patchLecture}
        setShowExamCreationModal={setShowExamCreationModal}
        navigate={courseManagement.navigate}
      />

      <ExamCreationModal
        showExamCreationModal={showExamCreationModal}
        currentLecture={currentLecture}
        setShowExamCreationModal={setShowExamCreationModal}
        examData={examData}
        setExamData={setExamData}
        addQuestion={addQuestion}
        removeQuestion={removeQuestion}
        updateQuestion={updateQuestion}
        addOption={addOption}
        removeOption={removeOption}
        updateOption={updateOption}
        createExamForLecture={createExamForLecture}
      />

      {/* Auto Quiz Modal */}
      <AutoQuizModal
        isOpen={courseManagement.showAutoQuizModal}
        lecture={currentLecture}
        onClose={() => courseManagement.setShowAutoQuizModal(false)}
        onChange={(qs) => {
          if (!currentLecture) return;
          courseManagement.updateAutoQuiz(currentLecture._tmpId, qs);
        }}
        onSave={async () => {
          try {
            if (!currentLecture) return;
            const idx = lectures.findIndex(l => l._tmpId === currentLecture._tmpId);
            if (idx === -1) return;
            const payload = {
              autoQuizEnabled: currentLecture.autoQuizEnabled !== false,
              autoQuiz: (currentLecture.autoQuiz || []).map(q => ({
                question: q.question,
                type: q.type || 'mcq',
                options: q.type === 'short' ? [] : (q.options || []),
                correctAnswer: q.correctAnswer,
                points: q.points || 1
              }))
            };
            const authToken = token || localStorage.getItem('token');
            const res = await updateLectureAutoQuiz(id, idx, payload, authToken);
            toast.success('Auto quiz saved');
          } catch (e) {
            const msg = e?.response?.data?.error || e.message || 'Failed to save auto quiz';
            toast.error(msg.includes('min_5') ? 'Add at least 5 questions before saving' : msg);
          } finally {
            courseManagement.setShowAutoQuizModal(false);
          }
        }}
      />
    </FormProvider>
  );
}
