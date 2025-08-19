import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Plus,
  Search,
  Eye,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Lock
} from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allPendingRequests, setAllPendingRequests] = useState({ pendingChildRequests: [], pendingParentRequests: [] });
  const [loading, setLoading] = useState(true);

  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildProgress, setShowChildProgress] = useState(false);
  const [childProgress, setChildProgress] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    fetchChildren();
    fetchPendingRequests();
    fetchPendingApprovals();
    fetchAllPendingRequests();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/parent/children', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setChildren(data.data.children);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/parent/all-pending-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.data.pendingParentRequests);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/parent/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.data.pendingChildren);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchAllPendingRequests = async () => {
    try {
      const response = await fetch('/api/parent/all-pending-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllPendingRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching all pending requests:', error);
    }
  };

  const acceptParentRequest = async (parentId) => {
    try {
      const response = await fetch('/api/parent/accept-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ parentId })
      });
      const data = await response.json();
      if (data.success) {
        fetchPendingRequests();
        fetchAllPendingRequests();
      }
    } catch (error) {
      console.error('Error accepting parent request:', error);
    }
  };

  const rejectParentRequest = async (parentId) => {
    try {
      const response = await fetch('/api/parent/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ parentId })
      });
      const data = await response.json();
      if (data.success) {
        fetchPendingRequests();
        fetchAllPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting parent request:', error);
    }
  };

  const acceptChildRequest = async (childId) => {
    try {
      const response = await fetch('/api/parent/accept-child-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ childId })
      });
      const data = await response.json();
      if (data.success) {
        fetchChildren();
        fetchAllPendingRequests();
      }
    } catch (error) {
      console.error('Error accepting child request:', error);
    }
  };

  const rejectChildRequest = async (childId) => {
    try {
      const response = await fetch('/api/parent/reject-child-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ childId })
      });
      const data = await response.json();
      if (data.success) {
        fetchAllPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting child request:', error);
    }
  };

  const approveChildAccount = async (childId) => {
    try {
      setIsApproving(true);
      const response = await fetch(`/api/parent/approve-child/${childId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Refresh the lists
        fetchChildren();
        fetchPendingApprovals();
      }
    } catch (error) {
      console.error('Error approving child account:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const removeChildConnection = async (childId) => {
    try {
      const response = await fetch(`/api/parent/children/${childId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchChildren();
      }
    } catch (error) {
      console.error('Error removing child connection:', error);
    }
  };

  const fetchChildProgress = async (childId) => {
    try {
      const response = await fetch(`/api/parent/children/${childId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setChildProgress(data.data);
        setShowChildProgress(true);
      }
    } catch (error) {
      console.error('Error fetching child progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Parent Dashboard</h1>
              <p className="text-foreground/80">Monitor your children's learning progress</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <DashboardButton />
              <ThemeToggle size="md" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Connected Children</p>
                <p className="text-2xl font-bold text-foreground">{children.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Pending Approvals</p>
                <p className="text-2xl font-bold text-foreground">{pendingApprovals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Total Progress</p>
                <p className="text-2xl font-bold text-foreground">
                  {children.reduce((total, child) => total + (child.dashboardData?.enrolledCourses?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Child Requests (Children who want to connect to this parent) */}
        {allPendingRequests.pendingChildRequests.length > 0 && (
          <div className="bg-card border border-border rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Pending Child Requests</span>
              </h2>
              <p className="text-sm text-foreground/60 mt-1">Children who want to connect to your account</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {allPendingRequests.pendingChildRequests.map((child) => (
                  <div key={child._id} className="flex items-center justify-between p-4 bg-blue-50/10 border border-blue-200/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{child.name}</p>
                        <p className="text-sm text-foreground/60">{child.email}</p>
                        <p className="text-xs text-foreground/40">Age: {child.age || 'N/A'} • Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptChildRequest(child._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => rejectChildRequest(child._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Parent Requests (Other parents who want to connect) */}
        {allPendingRequests.pendingParentRequests.length > 0 && (
          <div className="bg-card border border-border rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Pending Parent Requests</span>
              </h2>
              <p className="text-sm text-foreground/60 mt-1">Other parents who want to connect to your children</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {allPendingRequests.pendingParentRequests.map((parent) => (
                  <div key={parent._id} className="flex items-center justify-between p-4 bg-purple-50/10 border border-purple-200/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{parent.name}</p>
                        <p className="text-sm text-foreground/60">{parent.email}</p>
                        <p className="text-xs text-foreground/40">Wants to connect to your children</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptParentRequest(parent._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => rejectParentRequest(parent._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Child Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="bg-card border border-border rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-600" />
                <span>Pending Child Approvals</span>
              </h2>
              <p className="text-sm text-foreground/60 mt-1">Children who need your approval to access the platform</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pendingApprovals.map((child) => (
                  <div key={child._id} className="flex items-center justify-between p-4 bg-red-50/10 border border-red-200/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Lock className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{child.name}</p>
                        <p className="text-sm text-foreground/60">{child.email}</p>
                        <p className="text-xs text-foreground/40">Age: {child.age || 'N/A'} • Account blocked</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveChildAccount(child._id)}
                        disabled={isApproving}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isApproving ? 'Approving...' : 'Approve'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-card border border-border rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Pending Parent Requests</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pendingRequests.map((parent) => (
                  <div key={parent._id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={parent.profilePhoto || `https://ui-avatars.com/api/?name=${parent.name}&background=7C3AED&color=fff`}
                        alt={parent.name}
                      />
                      <div>
                        <p className="font-medium text-foreground">{parent.name}</p>
                        <p className="text-sm text-foreground/60">{parent.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptParentRequest(parent._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => rejectParentRequest(parent._id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Connected Children */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Connected Children</h2>
          </div>
          <div className="p-6">
            {children.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                <p className="text-foreground/60">No children connected yet</p>
                <p className="text-sm text-foreground/40 mt-2">Add a child account to start monitoring their progress</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                  <div key={child._id} className="bg-background/50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          className="h-12 w-12 rounded-full"
                          src={child.profilePhoto || `https://ui-avatars.com/api/?name=${child.name}&background=7C3AED&color=fff`}
                          alt={child.name}
                        />
                        <div>
                          <p className="font-medium text-foreground">{child.name}</p>
                          <p className="text-sm text-foreground/60">Age: {child.age || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeChildConnection(child._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/60">XP Points:</span>
                        <span className="font-medium text-foreground">{child.xp || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/60">Enrolled Courses:</span>
                        <span className="font-medium text-foreground">{child.dashboardData?.enrolledCourses?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/60">Completed Courses:</span>
                        <span className="font-medium text-foreground">{child.dashboardData?.certificates?.length || 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchChildProgress(child._id)}
                      className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Progress</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Child Progress Modal */}
        {showChildProgress && childProgress && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {childProgress.child.name}'s Learning Progress
                </h3>
                <button
                  onClick={() => setShowChildProgress(false)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-foreground">Total Courses</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{childProgress.stats.totalCourses}</p>
                </div>

                <div className="bg-background/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-foreground">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{childProgress.stats.completedCourses}</p>
                </div>

                <div className="bg-background/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-foreground">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{childProgress.stats.completionRate}%</p>
                </div>
              </div>

              {childProgress.enrolledCourses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Enrolled Courses</h4>
                  <div className="space-y-3">
                    {childProgress.enrolledCourses.map((enrollment, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-foreground">{enrollment.course?.title || 'Course'}</p>
                            <p className="text-sm text-foreground/60">
                              Progress: {enrollment.currentLectureIndex + 1} / {enrollment.course?.lectures?.length || 0} lectures
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-foreground/60">Completed Lectures</p>
                            <p className="font-medium text-foreground">{enrollment.completedLectures.length}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {childProgress.certificates.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-4">Completed Courses</h4>
                  <div className="space-y-3">
                    {childProgress.certificates.map((certificate, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Award className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-foreground">{certificate.course?.title || 'Course'}</p>
                            <p className="text-sm text-foreground/60">
                              Completed: {new Date(certificate.issueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard; 