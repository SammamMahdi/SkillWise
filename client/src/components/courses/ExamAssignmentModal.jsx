import React from 'react';
import { X, FileText } from 'lucide-react';

export default function ExamAssignmentModal({ 
  showExamModal, 
  currentLecture, 
  setShowExamModal, 
  teacherExams, 
  lectures, 
  assignExam, 
  removeExam, 
  patchLecture,
  setShowExamCreationModal,
  navigate 
}) {
  if (!showExamModal || !currentLecture) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Assign Exam - {currentLecture.title}</h3>
          <button
            onClick={() => setShowExamModal(false)}
            className="text-foreground/60 hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {teacherExams.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Exams Available</h4>
            <p className="text-foreground/60 mb-4">You need to create exams first before assigning them to lectures.</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowExamModal(false);
                  setShowExamCreationModal(true);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Create New Exam
              </button>
              <button
                onClick={() => {
                  setShowExamModal(false);
                  navigate('/exams/create');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                Go to Exam Creator
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Exam</label>
              <select
                value={currentLecture.exam ? 
                  (typeof currentLecture.exam === 'string' ? currentLecture.exam : 
                   `custom-${lectures.findIndex(l => l.exam === currentLecture.exam)}`) : ''
                }
                onChange={(e) => {
                  if (e.target.value.startsWith('custom-')) {
                    const idx = parseInt(e.target.value.split('-')[1]);
                    const customExam = lectures[idx].exam;
                    assignExam(currentLecture._tmpId, customExam, customExam.passingScore);
                  } else if (e.target.value) {
                    assignExam(currentLecture._tmpId, e.target.value, 60);
                  } else {
                    removeExam(currentLecture._tmpId);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border"
              >
                <option value="">No exam assigned</option>
                {teacherExams.map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} ({exam.timeLimit}min, {exam.totalPoints}pts)
                  </option>
                ))}
                {/* Show custom exams created for this course */}
                {lectures
                  .filter(l => l.exam && typeof l.exam === 'object' && l.exam.questions)
                  .map((l, idx) => (
                    <option key={`custom-${idx}`} value={`custom-${idx}`}>
                      {l.exam.title} (Custom - {l.exam.questions.length} questions)
                    </option>
                  ))}
              </select>
            </div>

            {currentLecture.exam && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentLecture.passingScore || 60}
                  onChange={(e) => patchLecture(currentLecture._tmpId, { passingScore: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                />
              </div>
            )}

            {currentLecture.exam && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Exam Assigned</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Students must pass this exam to complete the lecture.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              {currentLecture.exam && (
                <button
                  onClick={() => removeExam(currentLecture._tmpId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove Exam
                </button>
              )}
              <button
                onClick={() => setShowExamModal(false)}
                className="px-6 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
