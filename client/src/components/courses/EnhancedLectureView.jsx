import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Play, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Lock,
  ArrowLeft,
  Eye,
  File,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import UniversalTopBar from '../common/UniversalTopBar';
import { getCourse } from '../../services/courseService';
import { getEnrolledCourseDetails } from '../../services/learningService';
import lectureContentService from '../../services/lectureContentService';
import bg from '../auth/evening-b2g.jpg';

const EnhancedLectureView = () => {
  const { courseId, lectureIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [course, setCourse] = useState(null);
  const [lecture, setLecture] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [lectureProgress, setLectureProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    loadLectureData();
  }, [courseId, lectureIndex]);

  const loadLectureData = async () => {
    try {
      setLoading(true);
      
      // Load course data
      const courseResponse = await getCourse(courseId);
      if (!courseResponse.success) {
        throw new Error('Failed to load course');
      }

      const courseData = courseResponse.data;
      setCourse(courseData);
      
      // Find the specific lecture
      const lectureIdx = parseInt(lectureIndex);
      if (lectureIdx < 0 || lectureIdx >= courseData.lectures.length) {
        throw new Error('Lecture not found');
      }
      
      const lectureData = courseData.lectures[lectureIdx];
      setLecture(lectureData);
      
      // Auto-select first content if available
      if (lectureData.content && lectureData.content.length > 0) {
        setSelectedContent(lectureData.content[0]);
      }
      
      // Check enrollment and load progress
      try {
        const progressResponse = await getEnrolledCourseDetails(courseId);
        if (progressResponse.success) {
          setEnrollment({ enrolled: true });
          setLectureProgress(progressResponse.data.lectureProgress || {});
        }
      } catch (error) {
        // User is not enrolled
        console.log('User not enrolled in course');
      }
      
    } catch (error) {
      console.error('Error loading lecture:', error);
      toast.error('Failed to load lecture');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    const progress = lectureProgress[lectureIndex];
    if (progress?.completed && progress?.quizPassed) return 'completed';
    if (progress?.completed) return 'content-completed';
    if (!enrollment) return 'locked';
    if (parseInt(lectureIndex) === 0) return 'unlocked';
    const prevProgress = lectureProgress[parseInt(lectureIndex) - 1];
    return prevProgress?.completed && (!course.lectures[parseInt(lectureIndex) - 1]?.exam || prevProgress?.quizPassed) ? 'unlocked' : 'locked';
  };

  const handleContentSelect = (content) => {
    setSelectedContent(content);
  };

  const handleDownload = async (content) => {
    try {
      if (content.filename) {
        await lectureContentService.downloadFile(content.filename, content.originalName || content.title);
      } else {
        // For external URLs, open in new tab
        window.open(content.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading content:', error);
      toast.error('Failed to download content');
    }
  };

  const renderContentIcon = (content) => {
    const iconType = lectureContentService.getFileIcon(content.title, content.type);
    const iconClass = "w-5 h-5";
    
    switch (iconType) {
      case 'video':
        return <Video className={`${iconClass} text-blue-500`} />;
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'image':
        return <ImageIcon className={`${iconClass} text-green-500`} />;
      default:
        return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  const renderMainContent = () => {
    if (!selectedContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Select Content</h3>
            <p className="text-foreground/60">Choose content from the sidebar to view</p>
          </div>
        </div>
      );
    }

    const content = selectedContent;
    
    if (content.type === 'video') {
      return renderVideoContent(content);
    } else if (content.type === 'pdf') {
      return renderPDFContent(content);
    } else if (content.type === 'image') {
      return renderImageContent(content);
    } else {
      return renderDocumentContent(content);
    }
  };

  const renderVideoContent = (content) => {
    const url = content.url;
    
    // Handle YouTube URLs
    if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtube.com/watch')
        ? url.split('v=')[1]?.split('&')[0]
        : url.split('youtu.be/')[1]?.split('?')[0];

      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`;
        return (
          <iframe
            src={embedUrl}
            title={content.title}
            className="w-full h-full border-0 rounded-xl"
            allowFullScreen
            loading="lazy"
          />
        );
      }
    }
    
    // Handle Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId && !isNaN(videoId)) {
        const embedUrl = `https://player.vimeo.com/video/${videoId}`;
        return (
          <iframe
            src={embedUrl}
            title={content.title}
            className="w-full h-full border-0 rounded-xl"
            allowFullScreen
            loading="lazy"
          />
        );
      }
    }
    
    // Handle direct video files
    const videoUrl = url.startsWith('/uploads/') 
      ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${url}`
      : url;
    
    return (
      <video
        controls
        className="w-full h-full rounded-xl"
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    );
  };

  const renderPDFContent = (content) => {
    const pdfUrl = content.url.startsWith('/uploads/') 
      ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${content.url}`
      : content.url;
    
    return (
      <div className="h-full flex flex-col">
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          title={content.title}
          className="flex-1 border-0 rounded-xl"
          loading="lazy"
        />
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={() => window.open(pdfUrl, '_blank')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </button>
          <button
            onClick={() => handleDownload(content)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    );
  };

  const renderImageContent = (content) => {
    const imageUrl = content.url.startsWith('/uploads/') 
      ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${content.url}`
      : content.url;
    
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <img
          src={imageUrl}
          alt={content.title}
          className="max-w-full max-h-full object-contain rounded-xl"
          loading="lazy"
        />
      </div>
    );
  };

  const renderDocumentContent = (content) => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <File className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">{content.title}</h3>
          <p className="text-foreground/60 mb-4">This document cannot be previewed inline</p>
          <button
            onClick={() => handleDownload(content)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Document
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-foreground/80">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (!course || !lecture) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Lecture Not Found</h2>
          <p className="text-foreground/60">The requested lecture could not be found.</p>
        </div>
      </div>
    );
  }

  const status = getStatus();
  const isLocked = status === 'locked';

  return (
    <>
      <UniversalTopBar />
      <section
        className={`relative min-h-screen overflow-hidden transition-all duration-500 ${
          theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
        }`}
        style={theme === 'dark' ? {
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        {/* Overlay for readability */}
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />

        {/* Main Content - with top padding for fixed topbar */}
        <div className="relative z-10 h-screen flex pt-16">
          {/* Left Sidebar - Content List */}
          <div className="w-80 bg-white/5 dark:bg-black/20 backdrop-blur-xl border-r border-white/20 dark:border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/20 dark:border-white/10">
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{lecture.title}</h1>
                  <p className="text-sm text-foreground/60">{course.title}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                status === 'content-completed' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                status === 'unlocked' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                 status === 'unlocked' ? <Play className="w-4 h-4" /> :
                 <Lock className="w-4 h-4" />}
                {status === 'completed' ? 'Completed' :
                 status === 'content-completed' ? 'Content Done' :
                 status === 'unlocked' ? 'Available' :
                 'Locked'}
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLocked ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
                  <p className="text-foreground/60">This lecture is locked</p>
                  <p className="text-sm text-foreground/40">Complete previous lectures to unlock</p>
                </div>
              ) : lecture.content && lecture.content.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground/80 mb-3">Lecture Content</h3>
                  {lecture.content.map((content, index) => (
                    <div
                      key={index}
                      className={`group p-3 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 cursor-pointer ${
                        selectedContent === content ? 'ring-2 ring-primary/50 bg-primary/10' : ''
                      }`}
                      onClick={() => handleContentSelect(content)}
                    >
                      <div className="flex items-center gap-3">
                        {renderContentIcon(content)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{content.title}</h4>
                          <p className="text-sm text-foreground/60 capitalize">{content.type}</p>
                          {content.size && (
                            <p className="text-xs text-foreground/40">
                              {lectureContentService.formatFileSize(content.size)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentSelect(content);
                            }}
                            className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-foreground/60" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(content);
                            }}
                            className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4 text-foreground/60" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
                  <p className="text-foreground/60">No content available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Content Viewer */}
          <div className="flex-1 flex flex-col">
            {/* Content Header */}
            {selectedContent && (
              <div className="p-6 border-b border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderContentIcon(selectedContent)}
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedContent.title}</h2>
                      <p className="text-sm text-foreground/60 capitalize">{selectedContent.type} Content</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(selectedContent)}
                      className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-primary/30 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Display Area */}
            <div className="flex-1 p-6">
              <div className="h-full bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden">
                {renderMainContent()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default EnhancedLectureView;
