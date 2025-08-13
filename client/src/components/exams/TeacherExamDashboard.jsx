import React, { useState, useEffect } from 'react';
import { Eye, Edit, Send, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import examService from '../../services/examService';
import { useAuth } from '../../contexts/AuthContext';

const TeacherExamDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchExams();
  }, [filter]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      let filters = {};

      if (filter !== 'all') {
        if (filter === 'published') {
          // For published filter, we want exams that are approved AND published
          filters = { status: 'approved', isPublished: true };
        } else {
          // For other filters, just filter by status
          filters = { status: filter };
        }
      }

      const response = await examService.getTeacherExams(filters);
      setExams(response.data.exams);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (examId) => {
    if (!confirm('Are you sure you want to submit this exam for admin review?')) return;

    try {
      await examService.submitForReview(examId);
      toast.success('Exam submitted for review');
      fetchExams();
    } catch (error) {
      toast.error(error.message || 'Failed to submit exam for review');
    }
  };

  const handlePublishExam = async (examId) => {
    if (!confirm('Are you sure you want to publish this exam? Students will be able to take it.')) return;

    try {
      await examService.publishExam(examId);
      toast.success('Exam published successfully');
      fetchExams();
    } catch (error) {
      toast.error(error.message || 'Failed to publish exam');
    }
  };

  const getStatusBadge = (status, isPublished) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      pending_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', text: isPublished ? 'Published' : 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      archived: { color: 'bg-gray-100 text-gray-600', text: 'Archived' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
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
        {getStatusBadge(exam.status, exam.isPublished)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-foreground/60" />
          <span>{exam.timeLimit}m</span>
        </div>
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-foreground/60" />
          <span>{exam.questions?.length || 0} questions</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-foreground/60" />
          <span>{exam.totalAttempts || 0} attempts</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-foreground/60" />
          <span>{exam.passRate || 0}% pass rate</span>
        </div>
      </div>

      {exam.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            <strong>Rejection Reason:</strong> {exam.rejectionReason}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Link
            to={`/exams/${exam._id}/edit`}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Edit
          </Link>
          <Link
            to={`/exams/${exam._id}/results`}
            className="text-foreground/60 hover:text-foreground text-sm font-medium"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Results
          </Link>
        </div>

        <div className="flex space-x-2">
          {/* Only admins can publish approved exams */}
          {exam.status === 'approved' && !exam.isPublished && user?.role === 'Admin' && (
            <button
              onClick={() => handlePublishExam(exam._id)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Publish
            </button>
          )}

          {/* Show status information for teachers */}
          {user?.role === 'Teacher' && (
            <div className="flex items-center space-x-2 text-sm">
              {exam.status === 'pending_review' && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  Pending Admin Review
                </span>
              )}
              {exam.status === 'approved' && !exam.isPublished && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Approved - Awaiting Publication
                </span>
              )}
              {exam.status === 'approved' && exam.isPublished && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Published
                </span>
              )}
              {exam.status === 'rejected' && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  Rejected
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Exams</h1>
            <p className="text-foreground/60">
              Manage exams for courses you created. Create exams from individual course pages. All exams are automatically submitted for admin review and will be published once approved.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Exams' },
            { id: 'pending_review', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'published', label: 'Published' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Exams Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No exams found</h3>
            <p className="text-foreground/60 mb-6">
              {filter === 'all'
                ? "You haven't created any exams yet. Go to your course pages and click 'Create Exam' to get started."
                : `No exams with status "${filter}" found.`
              }
            </p>
            {filter === 'all' && (
              <Link
                to="/courses"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View My Courses</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {exams.map(exam => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherExamDashboard;
