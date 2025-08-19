import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Download, 
  User, 
  GraduationCap, 
  Briefcase, 
  BookOpen, 
  Heart,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import teacherApplicationService from '../../services/teacherApplicationService';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const ApproveTeacherPage = () => {
  const { theme } = useTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalApplications: 0
  });

  useEffect(() => {
    fetchApplications();
  }, [filters, pagination.page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined
      };

      const response = await teacherApplicationService.getAllApplications(params);
      setApplications(response.data.applications);
      setPagination({
        ...pagination,
        totalPages: response.data.totalPages,
        totalApplications: response.data.totalApplications
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleReviewApplication = async (applicationId, action, comments = '') => {
    setProcessingAction(action);
    try {
      await teacherApplicationService.reviewApplication(applicationId, action, comments);
      
      toast.success(`Application ${action}ed successfully`);
      fetchApplications();
      setShowModal(false);
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error(error.response?.data?.message || `Error ${action}ing application`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDownloadDocument = async (applicationId, documentType) => {
    try {
      const response = await teacherApplicationService.downloadDocument(applicationId, documentType);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}_${applicationId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error downloading document');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const ApplicationModal = () => {
    if (!selectedApplication) return null;

    const { 
      personalDetails, 
      qualifications, 
      experience, 
      specializations, 
      motivation,
      portfolioLinks,
      documents
    } = selectedApplication;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
          theme === 'dark' 
            ? 'bg-gray-900 border border-white/20' 
            : 'bg-white'
        }`}>
          <div className={`p-6 border-b sticky top-0 ${
            theme === 'dark'
              ? 'border-white/20 bg-gray-900'
              : 'border-gray-200 bg-white'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {personalDetails.fullName}
                </h2>
                <p className={`${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>{personalDetails.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.applicationStatus)}`}>
                  {getStatusIcon(selectedApplication.applicationStatus)}
                  <span className="ml-1 capitalize">{selectedApplication.applicationStatus}</span>
                </span>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Personal Details */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Personal Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <span className={`${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>{personalDetails.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <span className={`${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>{personalDetails.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <span className={`${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Born: {new Date(personalDetails.dateOfBirth).toLocaleDateString()}</span>
                </div>
                {personalDetails.address.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                    <span className={`${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {personalDetails.address.city}, {personalDetails.address.state}, {personalDetails.address.country}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Qualifications */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Qualifications</h3>
              </div>
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>Highest Degree:</span>
                    <div className={`${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    } capitalize`}>{qualifications.highestDegree.replace('-', ' ')}</div>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>Field of Study:</span>
                    <div className={`${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>{qualifications.fieldOfStudy}</div>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>University:</span>
                    <div className={`${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>{qualifications.university}</div>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>Graduation Year:</span>
                    <div className={`${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>{qualifications.graduationYear}</div>
                  </div>
                  {qualifications.gpa && (
                    <div>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                      }`}>GPA:</span>
                      <div className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                      }`}>{qualifications.gpa}</div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Experience */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Experience</h3>
              </div>
              <div className="space-y-4">
                <div className={`rounded-lg p-4 ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    Years of Experience: {experience.yearsOfExperience}
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>Teaching Experience:</span>
                    <p className={`mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>{experience.teachingExperience}</p>
                  </div>
                </div>
                
                {experience.previousPositions.length > 0 && (
                  <div>
                    <h4 className={`font-medium mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>Previous Positions</h4>
                    {experience.previousPositions.map((position, index) => (
                      <div key={index} className={`rounded-lg p-4 mb-3 ${
                        theme === 'dark' ? 'border border-white/20 bg-white/5' : 'border border-gray-200 bg-white'
                      }`}>
                        <div className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                        }`}>{position.title}</div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{position.institution}</div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{position.duration}</div>
                        {position.description && (
                          <p className={`text-sm mt-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                          }`}>{position.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Specializations */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Specializations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specializations.map((spec, index) => (
                  <div key={index} className={`rounded-lg p-4 ${
                    theme === 'dark' ? 'border border-white/20 bg-white/5' : 'border border-gray-200 bg-white'
                  }`}>
                    <div className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>{spec.subject}</div>
                    <div className={`text-sm capitalize ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {spec.proficiencyLevel} Level
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {spec.yearsOfExperience} years experience
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Motivation */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-600" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Motivation</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>Why teach?</h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>{motivation.whyTeach}</p>
                </div>
                <div>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>Teaching Goals</h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>{motivation.goals}</p>
                </div>
                <div>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>Contribution to SkillWise</h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>{motivation.contribution}</p>
                </div>
              </div>
            </section>

            {/* Portfolio Links */}
            {portfolioLinks && portfolioLinks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Portfolio Links</h3>
                </div>
                <div className="space-y-3">
                  {portfolioLinks.map((link, index) => (
                    <div key={index} className={`rounded-lg p-4 ${
                      theme === 'dark' ? 'border border-white/20 bg-white/5' : 'border border-gray-200 bg-white'
                    }`}>
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                      }`}>{link.title}</div>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {link.url}
                      </a>
                      {link.description && (
                        <p className={`text-sm mt-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                        }`}>{link.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Documents</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documents.resume && (
                  <button
                    onClick={() => handleDownloadDocument(selectedApplication._id, 'resume')}
                    className={`flex items-center gap-2 p-4 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300' 
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                )}
                {documents.identityDocument && (
                  <button
                    onClick={() => handleDownloadDocument(selectedApplication._id, 'identityDocument')}
                    className={`flex items-center gap-2 p-4 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300' 
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>ID Document</span>
                  </button>
                )}
                {documents.certificates && documents.certificates.length > 0 && (
                  <button
                    onClick={() => handleDownloadDocument(selectedApplication._id, 'certificates')}
                    className={`flex items-center gap-2 p-4 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300' 
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Certificates ({documents.certificates.length})</span>
                  </button>
                )}
              </div>
            </section>

            {/* Admin Actions */}
            {selectedApplication.applicationStatus === 'pending' && (
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Admin Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReviewApplication(selectedApplication._id, 'approve')}
                    disabled={processingAction === 'approve'}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {processingAction === 'approve' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve Application
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReviewApplication(selectedApplication._id, 'reject')}
                    disabled={processingAction === 'reject'}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {processingAction === 'reject' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject Application
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Teacher Applications</h1>
              <p className="text-foreground/70">Review and approve teacher applications</p>
            </div>
            <button
              onClick={fetchApplications}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-foreground/40" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Applications Found</h3>
            <p className="text-foreground/60">No teacher applications match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application._id}
                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {application.personalDetails.fullName}
                      </h3>
                      <p className="text-foreground/60">{application.personalDetails.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-foreground/50">
                        <span>{application.qualifications.highestDegree.replace('-', ' ')}</span>
                        <span>•</span>
                        <span>{application.experience.yearsOfExperience} years experience</span>
                        <span>•</span>
                        <span>{application.specializations.length} specializations</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.applicationStatus)}`}>
                      {getStatusIcon(application.applicationStatus)}
                      <span className="ml-1 capitalize">{application.applicationStatus}</span>
                    </span>
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-foreground/60">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalApplications)} of {pagination.totalApplications} applications
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <ApplicationModal />}
    </div>
  );
};

export default ApproveTeacherPage;
