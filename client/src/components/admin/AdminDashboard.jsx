import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BookOpen,
  FileText,
  ClipboardCheck,
  RotateCcw,
  CreditCard,
  Book,
  Search,
  Loader2
} from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState('');
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [pendingReAttempts, setPendingReAttempts] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchPendingSubmissions();
    fetchPendingReAttempts();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.data.user);
        console.log('Current user:', data.data.user); // Debug log
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        if (data.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.data.pagination.total,
            pages: data.data.pagination.pages
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSubmissions = async () => {
    try {
      const response = await fetch('/api/exams/attempts/pending-review', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingSubmissions(data.data.length || 0);
      }
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      setPendingSubmissions(0);
    }
  };

  const fetchPendingReAttempts = async () => {
    try {
      const response = await fetch('/api/exams/re-attempt-requests?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingReAttempts(data.data.requests?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending re-attempts:', error);
    }
  };



  const updateUserRole = async (userId, newRole) => {
    try {
      setUpdating(userId);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const toggleUserBlock = async (userId, isBlocked, reason = '') => {
    try {
      setIsBlocking(true);
      setBlockError('');

      console.log('Sending request:', { userId, isBlocked, reason }); // Debug log

      // Prepare the request body - only include reason if it's not empty
      const requestBody = { isBlocked };
      if (reason && reason.trim().length > 0) {
        requestBody.reason = reason.trim();
      }

      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status); // Debug log

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (data.success) {
        fetchUsers();
        setShowBlockModal(false);
        setBlockReason('');
        setBlockError('');
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg).join(', ');
          setBlockError(`Validation error: ${errorMessages}`);
        } else {
          setBlockError(data.message || 'Failed to update user block status');
        }
      }
    } catch (error) {
      console.error('Error toggling user block:', error);
      setBlockError(`Network error: ${error.message}`);
    } finally {
      setIsBlocking(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'Teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Child': return 'bg-green-100 text-green-800 border-green-200';
      case 'Student': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Shield className="w-3 h-3" />;
      case 'Teacher': return <Users className="w-3 h-3" />;
      case 'Child': return <UserCheck className="w-3 h-3" />;
      case 'Student': return <Users className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  const getStatusColor = (isBlocked) => {
    return isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const canUnblockUser = (user) => {
    if (!user.isAccountBlocked) return true;
    if (user.role !== 'Student') return true;

    const age = user.age || calculateAge(user.dateOfBirth);
    if (age >= 13) return true;

    // For children under 13, they need parent approval
    return user.parentConfirmed && user.parent;
  };

  const getUnblockRestrictionMessage = (user) => {
    if (canUnblockUser(user)) return null;

    const age = user.age || calculateAge(user.dateOfBirth);
    if (age < 13) {
      if (!user.parent) {
        return 'Cannot unblock: Student under 13 with no parent connection';
      }
      if (!user.parentConfirmed) {
        return 'Cannot unblock: Student under 13 without parent approval';
      }
    }
    return null;
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-foreground/80">Manage users, roles, and platform settings</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <DashboardButton />
              <ThemeToggle size="md" />
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <a
              href="/exams"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>My Exams</span>
            </a>

            <a
              href="/admin/submissions/review"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 relative"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Review Submissions</span>
              {pendingSubmissions > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingSubmissions}
                </span>
              )}
            </a>
            <a
              href="/admin/re-attempt-requests"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 relative"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-attempt Requests</span>
              {pendingReAttempts > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingReAttempts}
                </span>
              )}
            </a>
            <a
              href="/courses"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>My Courses</span>
            </a>
            <a
              href="/admin/approve-teachers"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Approve Teachers</span>
            </a>
            {currentUser?.email === 'husnainfarhan@gmail.com' && (
              <a
                href="/admin/payment-codes"
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Codes</span>
              </a>
            )}
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mt-2">
                Debug: User email: {currentUser?.email || 'Not loaded'}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.students || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Teachers</p>
                <p className="text-2xl font-bold text-foreground">{stats.teachers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Child Accounts</p>
                <p className="text-2xl font-bold text-foreground">{stats.children || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Blocked Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.blockedUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/60">Pending Submission Reviews</p>
                <p className="text-2xl font-bold text-foreground">{pendingSubmissions}</p>
              </div>
            </div>
          </div>

          
        </div>

        {/* Search and Stats */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-foreground/70">
              <span>Total Users: {pagination.total}</span>
              <span>Page {pagination.page} of {pagination.pages}</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden max-w-6xl mx-auto shadow-lg">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">User Management</h2>
            <p className="text-foreground/70 text-sm mt-1">Manage user roles and account status</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-foreground/70">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/70">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-5 font-semibold text-foreground text-base">User Information</th>
                    <th className="text-left px-6 py-5 font-semibold text-foreground text-base">Current Role</th>
                    <th className="text-left px-6 py-5 font-semibold text-foreground text-base">Account Status</th>
                    <th className="text-left px-6 py-5 font-semibold text-foreground text-base">Age & Parent</th>
                    <th className="text-center px-6 py-5 font-semibold text-foreground text-base">Change Role</th>
                    <th className="text-center px-6 py-5 font-semibold text-foreground text-base">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.name}&background=7C3AED&color=fff`}
                              alt={user.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-foreground text-lg">{user.name}</div>
                            <div className="text-sm text-foreground/70 mt-1">{user.email}</div>
                            {user.username && (
                              <div className="text-sm text-foreground/50 mt-1">@{user.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role || 'Not Set'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {!user.isAccountBlocked ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm text-foreground/70">
                              {user.isAccountBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {user.isAccountBlocked && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                Blocked
                              </span>
                            )}
                            {user.emailVerified && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-6">
                        <div className="text-sm text-foreground">
                          <div className="mb-1">Age: {user.age || 'N/A'}</div>
                          {user.parent ? (
                            <div>
                              <div className="font-medium text-foreground/80">{user.parent.name}</div>
                              {user.role === 'Student' && (user.age < 13 || calculateAge(user.dateOfBirth) < 13) && (
                                <div className={`text-xs ${user.parentConfirmed ? 'text-green-600' : 'text-orange-600'}`}>
                                  {user.parentConfirmed ? '✓ Approved' : '⚠ Pending'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-foreground/50">No Parent</span>
                          )}
                          {user.role === 'Student' && (user.age < 13 || calculateAge(user.dateOfBirth) < 13) && (
                            <div className="flex items-center mt-1">
                              <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />
                              <span className="text-orange-600 text-xs">Under 13</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {currentUser && user.email === currentUser.email ? (
                          <span className="text-sm text-foreground/50">Cannot change own role</span>
                        ) : (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {['Teacher', 'Student', 'Child'].map((role) => (
                              <button
                                key={role}
                                onClick={() => updateUserRole(user._id, role)}
                                disabled={updating === user._id || user.role === role}
                                className={`min-w-[80px] px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  user.role === role
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-2 border-primary/20 hover:border-primary hover:shadow-lg transform hover:scale-105'
                                } ${updating === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {updating === user._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  role
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBlockModal(true);
                            }}
                            disabled={user.isAccountBlocked && !canUnblockUser(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isAccountBlocked && !canUnblockUser(user)
                                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                : user.isAccountBlocked
                                  ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                                  : "text-red-600 hover:text-red-800 hover:bg-red-50"
                            }`}
                            title={
                              user.isAccountBlocked && !canUnblockUser(user)
                                ? getUnblockRestrictionMessage(user)
                                : user.isAccountBlocked
                                  ? "Unblock user"
                                  : "Block user"
                            }
                          >
                            {user.isAccountBlocked ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-3">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      pagination.page === page
                        ? 'bg-primary text-white'
                        : 'bg-background border border-border hover:bg-muted'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 text-sm bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Block User Modal */}
        {showBlockModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {selectedUser.isAccountBlocked ? 'Unblock User' : 'Block User'}
              </h3>
              <div className="space-y-4">
                <div className="bg-background/50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-foreground mb-1">
                    User: {selectedUser.name}
                  </div>
                  <div className="text-sm text-foreground/70 mb-1">
                    Role: {selectedUser.role} | Age: {selectedUser.age || 'N/A'}
                  </div>
                  <div className="text-sm text-foreground/70 mb-1">
                    Current Status: {selectedUser.isAccountBlocked ? 'Blocked' : 'Active'}
                  </div>
                  {selectedUser.isAccountBlocked && selectedUser.blockedReason && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                      <strong>Blocked Reason:</strong> {selectedUser.blockedReason}
                    </div>
                  )}
                  {selectedUser.parent && (
                    <div className="text-sm text-foreground/70">
                      Parent: {selectedUser.parent.name}
                      {selectedUser.role === 'Student' && (selectedUser.age < 13 || calculateAge(selectedUser.dateOfBirth) < 13) && (
                        <span className={`ml-2 ${selectedUser.parentConfirmed ? 'text-green-600' : 'text-orange-600'}`}>
                          ({selectedUser.parentConfirmed ? 'Approved' : 'Pending Approval'})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Show restriction warning for unblocking */}
                {selectedUser.isAccountBlocked && !canUnblockUser(selectedUser) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <div className="text-sm text-red-800">
                        <div className="font-medium">Cannot Unblock User</div>
                        <div>{getUnblockRestrictionMessage(selectedUser)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show error message if any */}
                {blockError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <div className="text-sm text-red-800">{blockError}</div>
                    </div>
                  </div>
                )}

                {!selectedUser.isAccountBlocked && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reason for Blocking
                    </label>
                    <textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      rows="3"
                      placeholder="Enter reason for blocking..."
                    />
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowBlockModal(false);
                      setBlockReason('');
                      setBlockError('');
                    }}
                    className="flex-1 px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-background/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => toggleUserBlock(selectedUser._id, !selectedUser.isAccountBlocked, blockReason)}
                    disabled={isBlocking || (selectedUser.isAccountBlocked && !canUnblockUser(selectedUser))}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      selectedUser.isAccountBlocked && !canUnblockUser(selectedUser)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : selectedUser.isAccountBlocked
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {isBlocking ? 'Processing...' : (selectedUser.isAccountBlocked ? 'Unblock' : 'Block')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 