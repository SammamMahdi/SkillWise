import React, { useState, useEffect } from 'react';
import { Crown, Search, Users, Shield, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import superUserService from '../../services/superUserService';
import toast from 'react-hot-toast';

const SuperUserRoleManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    checkSuperUserStatus();
  }, []);

  useEffect(() => {
    if (isSuperUser) {
      fetchUsers();
    }
  }, [isSuperUser, pagination.page, searchTerm]);

  const checkSuperUserStatus = async () => {
    try {
      const result = await superUserService.checkSuperUser();
      setIsSuperUser(result.isSuperUser);
      
      if (!result.isSuperUser) {
        toast.error('Access denied. SuperUser privileges required.');
      }
    } catch (error) {
      console.error('Error checking superuser status:', error);
      toast.error('Error verifying SuperUser access');
      setIsSuperUser(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await superUserService.getAllUsers(pagination.page, pagination.limit, searchTerm);
      setUsers(result.data.users);
      setPagination(prev => ({
        ...prev,
        total: result.data.pagination.total,
        pages: result.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole, userName) => {
    try {
      setUpdating(userId);
      const result = await superUserService.updateUserRole(userId, newRole);
      
      if (result.success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
        toast.success(`${userName}'s role updated to ${newRole}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Error updating role');
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
      case 'Child': return <Crown className="w-3 h-3" />;
      case 'Student': return <Users className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  if (!isSuperUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-foreground/70 mb-4">
            You don't have SuperUser privileges to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-10 h-10 text-yellow-500" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">SuperUser Control Panel</h1>
              <p className="text-foreground/70 text-lg mt-2">Manage user roles across the platform</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                <strong>SuperUser Access Active:</strong> You have elevated privileges to manage all user roles.
              </p>
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
                    <th className="text-center px-6 py-5 font-semibold text-foreground text-base">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((userData) => (
                    <tr key={userData._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-6">
                        <div>
                          <div className="font-semibold text-foreground text-lg">{userData.name}</div>
                          <div className="text-sm text-foreground/70 mt-1">{userData.email}</div>
                          {userData.username && (
                            <div className="text-sm text-foreground/50 mt-1">@{userData.username}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getRoleColor(userData.role)}`}>
                          {getRoleIcon(userData.role)}
                          {userData.role}
                        </span>
                      </td>
                      
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {userData.emailVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm text-foreground/70">
                              {userData.emailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {userData.isAccountBlocked && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                Blocked
                              </span>
                            )}
                            {userData.isSuperUser && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                SuperUser
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {userData.email === user.email ? (
                          <span className="text-sm text-foreground/50">Cannot change own role</span>
                        ) : (
                          <div className="flex flex-wrap gap-3 justify-center">
                            {['Admin', 'Teacher', 'Child', 'Student'].map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleUpdate(userData._id, role, userData.name)}
                                disabled={updating === userData._id || userData.role === role}
                                className={`min-w-[90px] px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  userData.role === role
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-2 border-primary/20 hover:border-primary hover:shadow-lg transform hover:scale-105'
                                } ${updating === userData._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {updating === userData._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  role
                                )}
                              </button>
                            ))}
                          </div>
                        )}
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
      </div>
    </div>
  );
};

export default SuperUserRoleManagement;
