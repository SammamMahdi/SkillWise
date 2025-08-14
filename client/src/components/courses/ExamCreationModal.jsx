import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function ExamCreationModal({ 
  showExamCreationModal, 
  currentLecture, 
  setShowExamCreationModal, 
  examData, 
  setExamData, 
  addQuestion, 
  removeQuestion, 
  updateQuestion, 
  addOption, 
  removeOption, 
  updateOption, 
  createExamForLecture 
}) {
  if (!showExamCreationModal || !currentLecture) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {examData.title ? 'Edit Exam' : 'Create Exam'} for {currentLecture.title}
          </h3>
          <button
            onClick={() => setShowExamCreationModal(false)}
            className="text-foreground/60 hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Basic Exam Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Exam Title *</label>
            <input
              type="text"
              value={examData.title}
              onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border"
              placeholder="Enter exam title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
            <input
              type="number"
              min="5"
              max="300"
              value={examData.timeLimit}
              onChange={(e) => setExamData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={examData.passingScore}
              onChange={(e) => setExamData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 60 }))}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={examData.description}
              onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border"
              placeholder="Enter exam description"
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={examData.shuffleQuestions}
                onChange={(e) => setExamData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
              />
              <span className="text-sm">Shuffle Questions</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={examData.randomizeOptions}
                onChange={(e) => setExamData(prev => ({ ...prev, randomizeOptions: e.target.checked }))}
              />
              <span className="text-sm">Randomize Options</span>
            </label>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Questions</h4>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {examData.questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Question {qIndex + 1}</span>
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-2">Question Text *</label>
                    <input
                      type="text"
                      value={question.questionText}
                      onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                      placeholder="Enter question text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        if (newType !== 'mcq') {
                          updateQuestion(qIndex, 'options', []);
                          updateQuestion(qIndex, 'correctAnswer', '');
                        } else if (newType === 'mcq' && (!question.options || question.options.length === 0)) {
                          updateQuestion(qIndex, 'options', [
                            { text: '', isCorrect: true, id: Date.now() + Math.random() },
                            { text: '', isCorrect: false, id: Date.now() + Math.random() + 1 }
                          ]);
                        }
                        updateQuestion(qIndex, 'type', newType);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                    />
                  </div>
                </div>

                {/* MCQ Options */}
                {question.type === 'mcq' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Options</label>
                        <p className="text-xs text-foreground/60 mt-1">Click the radio button to mark the correct answer</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                      >
                        <Plus className="w-3 h-3" />
                        Add Option
                      </button>
                    </div>
                    
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                        option.isCorrect 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : 'border-border'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`question-${qIndex}-correct`}
                            checked={option.isCorrect}
                            onChange={() => {
                              question.options.forEach((opt, idx) => {
                                updateOption(qIndex, idx, 'isCorrect', false);
                              });
                              updateOption(qIndex, oIndex, 'isCorrect', true);
                            }}
                            className="text-green-600"
                          />
                          <span className={`text-sm font-medium ${
                            option.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-foreground/70'
                          }`}>
                            {option.isCorrect ? '✓ Correct' : 'Option'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card focus:border-primary focus:ring-1 focus:ring-primary/20"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Short Answer */}
                {question.type === 'short_answer' && (
                  <div>
                    <label className="block text-sm mb-2">Correct Answer</label>
                    <input
                      type="text"
                      value={question.correctAnswer || ''}
                      onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                      placeholder="Enter correct answer"
                    />
                  </div>
                )}

                {/* Essay */}
                {question.type === 'essay' && (
                  <div>
                    <label className="block text-sm mb-2">Max Words</label>
                    <input
                      type="number"
                      min="1"
                      value={question.maxWords || ''}
                      onChange={(e) => updateQuestion(qIndex, 'maxWords', parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                      placeholder="100"
                    />
                  </div>
                )}
              </div>
            ))}

            {examData.questions.length === 0 && (
              <div className="text-center py-8 text-foreground/60">
                No questions added yet. Click "Add Question" to get started.
              </div>
            )}
            
            {examData.questions.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <h5 className="font-medium mb-2">Exam Summary</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-foreground/60">Total Questions:</span>
                    <span className="block font-medium">{examData.questions.length}</span>
                  </div>
                  <div>
                    <span className="text-foreground/60">MCQ Questions:</span>
                    <span className="block font-medium">
                      {examData.questions.filter(q => q.type === 'mcq').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Questions Ready:</span>
                    <span className="block font-medium text-green-600">
                      {examData.questions.filter(q => {
                        if (q.type === 'mcq') {
                          return q.options && q.options.length >= 2 && q.options.some(opt => opt.isCorrect);
                        } else if (q.type === 'short_answer') {
                          return q.correctAnswer && q.correctAnswer.trim();
                        }
                        return true;
                      }).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Total Points:</span>
                    <span className="block font-medium">
                      {examData.questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowExamCreationModal(false)}
            className="px-6 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20"
          >
            Cancel
          </button>
          <button
            onClick={createExamForLecture}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {examData.title ? 'Update Exam' : 'Create & Assign Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
