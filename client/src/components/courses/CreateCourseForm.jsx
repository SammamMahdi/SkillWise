import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Plus, X, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CreateCourseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  const watchedPrice = watch('price', 0);

  // Check if user is a teacher
  if (user?.role !== 'Teacher') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-foreground/60">Only teachers can create courses.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddLecture = () => {
    const newLecture = {
      id: Date.now(),
      title: '',
      content: [],
      quiz: [],
      isLocked: true,
      isExam: false
    };
    setLectures([...lectures, newLecture]);
  };

  const handleRemoveLecture = (lectureId) => {
    setLectures(lectures.filter(lecture => lecture.id !== lectureId));
  };

  const handleLectureChange = (lectureId, field, value) => {
    setLectures(lectures.map(lecture => 
      lecture.id === lectureId ? { ...lecture, [field]: value } : lecture
    ));
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const courseData = {
        ...data,
        tags: tags,
        lectures: lectures.map(lecture => ({
          title: lecture.title,
          content: lecture.content,
          quiz: lecture.quiz,
          isLocked: lecture.isLocked,
          isExam: lecture.isExam
        })),
        price: parseFloat(data.price) || 0
      };

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create course');
      }

      // Show success message and redirect
      alert('Course created successfully!');
      navigate(`/courses/${result.data._id}`);
    } catch (err) {
      setError(err.message);
      console.error('Error creating course:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Course</h1>
          <p className="text-foreground/60">Share your knowledge and create an engaging learning experience</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title', {
                    required: 'Course title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                    maxLength: { value: 200, message: 'Title must be less than 200 characters' }
                  })}
                  type="text"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  placeholder="Enter course title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Price
                </label>
                <input
                  {...register('price', {
                    min: { value: 0, message: 'Price must be non-negative' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description', {
                  required: 'Course description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 2000, message: 'Description must be less than 2000 characters' }
                })}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="Describe your course content, objectives, and what students will learn..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Tags</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Lectures */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Lectures</h2>
              <button
                type="button"
                onClick={handleAddLecture}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Lecture
              </button>
            </div>

            {lectures.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                <p className="text-foreground/60">No lectures added yet. Click "Add Lecture" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lectures.map((lecture, index) => (
                  <div key={lecture.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-foreground">Lecture {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveLecture(lecture.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Lecture Title
                        </label>
                        <input
                          type="text"
                          value={lecture.title}
                          onChange={(e) => handleLectureChange(lecture.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                          placeholder="Enter lecture title"
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lecture.isLocked}
                            onChange={(e) => handleLectureChange(lecture.id, 'isLocked', e.target.checked)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary bg-background"
                          />
                          <span className="text-sm text-foreground">Locked</span>
                        </label>
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lecture.isExam}
                            onChange={(e) => handleLectureChange(lecture.id, 'isExam', e.target.checked)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary bg-background"
                          />
                          <span className="text-sm text-foreground">Exam</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-6 py-3 bg-background border border-border rounded-lg text-foreground hover:bg-foreground/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseForm;
