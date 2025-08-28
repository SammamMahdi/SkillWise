import React, { useMemo } from 'react'

export default function AutoQuizModal({ isOpen, lecture, onClose, onChange, onSave }) {
  const questions = useMemo(() => lecture?.autoQuiz || [], [lecture])
  if (!isOpen || !lecture) return null

  const update = (idx, patch) => {
    const next = [...questions]
    next[idx] = { ...next[idx], ...patch }
    onChange(next)
  }

  const addQuestion = () => {
    const next = [...(questions || []), { question: '', type: 'mcq', options: ['', ''], correctAnswer: '', points: 1 }]
    onChange(next)
  }

  const removeQuestion = (idx) => {
    const next = questions.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Auto Quiz – {lecture.title}</h3>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Question {i + 1}</div>
                <button onClick={() => removeQuestion(i)} className="text-rose-500 text-xs">Remove</button>
              </div>
              <input
                value={q.question}
                onChange={(e) => update(i, { question: e.target.value })}
                placeholder="Enter question"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border mb-2"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                <select
                  value={q.type || 'mcq'}
                  onChange={(e) => update(i, { type: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-background border border-border"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="short">One word/number</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={q.points ?? 1}
                  onChange={(e) => update(i, { points: parseInt(e.target.value || '1', 10) })}
                  className="px-3 py-2 rounded-lg bg-background border border-border"
                  placeholder="Points"
                />
                <input
                  value={q.correctAnswer ?? ''}
                  onChange={(e) => update(i, { correctAnswer: e.target.value })}
                  placeholder={q.type === 'short' ? 'Correct word/number' : 'Correct option text'}
                  className="px-3 py-2 rounded-lg bg-background border border-border"
                />
              </div>

              {q.type !== 'short' && (
                <div className="space-y-2">
                  {(q.options || ['','']).map((opt, oi) => (
                    <input
                      key={oi}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...(q.options || [])]
                        opts[oi] = e.target.value
                        update(i, { options: opts })
                      }}
                      placeholder={`Option ${oi + 1}`}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                    />
                  ))}
                  <button
                    onClick={() => update(i, { options: [...(q.options || []), ''] })}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                  >Add Option</button>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button onClick={addQuestion} className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded">Add Question</button>
            <div className="text-xs text-foreground/60">Total: {questions.length} (min 5)</div>
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          {typeof onSave === 'function' && (
            <button onClick={onSave} className="px-4 py-2 rounded bg-primary text-primary-foreground">Save</button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded bg-background border border-border">Close</button>
        </div>
      </div>
    </div>
  )
}


