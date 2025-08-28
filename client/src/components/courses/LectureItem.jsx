import React from 'react';
import { X } from 'lucide-react';

const CODE5 = /^\d{5}$/;

export default function LectureItem({ 
  lecture, 
  index, 
  removeLecture, 
  patchLecture, 
  setCurrentLecture, 
  setShowContentModal, 
  setShowExamModal, 
  setShowExamCreationModal, 
  setExamData, 
  lectures,
  setShowAutoQuizModal 
}) {
  const handleManageContent = () => {
    const latestLecture = lectures.find(l => l._tmpId === lecture._tmpId);
    if (latestLecture) {
      const lectureWithContent = {
        ...latestLecture,
        content: latestLecture.content || []
      };
      setCurrentLecture(lectureWithContent);
      setShowContentModal(true);
    }
  };

  const handleAssignExam = () => {
    setCurrentLecture(lecture);
    if (lecture.exam && typeof lecture.exam === 'object' && lecture.exam.questions) {
      setExamData({
        title: lecture.exam.title || '',
        description: lecture.exam.description || '',
        timeLimit: lecture.exam.timeLimit || 60,
        passingScore: lecture.passingScore || 60,
        maxAttempts: lecture.exam.maxAttempts || 1,
        shuffleQuestions: lecture.exam.shuffleQuestions !== false,
        randomizeOptions: lecture.exam.randomizeOptions !== false,
        questions: lecture.exam.questions || []
      });
      setShowExamCreationModal(true);
    } else {
      setShowExamModal(true);
    }
  };

  const handleEditAutoQuiz = () => {
    setCurrentLecture(lecture);
    setShowAutoQuizModal(true);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Lecture {index + 1}</div>
        <button type="button" onClick={() => removeLecture(lecture._tmpId)} className="text-rose-400 hover:text-rose-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Lecture Title *</label>
          <input
            value={lecture.title}
            onChange={(e) => patchLecture(lecture._tmpId, { title: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg bg-card border ${
              !lecture.title?.trim() ? 'border-orange-500' : 'border-border'
            }`}
            placeholder="Intro to Scales"
          />
          {!lecture.title?.trim() && <div className="text-xs text-orange-500 mt-1">Title is required</div>}
        </div>
        <div>
          <label className="block text-sm mb-2">Lecture Code (5 digits) *</label>
          <input
            value={lecture.lectureCode}
            onChange={(e) =>
              patchLecture(lecture._tmpId, { lectureCode: e.target.value.replace(/\D/g, '').slice(0, 5) })
            }
            className={`w-full px-3 py-2 rounded-lg bg-card border ${
              !CODE5.test(lecture.lectureCode) ? 'border-orange-500' : 'border-border'
            }`}
            placeholder="00001"
            inputMode="numeric"
          />
          {!CODE5.test(lecture.lectureCode) && <div className="text-xs text-orange-500 mt-1">Must be 5 digits</div>}
        </div>
      </div>

      {/* Lecture Description */}
      <div className="mt-4">
        <label className="block text-sm mb-2">Lecture Description</label>
        <textarea
          value={lecture.description || ''}
          onChange={(e) => patchLecture(lecture._tmpId, { description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border min-h-[88px]"
          placeholder="Write a short description for this lecture..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm mb-2">Time Limit (min)</label>
          <input
            type="number"
            min="0"
            value={lecture.timeLimit ?? ''}
            onChange={(e) => patchLecture(lecture._tmpId, { timeLimit: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border"
            placeholder="Optional"
          />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
            checked={lecture.shuffleQuestions}
            onChange={(e) => patchLecture(lecture._tmpId, { shuffleQuestions: e.target.checked })}
          />
          <span className="text-sm">Shuffle</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={lecture.isExam}
            onChange={(e) => patchLecture(lecture._tmpId, { isExam: e.target.checked })}
          />
          <span className="text-sm">Exam</span>
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

      {/* Content Management */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Content</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleManageContent}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              Manage Content
            </button>
            <button
              type="button"
              onClick={handleAssignExam}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              {lecture.exam ? 
                (typeof lecture.exam === 'string' ? 'Change Exam' : 'Edit Custom Exam') : 
                'Assign Exam'
              }
            </button>
          </div>
        </div>

        {/* Content Summary */}
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-blue-600">📹</span>
              <span>{lecture.content?.filter(c => c.type === 'video').length || 0} Videos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-600">📄</span>
              <span>{lecture.content?.filter(c => c.type === 'pdf').length || 0} PDFs</span>
            </div>
            {lecture.exam && (
              <div className="flex items-center gap-1">
                <span className="text-green-600">📝</span>
                <span>
                  {typeof lecture.exam === 'string' ? 'Existing Exam' : 'Custom Exam'} 
                  ({lecture.passingScore}% pass)
                  {typeof lecture.exam === 'object' && lecture.exam.questions && 
                    ` - ${lecture.exam.questions.length} questions`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto Quiz (mandatory, min 5) */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Auto Quiz (min 5 questions)</h4>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={lecture.autoQuizEnabled !== false}
              onChange={(e) => patchLecture(lecture._tmpId, { autoQuizEnabled: e.target.checked })}
            />
            Enable
          </label>
        </div>

        <div className="space-y-3">
          {(lecture.autoQuiz?.length || 0) < 5 && (
            <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-300">
              At least 5 questions required. Currently {(lecture.autoQuiz?.length || 0)}.
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={handleEditAutoQuiz} className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded">Manage Auto Quiz</button>
          <div className="text-xs text-foreground/60">Current: {(lecture.autoQuiz || []).length}</div>
        </div>
      </div>
    </div>
  );
}
