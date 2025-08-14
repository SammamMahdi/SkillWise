import React from 'react';
import { X, Video, File, FileVideo } from 'lucide-react';

export default function ContentManagementModal({ 
  showContentModal, 
  currentLecture, 
  setShowContentModal, 
  addContent, 
  removeContent, 
  updateContent 
}) {
  if (!showContentModal || !currentLecture) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Manage Content - {currentLecture.title}</h3>
          <button
            onClick={() => setShowContentModal(false)}
            className="text-foreground/60 hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Add Content Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => addContent(currentLecture._tmpId, 'video')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Add Video
          </button>
          <button
            onClick={() => addContent(currentLecture._tmpId, 'pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <File className="w-4 h-4" />
            Add PDF
          </button>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {currentLecture.content && currentLecture.content.length > 0 ? (
            currentLecture.content.map((content, idx) => (
              <div key={content._tmpId} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {content.type === 'video' ? (
                      <FileVideo className="w-4 h-4 text-blue-600" />
                    ) : (
                      <File className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium">{content.type === 'video' ? 'Video' : 'PDF'} {idx + 1}</span>
                  </div>
                  <button
                    onClick={() => removeContent(currentLecture._tmpId, content._tmpId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Title *</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => updateContent(currentLecture._tmpId, content._tmpId, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                      placeholder={content.type === 'video' ? 'Video title' : 'PDF title'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">URL/Link *</label>
                    <input
                      type="url"
                      value={content.url || ''}
                      onChange={(e) => updateContent(currentLecture._tmpId, content._tmpId, 'url', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                      placeholder={content.type === 'video' ? 'YouTube URL' : 'PDF URL'}
                    />
                  </div>
                </div>

                {content.type === 'video' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm mb-2">Duration (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        value={content.duration || ''}
                        onChange={(e) => updateContent(currentLecture._tmpId, content._tmpId, 'duration', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Video Type</label>
                      <select
                        value={content.videoType || 'youtube'}
                        onChange={(e) => updateContent(currentLecture._tmpId, content._tmpId, 'videoType', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="direct">Direct Link</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {content.type === 'pdf' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm mb-2">File Size (bytes)</label>
                      <input
                        type="number"
                        min="0"
                        value={content.pdfSize || ''}
                        onChange={(e) => updateContent(currentLecture._tmpId, content._tmpId, 'pdfSize', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Pages</label>
                      <input
                        type="number"
                        min="0"
                        value={content.pdfPages || ''}
                        onChange={(e) => updateContent(currentLecture._tmpId, content._tmpId, 'pdfPages', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <>
              {(!currentLecture.content || currentLecture.content.length === 0) && (
                <div className="text-center py-8 text-foreground/60">
                  No content added yet. Click the buttons above to add videos or PDFs.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => setShowContentModal(false)}
            className="px-6 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
