import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function BasicInformationSection({ courseCode, setCourseCode, invalidCourseCode, tags, newTag, setNewTag, addTag, removeTag }) {
  const { register, formState: { errors } } = useFormContext();

  return (
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

      {/* Course Code */}
      <div className="mt-6">
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

      {/* Description */}
      <div className="mt-6">
        <label className="block text-sm mb-2">Description *</label>
        <textarea
          {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Min 10 chars' } })}
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary resize-none"
          placeholder="What will students learn? Any prerequisites? What makes this course unique?"
        />
        {errors.description && <div className="text-xs text-rose-400 mt-1">{errors.description.message}</div>}
      </div>

      {/* Tags */}
      <div className="mt-6">
        <label className="block text-sm mb-2">Tags</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary"
            placeholder="Add a tag (press Enter)"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm flex items-center gap-2">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="hover:text-primary/80">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
