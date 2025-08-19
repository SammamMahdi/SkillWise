/**
 * SuperUser Permission Utility
 * Provides comprehensive permission checking for SuperUsers
 * SuperUsers have all permissions of Admin, Teacher, Parent, and Student
 */

export const isSuperUser = (user) => {
  return user?.isSuperUser === true;
};

export const hasAdminPermissions = (user) => {
  return user?.role === 'Admin' || isSuperUser(user);
};

export const hasTeacherPermissions = (user) => {
  return user?.role === 'Teacher' || hasAdminPermissions(user);
};

export const hasParentPermissions = (user) => {
  return user?.role === 'Parent' || isSuperUser(user);
};

export const hasStudentPermissions = (user) => {
  return user?.role === 'Student' || isSuperUser(user);
};

// Specific permission checks for common use cases
export const canManageCourses = (user) => {
  return hasTeacherPermissions(user);
};

export const canManageExams = (user) => {
  return hasTeacherPermissions(user);
};

export const canSeeInternal = (user) => {
  return hasTeacherPermissions(user);
};

export const canManageUsers = (user) => {
  return hasAdminPermissions(user);
};

export const canEditCourse = (user, teacherId) => {
  if (isSuperUser(user)) return true;
  if (hasAdminPermissions(user)) return true;
  return user?.id === teacherId;
};

export const isOwner = (user, teacherId) => {
  if (isSuperUser(user)) return true;
  if (hasAdminPermissions(user)) return true;
  return user?.id === teacherId;
};

export const canMonitorChildren = (user) => {
  return hasParentPermissions(user);
};

// Get display role for SuperUsers
export const getDisplayRole = (user) => {
  if (isSuperUser(user)) {
    return 'SuperUser';
  }
  return user?.role || 'Student';
};

// Get all available permissions for a user
export const getUserPermissions = (user) => {
  const permissions = {
    isSuperUser: isSuperUser(user),
    hasAdminAccess: hasAdminPermissions(user),
    hasTeacherAccess: hasTeacherPermissions(user),
    hasParentAccess: hasParentPermissions(user),
    hasStudentAccess: hasStudentPermissions(user),
    canManageCourses: canManageCourses(user),
    canManageExams: canManageExams(user),
    canSeeInternal: canSeeInternal(user),
    canManageUsers: canManageUsers(user),
    canMonitorChildren: canMonitorChildren(user),
    displayRole: getDisplayRole(user)
  };
  
  return permissions;
};

export default {
  isSuperUser,
  hasAdminPermissions,
  hasTeacherPermissions,
  hasParentPermissions,
  hasStudentPermissions,
  canManageCourses,
  canManageExams,
  canSeeInternal,
  canManageUsers,
  canEditCourse,
  isOwner,
  canMonitorChildren,
  getDisplayRole,
  getUserPermissions
};
