import React from 'react';
import { 
  Video, File, FileText, ExternalLink, Download, 
  AlertCircle, Play 
} from 'lucide-react';

/**
 * ContentDisplay Component
 * 
 * Displays lecture content (videos, PDFs, or other materials) with appropriate viewers.
 * Handles different content types and provides proper embedding for videos and PDFs.
 * 
 * @param {Object} props
 * @param {Object} props.lecture - Current lecture data
 * @param {number} props.lectureIndex - Index of current lecture
 * @param {Object} props.lectureProgress - Progress data for current lecture
 * @param {function} props.onMarkComplete - Callback to mark lecture as complete
 * @param {boolean} props.canMarkComplete - Whether user can mark lecture complete
 */
const ContentDisplay = ({ 
  lecture, 
  lectureIndex, 
  lectureProgress, 
  onMarkComplete, 
  canMarkComplete 
}) => {
  
  // Debug logging
  console.log('ContentDisplay - Lecture:', lecture);
  console.log('ContentDisplay - Lecture content:', lecture?.content);
  console.log('ContentDisplay - Lecture index:', lectureIndex);

  /**
   * Fixes content data where title and URL might be swapped
   * @param {Object} content - Content item
   * @returns {Object} - Fixed content item
   */
  const fixContentData = (content) => {
    if (!content) return content;
    
    let fixedContent = { ...content };
    
    // Check if title looks like a URL and url looks like a title
    const titleLooksLikeUrl = fixedContent.title && (
      fixedContent.title.startsWith('http://') || 
      fixedContent.title.startsWith('https://') ||
      fixedContent.title.includes('youtube.com') ||
      fixedContent.title.includes('youtu.be') ||
      fixedContent.title.includes('vimeo.com')
    );
    
    const urlLooksLikeTitle = fixedContent.url && !fixedContent.url.includes('http') && !fixedContent.url.includes('.');
    
    // If data seems swapped, fix it
    if (titleLooksLikeUrl && urlLooksLikeTitle) {
      console.log('Detected swapped title/URL, fixing...', { original: fixedContent });
      const temp = fixedContent.title;
      fixedContent.title = fixedContent.url;
      fixedContent.url = temp;
      console.log('Fixed content:', fixedContent);
    }
    
    // If URL is still missing or invalid, try to use title as URL
    if (!fixedContent.url || (!fixedContent.url.includes('http') && !fixedContent.url.includes('.'))) {
      if (titleLooksLikeUrl) {
        fixedContent.url = fixedContent.title;
        fixedContent.title = fixedContent.title; // Keep original title for now
      }
    }
    
    return fixedContent;
  };
  
  /**
   * Gets the appropriate video embed URL from various video platforms
   * @param {string} url - Original video URL
   * @returns {string} - Embeddable URL
   */
  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube URL handling
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId = '';
      
      if (url.includes('youtube.com/watch')) {
        // Extract from: https://www.youtube.com/watch?v=VIDEO_ID
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v');
      } else if (url.includes('youtu.be/')) {
        // Extract from: https://youtu.be/VIDEO_ID
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }
    
    // Vimeo URL handling
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    // Return original URL for direct video files or other platforms
    return url;
  };

  /**
   * Renders video content with appropriate player
   * @param {Object} content - Content item with video data
   * @returns {JSX.Element} - Video player component
   */
  const renderVideoContent = (content) => {
    const fixedContent = fixContentData(content);
    const embedUrl = getEmbedUrl(fixedContent.url);
    
    console.log('Rendering video content:', { original: content, fixed: fixedContent, embedUrl });
    
    if (!embedUrl) {
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 dark:text-red-300">Invalid video URL</p>
              <p className="text-sm text-red-600 dark:text-red-400">URL: {fixedContent.url}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            title={fixedContent.title || 'Video Content'}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">{fixedContent.title || 'Video Content'}</h4>
            {fixedContent.duration && (
              <p className="text-sm text-foreground/60">
                Duration: {Math.floor(fixedContent.duration / 60)}:{(fixedContent.duration % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
          
          <a 
            href={fixedContent.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open Original
          </a>
        </div>
      </div>
    );
  };

  /**
   * Renders PDF content with viewer options
   * @param {Object} content - Content item with PDF data
   * @returns {JSX.Element} - PDF viewer component
   */
  const renderPdfContent = (content) => {
    const fixedContent = fixContentData(content);
    
    return (
      <div className="space-y-4">
        <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={`${fixedContent.url}#toolbar=1&navpanes=1&scrollbar=1`}
            title={fixedContent.title || 'PDF Document'}
            className="w-full h-full"
            loading="lazy"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">{fixedContent.title || 'PDF Document'}</h4>
            {fixedContent.pdfPages && (
              <p className="text-sm text-foreground/60">
                {fixedContent.pdfPages} page{fixedContent.pdfPages !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={fixedContent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders other content types with basic display
   * @param {Object} content - Content item
   * @returns {JSX.Element} - Basic content display
   */
  const renderOtherContent = (content) => {
    const fixedContent = fixContentData(content);
    
    return (
      <div className="bg-accent/20 rounded-xl p-6 text-center">
        <FileText className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
        <h4 className="font-medium text-foreground mb-2">{fixedContent.title || 'Content'}</h4>
        <a 
          href={fixedContent.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          Open Content
        </a>
      </div>
    );
  };

  /**
   * Renders individual content item based on type
   * @param {Object} content - Content item
   * @param {number} index - Index of content item
   * @returns {JSX.Element} - Rendered content
   */
  const renderContentItem = (content, index) => {
    const fixedContent = fixContentData(content);
    
    switch (fixedContent.type) {
      case 'video':
        return renderVideoContent(fixedContent);
      case 'pdf':
        return renderPdfContent(fixedContent);
      default:
        return renderOtherContent(fixedContent);
    }
  };

  // Show message if no content available
  if (!lecture.content || lecture.content.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
          <p className="text-foreground/60 mb-4">
            This lecture doesn't have any content materials yet.
          </p>
          {/* Debug info */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left text-xs">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <pre className="whitespace-pre-wrap overflow-auto max-h-40">
              {JSON.stringify(lecture, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const progress = lectureProgress[lectureIndex];
  const isCompleted = progress?.completed;

  return (
    <div className="space-y-6">
      {/* Content Header */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{lecture.title || `Lecture ${lectureIndex + 1}`}</h2>
            <p className="text-sm text-foreground/60 mt-1">
              {lecture.content.length} content item{lecture.content.length !== 1 ? 's' : ''}
              {lecture.estimatedDuration && ` • ${lecture.estimatedDuration} minutes`}
            </p>
          </div>
          
          {/* Completion Status */}
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <Play className="w-5 h-5" />
              <span className="text-sm font-medium">Content Completed</span>
            </div>
          )}
        </div>

        {/* Mark Complete Button */}
        {canMarkComplete && !isCompleted && (
          <button
            onClick={() => onMarkComplete(lectureIndex)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Mark Content as Complete
          </button>
        )}

        {/* Warning for Quiz Requirement */}
        {!isCompleted && lecture.exam && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-600">
              ⚠️ You must complete the quiz below before proceeding to the next lecture.
            </p>
          </div>
        )}
      </div>

      {/* Content Items */}
      <div className="space-y-6">
        {lecture.content.map((content, index) => {
          const fixedContent = fixContentData(content);
          
          return (
            <div 
              key={index} 
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                {fixedContent.type === 'video' ? (
                  <Video className="w-5 h-5 text-blue-500" />
                ) : fixedContent.type === 'pdf' ? (
                  <File className="w-5 h-5 text-red-500" />
                ) : (
                  <FileText className="w-5 h-5 text-foreground/60" />
                )}
                <span className="text-sm font-medium text-foreground/80">
                  {fixedContent.type === 'video' ? 'Video Content' : 
                   fixedContent.type === 'pdf' ? 'PDF Document' : 'Content'}
                </span>
              </div>
              
              {renderContentItem(content, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentDisplay;
