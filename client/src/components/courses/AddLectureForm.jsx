import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Save, ArrowLeft, BookOpen, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, updateCourse } from '../../services/courseService';
import examService from '../../services/examService';
import toast from 'react-hot-toast';
import { useCourseManagement } from '../../hooks/useCourseManagement';
import ContentManagementModal from './ContentManagementModal';
import ExamAssignmentModal from './ExamAssignmentModal';
import ExamCreationModal from './ExamCreationModal';

export default function AddLectureForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const methods = useForm();
  const courseManagement = useCourseManagement();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    lectures,
    teacherExams,
    showContentModal,
    currentLecture,
    showExamModal,
    showExamCreationModal,
    examData,
    setLectures,
    setTeacherExams,
    setShowContentModal,
    setCurrentLecture,
    setShowExamModal,
    setShowExamCreationModal,
    setExamData,
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
    createExamForLecture
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
        
        // Set existing lectures
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
  }, [id, user, setLectures]);

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
          <p className="text-foreground/60">Only teachers/admins can add lectures.</p>
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
      setSaving(true);
      
      // Prepare the update payload with new lectures
      const updatedLectures = lectures.map(l => ({
        _id: l._id, // Keep existing ID for updates
        lectureCode: l.lectureCode,
        title: l.title,
        content: (l.content || []).map(c => ({
          _id: c._id, // Keep existing ID for updates
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
        exam: (l.exam && l.exam._id) ? l.exam._id : null, // Preserve existing exam ObjectIds
        examRequired: !!l.examRequired,
        passingScore: l.passingScore ? Number(l.passingScore) : 60,
        estimatedDuration: l.estimatedDuration ? Number(l.estimatedDuration) : undefined,
        difficulty: l.difficulty || 'beginner'
      }));

      const payload = {
        title: course.title,
        description: course.description,
        price: course.price || 0,
        tags: course.tags || [],
        courseCode: course.courseCode,
        lectures: updatedLectures,
        examData: lectures
          .filter(l => l.exam && typeof l.exam === 'object' && l.exam.questions && !l.exam._id)
          .map(l => ({
            lectureIndex: lectures.indexOf(l),
            examData: l.exam
          }))
      };

      console.log('Updating course with new lectures:', JSON.stringify(payload, null, 2));

      const authToken = token || localStorage.getItem('token');
      await updateCourse(id, payload, authToken);
      
      toast.success('Lecture added successfully!');
      navigate(`/courses/${id}`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Server error while adding lecture');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Add Lecture</h1>
              <p className="text-foreground/60 mt-1">Course: {course.title}</p>
            </div>
            <button
              onClick={() => navigate(`/courses/${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </button>
          </div>

          <div className="max-w-5xl mx-auto">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Current Lectures */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Lectures ({lectures.length})</h2>
              {lectures.length > 0 ? (
                <div className="space-y-3">
                  {lectures.map((lecture, index) => (
                    <div key={lecture._tmpId} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div>
                        <h3 className="font-medium">{lecture.title || `Lecture ${index + 1}`}</h3>
                        <p className="text-sm text-foreground/60">
                          Code: {lecture.lectureCode} • {lecture.content?.length || 0} items
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentLecture(lecture);
                            setShowContentModal(true);
                          }}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                        >
                          Manage Content
                        </button>
                        <button
                          onClick={() => removeLecture(lecture._tmpId)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/60">No lectures yet.</p>
              )}
            </div>

            {/* Add New Lecture */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add New Lecture</h2>
                <button
                  onClick={addLecture}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Lecture
                </button>
              </div>

              {lectures.length > 0 && (
                <div className="space-y-4">
                  {lectures.map((lecture, index) => (
                    <div key={lecture._tmpId} className="p-4 bg-background rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm mb-2">Lecture Title *</label>
                          <input
                            value={lecture.title}
                            onChange={(e) => patchLecture(lecture._tmpId, { title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                            placeholder="Enter lecture title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-2">Lecture Code (5 digits) *</label>
                          <input
                            value={lecture.lectureCode}
                            onChange={(e) => patchLecture(lecture._tmpId, { lectureCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                            placeholder="00001"
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm mb-2">Difficulty</label>
                          <select
                            value={lecture.difficulty || 'beginner'}
                            onChange={(e) => patchLecture(lecture._tmpId, { difficulty: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-2">Estimated Duration (min)</label>
                          <input
                            type="number"
                            min="0"
                            value={lecture.estimatedDuration ?? ''}
                            onChange={(e) => patchLecture(lecture._tmpId, { estimatedDuration: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-2">Passing Score (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={lecture.passingScore || 60}
                            onChange={(e) => patchLecture(lecture._tmpId, { passingScore: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lecture.isLocked}
                            onChange={(e) => patchLecture(lecture._tmpId, { isLocked: e.target.checked })}
                          />
                          <span className="text-sm">Locked</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lecture.examRequired}
                            onChange={(e) => patchLecture(lecture._tmpId, { examRequired: e.target.checked })}
                          />
                          <span className="text-sm">Require Exam</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/courses/${id}`)}
                className="px-6 py-3 bg-background border border-border rounded-lg hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Lectures
                  </>
                )}
              </button>
            </div>
          </div>
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
    </FormProvider>
  );
}
