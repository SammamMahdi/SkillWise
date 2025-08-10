import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Plus, X, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createCourse } from '../../services/courseService';

const CODE5 = /^\d{5}$/;

export default function CreateCourseForm() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [lectures, setLectures] = useState([]);
  const [courseCode, setCourseCode] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const invalidCourseCode = useMemo(() => !CODE5.test(courseCode), [courseCode]);

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

  // ----- Tags -----
  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setNewTag('');
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  // ----- Lectures -----
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
      },
    ]);

  const removeLecture = (id) => setLectures(prev => prev.filter(l => l._tmpId !== id));

  const patchLecture = (id, patch) =>
    setLectures(prev => prev.map(l => (l._tmpId === id ? { ...l, ...patch } : l)));

  const hasBadLectureCodes = () => {
    const seen = new Set();
    for (const l of lectures) {
      if (!CODE5.test(l.lectureCode)) return true;
      if (seen.has(l.lectureCode)) return true;
      seen.add(l.lectureCode);
    }
    return false;
  };

  // ----- Submit -----
  const onSubmit = async (form) => {
    try {
      setLoading(true);
      setError('');

      if (invalidCourseCode) throw new Error('Course code must be exactly 5 digits.');
      if (lectures.length && hasBadLectureCodes()) {
        throw new Error('Every lecture needs a unique 5-digit code.');
      }

      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price) || 0,
        tags,
        // Internal manual codes:
        courseCode,
        lectures: lectures.map(l => ({
          lectureCode: l.lectureCode,
          title: l.title,
          content: l.content || [],
          quiz: l.quiz || [],
          isLocked: !!l.isLocked,
          isExam: !!l.isExam,
          timeLimit: l.timeLimit ? Number(l.timeLimit) : undefined,
          shuffleQuestions: !!l.shuffleQuestions,
        })),
      };

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>
          <h1 className="text-3xl font-bold mt-3">Create New Course</h1>
          <p className="text-foreground/60">Share your knowledge and create an engaging learning experience.</p>
        </div>

        {!!error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-2">Course Title *</label>
                <input
                  {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 chars' } })}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary"
                  placeholder="Music Theory 101"
                />
                {errors.title && <div className="text-xs text-rose-400 mt-1">{errors.title.message}</div>}
              </div>

              <div>
                <label className="block text-sm mb-2">Price</label>
                <input
                  {...register('price', { min: { value: 0, message: '>= 0' } })}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
                {errors.price && <div className="text-xs text-rose-400 mt-1">{errors.price.message}</div>}
              </div>
            </div>

            {/* internal course code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm mb-2">Course Code (5 digits) *</label>
                <input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary"
                  placeholder="00001"
                  inputMode="numeric"
                  required
                />
                <div className="mt-1 text-xs">
                  {invalidCourseCode
                    ? <span className="text-rose-400">Must be 5 digits</span>
                    : <span className="text-emerald-400">Looks good</span>}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm mb-2">Description *</label>
              <textarea
                {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Min 10 chars' } })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary"
                placeholder="What will students learn? Any prerequisites?…"
              />
              {errors.description && <div className="text-xs text-rose-400 mt-1">{errors.description.message}</div>}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Tags</h2>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary"
                placeholder="Add a tag…"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 rounded-lg bg-primary text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {!!tags.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm flex items-center gap-2">
                    {t}
                    <button type="button" onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Lectures */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Lectures</h2>
              <button type="button" onClick={addLecture} className="px-4 py-2 rounded-lg bg-primary text-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Lecture
              </button>
            </div>

            {!lectures.length ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
                <div className="text-foreground/60">No lectures yet. Click “Add Lecture”.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {lectures.map((l, idx) => (
                  <div key={l._tmpId} className="p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">Lecture {idx + 1}</div>
                      <button type="button" onClick={() => removeLecture(l._tmpId)} className="text-rose-400 hover:text-rose-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2">Lecture Title</label>
                        <input
                          value={l.title}
                          onChange={(e) => patchLecture(l._tmpId, { title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                          placeholder="Intro to Scales"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Lecture Code (5 digits) *</label>
                        <input
                          value={l.lectureCode}
                          onChange={(e) =>
                            patchLecture(l._tmpId, { lectureCode: e.target.value.replace(/\D/g, '').slice(0, 5) })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                          placeholder="00001"
                          inputMode="numeric"
                        />
                        {!CODE5.test(l.lectureCode) && <div className="text-xs text-rose-400 mt-1">Must be 5 digits</div>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm mb-2">Time Limit (min)</label>
                        <input
                          type="number"
                          min="0"
                          value={l.timeLimit ?? ''}
                          onChange={(e) => patchLecture(l._tmpId, { timeLimit: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                          placeholder="Optional"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={l.isLocked}
                          onChange={(e) => patchLecture(l._tmpId, { isLocked: e.target.checked })}
                        />
                        <span className="text-sm">Locked</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={l.shuffleQuestions}
                            onChange={(e) => patchLecture(l._tmpId, { shuffleQuestions: e.target.checked })}
                          />
                          <span className="text-sm">Shuffle</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={l.isExam}
                            onChange={(e) => patchLecture(l._tmpId, { isExam: e.target.checked })}
                          />
                          <span className="text-sm">Exam</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/courses')} className="px-6 py-3 rounded-lg bg-background border border-border">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-50">
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
    </div>
  );
}
