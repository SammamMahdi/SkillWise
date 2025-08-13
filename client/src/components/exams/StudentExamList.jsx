import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Play, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import examService from '../../services/examService';
import ContactCreatorModal from './ContactCreatorModal';
import ExamWarningModal from './ExamWarningModal';

const StudentExamList = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      const response = await examService.getAvailableExams();
      setExams(response.data.exams);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch available exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam) => {
    if (!exam.canAttempt) {
      toast.error('You have reached the maximum number of attempts for this exam');
      return;
    }

    // Show warning modal first
    setSelectedExam(exam);
    setShowWarningModal(true);
  };

  const handleProceedWithExam = async () => {
    setShowWarningModal(false);

    console.log('=== STARTING EXAM DEBUG ===');
    console.log('Exam data:', selectedExam);

    try {
      console.log('Getting browser info...');
      const browserInfo = examService.getBrowserInfo();
      console.log('Browser info:', browserInfo);

      console.log('Calling startExamAttempt API...');
      const response = await examService.startExamAttempt(selectedExam._id, browserInfo);
      console.log('API response:', response);

      // Store exam data in session storage for the exam interface
      const examData = {
        attemptId: response.data.attemptId,
        timeLimit: response.data.timeLimit,
        questions: response.data.questions,
        antiCheat: response.data.antiCheat
      };

      console.log('Storing exam data in sessionStorage:', examData);
      sessionStorage.setItem('currentExamData', JSON.stringify(examData));

      // Navigate to exam interface
      console.log('Navigating to exam interface:', `/exams/take/${response.data.attemptId}`);
      navigate(`/exams/take/${response.data.attemptId}`);

    } catch (error) {
      console.error('=== EXAM START ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      toast.error(error.message || 'Failed to start exam');
    }
  };

  const handleContactCreator = (exam) => {
    setSelectedExam(exam);
    setShowContactModal(true);
  };

  const getStatusBadge = (exam) => {
    if (!exam.canAttempt) {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
          Max Attempts Reached
        </span>
      );
    }

    if (exam.attemptCount === 0) {
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          Not Attempted
        </span>
      );
    }

    if (exam.lastAttempt?.passed) {
      return (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          Passed
        </span>
      );
    }

    return (
      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
        Attempted
      </span>
    );
  };

  const ExamCard = ({ exam }) => (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">{exam.title}</h3>
          <p className="text-sm text-foreground/60 mb-2">{exam.course?.title}</p>
          {exam.description && (
            <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{exam.description}</p>
          )}
        </div>
        {getStatusBadge(exam)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-foreground/60" />
          <span>{exam.timeLimit}m</span>
        </div>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-foreground/60" />
          <span>{exam.questions?.length || 0} questions</span>
        </div>
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-foreground/60" />
          <span>{exam.attemptCount}/{exam.maxAttempts} attempts</span>
        </div>
        <div className="flex items-center space-x-2">
          {exam.bestScore !== null ? (
            <>
              {exam.bestScore >= exam.passingScore ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{exam.bestScore}%</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-foreground/60" />
              <span>Not attempted</span>
            </>
          )}
        </div>
      </div>

      {/* Exam Details */}
      <div className="bg-muted rounded-lg p-3 mb-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Passing Score:</span> {exam.passingScore}%
          </div>
          <div>
            <span className="font-medium">Total Points:</span> {exam.totalPoints}
          </div>
        </div>
      </div>

      {/* Anti-cheat Warning */}
      {exam.antiCheat && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Anti-cheat measures are active:</p>
              <ul className="text-xs space-y-1">
                {exam.antiCheat.blockCopyPaste && <li>• Copy/paste is disabled</li>}
                {exam.antiCheat.blockTabSwitching && <li>• Tab switching will be monitored</li>}
                {exam.antiCheat.blockRightClick && <li>• Right-click is disabled</li>}
                {exam.antiCheat.fullScreenRequired && <li>• Full-screen mode required</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-foreground/60">
          {exam.availableUntil && (
            <span>Available until: {new Date(exam.availableUntil).toLocaleDateString()}</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleContactCreator(exam)}
            className="px-4 py-2 border border-border rounded-lg font-medium transition-colors flex items-center space-x-2 hover:bg-accent text-foreground"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Creator</span>
          </button>

          <button
            onClick={() => handleStartExam(exam)}
            disabled={!exam.canAttempt}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              exam.canAttempt
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{exam.canAttempt ? 'Start Exam' : 'No Attempts Left'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Available Exams</h1>
          <p className="text-foreground/60">Take exams for your enrolled courses</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Exams Available</h3>
            <p className="text-foreground/60">
              There are no published exams for your enrolled courses at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {exams.map(exam => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Exam Instructions</h2>
          <div className="space-y-2 text-sm text-foreground/80">
            <p>• Make sure you have a stable internet connection before starting an exam</p>
            <p>• Once you start an exam, the timer begins immediately and cannot be paused</p>
            <p>• Anti-cheat measures are in place - avoid switching tabs or copying content</p>
            <p>• Multiple violations may result in automatic submission of your exam</p>
            <p>• Save your answers frequently as you progress through the exam</p>
            <p>• You can review and change your answers before final submission</p>
          </div>
        </div>

        {/* Modals */}
        {showWarningModal && selectedExam && (
          <ExamWarningModal
            exam={selectedExam}
            onProceed={handleProceedWithExam}
            onCancel={() => {
              setShowWarningModal(false);
              setSelectedExam(null);
            }}
          />
        )}

        {showContactModal && selectedExam && (
          <ContactCreatorModal
            exam={selectedExam}
            onClose={() => {
              setShowContactModal(false);
              setSelectedExam(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StudentExamList;
