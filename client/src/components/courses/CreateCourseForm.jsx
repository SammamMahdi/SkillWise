import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Save, ArrowLeft, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import examService from '../../services/examService';
import { useCourseManagement } from '../../hooks/useCourseManagement';
import BasicInformationSection from './BasicInformationSection';
import LecturesSection from './LecturesSection';
import ContentManagementModal from './ContentManagementModal';
import ExamAssignmentModal from './ExamAssignmentModal';
import ExamCreationModal from './ExamCreationModal';

export default function CreateCourseForm() {
  const { user, token } = useAuth();
  const methods = useForm();
  const courseManagement = useCourseManagement();
  
  const {
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
          <p className="text-foreground/60">Only teachers/admins can create courses.</p>
        </div>
      </div>
    );
  }

  const onSubmit = (form) => {
    handleSubmitForm(form, token);
  };

  return (
    <FormProvider {...methods}>
    <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:text-left">
          <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground mx-auto sm:mx-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>
          <h1 className="text-3xl font-bold mt-3">Create New Course</h1>
            <p className="text-foreground/60 max-w-2xl mx-auto sm:mx-0">
              Share your knowledge and create an engaging learning experience.
            </p>
        </div>

        {!!error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
            {/* Basic Information Section */}
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

            {/* Lectures Section */}
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
            />

            {/* Submit Section */}
            <div className="flex justify-end gap-3">
                                                     <button
                             type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 rounded-lg bg-background border border-border"
              >
                Cancel
                          </button>
                                                     <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-50"
              >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Content Management Modal */}
        <ContentManagementModal
          showContentModal={showContentModal}
          currentLecture={currentLecture}
          setShowContentModal={setShowContentModal}
          addContent={addContent}
          removeContent={removeContent}
          updateContent={updateContent}
        />

      {/* Exam Assignment Modal */}
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
          navigate={window.history.back}
        />

       {/* Exam Creation Modal */}
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
               </div>
    </FormProvider>
   );
 }
