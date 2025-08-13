import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import examService from '../../services/examService';
import toast from 'react-hot-toast';

const ExamResults = () => {
  const { attemptId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await examService.getExamResults(attemptId);
      if (response.success) {
        setResults(response.data);
      } else {
        toast.error(response.message || 'Failed to load exam results');
      }
    } catch (error) {
      console.error('Failed to fetch exam results:', error);
      toast.error(error.message || 'Failed to load exam results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Results Not Found</h1>
          <p className="text-foreground/60 mb-4">The exam results you're looking for don't exist.</p>
          <Link to="/exams" className="text-primary hover:underline">
            ← Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link
            to={results?.courseId ? `/courses/${results.courseId}` : "/exams"}
            className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </Link>
        </div>

        {/* Results Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-lg font-semibold mb-4 ${
            results.passed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {results.passed ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            <span>{results.passed ? 'Passed' : 'Failed'}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">{results.examTitle}</h1>
          <p className="text-foreground/60">{results.courseTitle}</p>
        </div>

        {/* Score Summary */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {results.percentage}%
              </div>
              <div className="text-sm text-foreground/60">Final Score</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {results.totalScore}/{results.totalPoints}
              </div>
              <div className="text-sm text-foreground/60">Points Earned</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {formatTime(results.timeSpent)}
              </div>
              <div className="text-sm text-foreground/60">Time Spent</div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {results.passingScore}%
              </div>
              <div className="text-sm text-foreground/60">Passing Score</div>
            </div>
          </div>
        </div>

        {/* Violations Warning */}
        {results.violations && results.violations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Anti-cheat Violations Detected ({results.violations.length})
                </h3>
                <div className="space-y-1 text-sm text-yellow-700">
                  {results.violations.map((violation, index) => (
                    <div key={index}>
                      • {violation.type.replace('_', ' ').toUpperCase()} at {
                        new Date(violation.timestamp).toLocaleTimeString()
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Results */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Question Results</h2>
          
          {results.answers.map((answer, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-foreground">Question {index + 1}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {answer.points}/{answer.maxPoints} points
                  </span>
                  {answer.needsGrading ? (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Pending Grading
                    </span>
                  ) : answer.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              
              <p className="text-foreground mb-4">{answer.questionText}</p>
              
              {answer.type === 'mcq' && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground/80">Your Answer:</div>
                  <div className={`p-2 rounded border ${
                    answer.isCorrect 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    Option {answer.selectedOption + 1}
                  </div>
                </div>
              )}
              
              {(answer.type === 'short_answer' || answer.type === 'essay') && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground/80">Your Answer:</div>
                  <div className="p-3 bg-muted rounded border">
                    <p className="text-foreground whitespace-pre-wrap">
                      {answer.textAnswer}
                    </p>
                  </div>
                  {answer.needsGrading && (
                    <div className="text-sm text-yellow-700">
                      This answer is being reviewed by your instructor.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="text-center mt-8">
          <Link
            to={results?.courseId ? `/courses/${results.courseId}` : "/exams"}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Course
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
