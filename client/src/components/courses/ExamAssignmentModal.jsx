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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card/20 border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Assign Exam - {currentLecture.title}</h3>
          <button onClick={() => setShowExamModal(false)} className="text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {teacherExams.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">No Exams Available</h4>
            <p className="text-white/70 mb-4">You need to create exams first before assigning them to lectures.</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowExamModal(false);
                  setShowExamCreationModal(true);
                }}
                className="px-4 py-2 bg-primary/80 hover:bg-primary text-white rounded-xl"
              >
                Create New Exam
              </button>
              <button
                onClick={() => {
                  setShowExamModal(false);
                  navigate('/exams/create');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90"
              >
                Go to Exam Creator
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-white/80">Select Exam</label>
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
                className="w-full px-3 py-2 rounded-xl bg-black/20 text-white/90 border border-white/10 backdrop-blur-sm"
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
                <label className="block text-sm font-medium mb-2 text-white/80">Passing Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentLecture.passingScore || 60}
                  onChange={(e) => patchLecture(currentLecture._tmpId, { passingScore: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 text-white/90 border border-white/10 backdrop-blur-sm"
                />
              </div>
            )}

            {currentLecture.exam && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-emerald-300">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Exam Assigned</span>
                </div>
                <p className="text-emerald-200/80 text-sm mt-1">Students must pass this exam to complete the lecture.</p>
              </div>
            )}

            <div className="flex justify-between">
              {currentLecture.exam && (
                <button
                  onClick={() => removeExam(currentLecture._tmpId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                >
                  Remove Exam
                </button>
              )}
              <button
                onClick={() => setShowExamModal(false)}
                className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-sm"
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
