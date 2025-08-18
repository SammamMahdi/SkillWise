import React, { useState } from 'react';
import {
  X,
  Upload,
  Tag,
  DollarSign,
  Gift,
  Repeat,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2
} from 'lucide-react';
import { skillsService } from '../../services/skillsService';

const CreateSkillPost = ({ onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'offer',
    pricing: 'free',
    level: '',
    skillTags: [],
    barterRequest: '',
    priceAmount: '',
    videoIntro: ''
  });
  const [images, setImages] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addSkillTag = () => {
    if (currentTag.trim() && !formData.skillTags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        skillTags: [...prev.skillTags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeSkillTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      skillTags: prev.skillTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.trim().length < 3) newErrors.title = 'Title must be at least 3 characters';
    
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.trim().length < 5) newErrors.description = 'Description must be at least 5 characters';
    
    if (formData.skillTags.length === 0) newErrors.skillTags = 'At least one skill tag is required';
    
    if (formData.pricing === 'paid' && !formData.priceAmount) {
      newErrors.priceAmount = 'Price amount is required for paid posts';
    }
    if (formData.pricing === 'barter' && !formData.barterRequest.trim()) {
      newErrors.barterRequest = 'Barter request is required for barter posts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'skillTags') {
          // Send skillTags as JSON string
          submitData.append('skillTags', JSON.stringify(formData[key]));
        } else if (formData[key] !== '' && formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      // Add images
      images.forEach(image => {
        submitData.append('images', image);
      });

      console.log('Submitting skill post with data:', {
        formData,
        imageCount: images.length,
        skillTags: formData.skillTags
      });

      const response = await skillsService.createSkillPost(submitData);
      
      if (response.success) {
        console.log('Skill post created successfully:', response.data);
        alert('Skill post created successfully!');
        onPostCreated(response.data);
        onClose(); // Close the modal after successful creation
      }
    } catch (error) {
      console.error('Error creating skill post:', error);
      
      let errorMessage = 'Failed to create skill post. Please try again.';
      
      // Handle specific error types
      if (error.message) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please log in again to create a skill post.';
        } else if (error.message.includes('Validation failed')) {
          errorMessage = 'Please check your inputs:\n• Title must be at least 3 characters\n• Description must be at least 5 characters\n• At least one skill tag is required';
        } else if (error.message.includes('Title is required')) {
          errorMessage = 'Title is required and must be at least 3 characters long.';
        } else if (error.message.includes('Description is required')) {
          errorMessage = 'Description is required and must be at least 5 characters long.';
        } else if (error.message.includes('skill tag')) {
          errorMessage = 'At least one skill tag is required.';
        } else if (error.message.includes('Type must be')) {
          errorMessage = 'Please select a valid type (offer or request).';
        } else if (error.message.includes('Pricing must be')) {
          errorMessage = 'Please select a valid pricing option (free, barter, or paid).';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create Skill Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Web Development Consultation"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Type and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="offer">Offering Skill</option>
                <option value="request">Requesting Skill</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Pricing *
              </label>
              <select
                name="pricing"
                value={formData.pricing}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="free">Free</option>
                <option value="barter">Barter/Exchange</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.pricing === 'paid' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Price Amount ($) *
              </label>
              <input
                type="number"
                name="priceAmount"
                value={formData.priceAmount}
                onChange={handleInputChange}
                placeholder="50"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
              {errors.priceAmount && <p className="text-destructive text-sm mt-1">{errors.priceAmount}</p>}
            </div>
          )}

          {formData.pricing === 'barter' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                What are you looking for in exchange? *
              </label>
              <input
                type="text"
                name="barterRequest"
                value={formData.barterRequest}
                onChange={handleInputChange}
                placeholder="e.g., Graphic design services"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
              {errors.barterRequest && <p className="text-destructive text-sm mt-1">{errors.barterRequest}</p>}
            </div>
          )}

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Skill Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="">Select Level</option>
              {skillLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description * (at least 5 characters)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe your skill offering or request in detail..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
              </div>
              <div className="text-xs text-foreground/60">
                {formData.description.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Skill Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Skill Tags * (Add relevant skills)
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillTag())}
                placeholder="e.g., JavaScript, React, Node.js"
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
              <button
                type="button"
                onClick={addSkillTag}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Tags Display */}
            <div className="flex flex-wrap gap-2">
              {formData.skillTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent text-accent-foreground"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeSkillTag(tag)}
                    className="ml-2 text-accent-foreground/60 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.skillTags && <p className="text-destructive text-sm mt-1">{errors.skillTags}</p>}
          </div>

          {/* Video Introduction */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Video Introduction URL (Optional)
            </label>
            <input
              type="url"
              name="videoIntro"
              value={formData.videoIntro}
              onChange={handleInputChange}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Images (Optional, max 5)
            </label>
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-foreground/40" />
                    <p className="text-sm text-foreground/60">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-foreground/40">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSkillPost;
