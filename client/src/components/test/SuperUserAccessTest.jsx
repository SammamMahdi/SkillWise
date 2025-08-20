/**
 * SuperUser Comprehensive Access Test
 * This component verifies that SuperUsers have access to all role-based features
 */

import React, { useState, useEffect } from 'react';
import { Crown, Shield, Users, BookOpen, FileText, CreditCard, MessageSquare, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserPermissions } from '../../utils/permissions';

const SuperUserAccessTest = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (user) {
      setPermissions(getUserPermissions(user));
    }
  }, [user]);

  const testResults = [
    {
      category: 'SuperUser Status',
      icon: <Crown className="w-5 h-5" />,
      tests: [
        { name: 'Is SuperUser', status: permissions.isSuperUser, description: 'Has elevated SuperUser privileges' },
        { name: 'Display Role', status: permissions.displayRole === 'SuperUser', description: `Shows as: ${permissions.displayRole}` }
      ]
    },
    {
      category: 'Admin Access',
      icon: <Shield className="w-5 h-5" />,
      tests: [
        { name: 'Admin Dashboard', status: permissions.hasAdminAccess, description: 'Can access admin dashboard' },
        { name: 'User Management', status: permissions.canManageUsers, description: 'Can manage user accounts' },
        { name: 'Platform Control', status: permissions.hasAdminAccess, description: 'Has platform administration rights' }
      ]
    },
    {
      category: 'Teacher Access',
      icon: <Users className="w-5 h-5" />,
      tests: [
        { name: 'Teacher Dashboard', status: permissions.hasTeacherAccess, description: 'Can access teacher dashboard' },
        { name: 'Course Management', status: permissions.canManageCourses, description: 'Can create and manage courses' },
        { name: 'Exam Management', status: permissions.canManageExams, description: 'Can create and manage exams' },
        { name: 'Internal Features', status: permissions.canSeeInternal, description: 'Can see teacher-only features' }
      ]
    },
    {
      category: 'Child Access',
      icon: <UserCheck className="w-5 h-5" />,
      tests: [
        { name: 'Child Account Detection', status: permissions.isChildAccount, description: 'Can detect child accounts' },
        { name: 'Child Restrictions', status: !permissions.canAccessSkillPosts, description: 'Has child account restrictions' }
      ]
    },
    {
      category: 'Student Access',
      icon: <BookOpen className="w-5 h-5" />,
      tests: [
        { name: 'Student Features', status: permissions.hasStudentAccess, description: 'Has all student capabilities' },
        { name: 'Learning Access', status: permissions.hasStudentAccess, description: 'Can access learning materials' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    return status ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status) => {
    return status ? '✅' : '❌';
  };

  if (!permissions.isSuperUser) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <Crown className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-600">This test is only available for SuperUsers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">SuperUser Access Test</h1>
              <p className="text-foreground/70">Comprehensive permission verification for SuperUser privileges</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                <strong>SuperUser:</strong> {user?.name} ({user?.email}) - Role: {user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {testResults.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-primary">{category.icon}</div>
                <h2 className="text-xl font-semibold text-foreground">{category.category}</h2>
              </div>
              
              <div className="space-y-3">
                {category.tests.map((test, testIndex) => (
                  <div key={testIndex} className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getStatusIcon(test.status)}</span>
                        <div>
                          <h3 className="font-medium">{test.name}</h3>
                          <p className="text-sm opacity-80">{test.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {test.status ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Permission Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(permissions).filter(p => p === true).length}
              </div>
              <div className="text-sm text-green-600">Active Permissions</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">ALL</div>
              <div className="text-sm text-blue-600">Role Access</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">UNLIMITED</div>
              <div className="text-sm text-purple-600">Platform Control</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">SUPER</div>
              <div className="text-sm text-yellow-600">User Status</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-foreground/70 text-sm">
            SuperUser has comprehensive access to all features across Admin, Teacher, Child, and Student roles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperUserAccessTest;
