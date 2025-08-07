# Feature Testing Guide

## Admin Management Testing

### 1. Admin Dashboard Access
- [ ] Login as an admin user
- [ ] Navigate to `/admin` route
- [ ] Verify admin dashboard loads with user statistics
- [ ] Check that non-admin users cannot access admin dashboard

### 2. User Role Management
- [ ] In admin dashboard, click edit role for any user
- [ ] Change user role from Student to Teacher
- [ ] Verify role change is saved
- [ ] Test changing to all available roles (Admin, Student, Teacher, Parent)

### 3. Account Blocking
- [ ] In admin dashboard, click block user
- [ ] Enter a reason for blocking
- [ ] Verify user account is blocked
- [ ] Test unblocking the same user
- [ ] Verify blocked user sees blocked account screen

## Parent Mode Testing

### 1. Parent Dashboard Access
- [ ] Login as a parent user
- [ ] Navigate to `/parent` route
- [ ] Verify parent dashboard loads
- [ ] Check that non-parent users cannot access parent dashboard

### 2. Child Connection
- [ ] In parent dashboard, click "Add Child Account"
- [ ] Enter child's email address
- [ ] Send connection request
- [ ] Verify request is sent successfully

### 3. Child Progress Monitoring
- [ ] Connect to a child account
- [ ] View child's learning progress
- [ ] Verify progress data is displayed correctly
- [ ] Test removing child connection

## Parental Approval System Testing

### 1. Under-13 Registration
- [ ] Register a new user with age under 13
- [ ] Verify account is automatically blocked
- [ ] Check that blocked account screen is shown
- [ ] Verify date of birth calculation works correctly

### 2. Parent Request Flow
- [ ] From blocked account, enter parent email
- [ ] Send parent request
- [ ] Verify request is sent
- [ ] Check parent receives notification

### 3. Parent Approval Process
- [ ] Parent receives connection request
- [ ] Parent accepts connection
- [ ] Verify child account is unblocked
- [ ] Test child can now access platform

## Notification System Testing

### 1. Notification Center
- [ ] Login as any user
- [ ] Check notification bell in header
- [ ] Verify unread count displays correctly
- [ ] Test marking notifications as read

### 2. Notification Types
- [ ] Test parent request notifications
- [ ] Test child approval notifications
- [ ] Test account blocked/unblocked notifications
- [ ] Verify notification filtering works

## Security Testing

### 1. Role-based Access
- [ ] Test admin-only routes
- [ ] Test parent-only routes
- [ ] Verify unauthorized access is blocked
- [ ] Check proper error messages

### 2. Account Blocking
- [ ] Test blocked users cannot access platform
- [ ] Verify proper blocked account screen
- [ ] Test unblocking process
- [ ] Check notification system for blocks

## API Testing

### 1. Admin Endpoints
```bash
# Get all users (Admin only)
GET /api/admin/users

# Update user role
PUT /api/admin/users/:userId/role

# Block/unblock user
PUT /api/admin/users/:userId/block

# Get admin stats
GET /api/admin/stats
```

### 2. Parent Endpoints
```bash
# Request child connection
POST /api/parent/request-child

# Accept parent request
POST /api/parent/accept-request

# Get child accounts
GET /api/parent/children

# Get child progress
GET /api/parent/children/:childId/progress
```

### 3. Notification Endpoints
```bash
# Get notifications
GET /api/notifications

# Mark as read
PUT /api/notifications/:notificationId/read

# Get notification count
GET /api/notifications/count
```

## Database Schema Verification

### 1. User Model Updates
- [ ] Verify `dateOfBirth` field exists
- [ ] Check `isAccountBlocked` field
- [ ] Verify `blockedReason` field
- [ ] Test `pendingParentRequests` and `pendingChildRequests` arrays

### 2. Notification Model
- [ ] Verify notification schema is correct
- [ ] Test notification creation
- [ ] Check notification types
- [ ] Verify notification relationships

## Frontend Testing

### 1. Signup Form
- [ ] Test date of birth field
- [ ] Verify age calculation
- [ ] Check parental approval checkbox
- [ ] Test form validation

### 2. Dashboard Components
- [ ] Test admin dashboard
- [ ] Test parent dashboard
- [ ] Verify blocked account component
- [ ] Check notification center

### 3. Routing
- [ ] Test admin route protection
- [ ] Test parent route protection
- [ ] Verify blocked account routing
- [ ] Check navigation between components

## Error Handling

### 1. API Errors
- [ ] Test invalid role updates
- [ ] Test unauthorized access
- [ ] Verify proper error messages
- [ ] Check error logging

### 2. Frontend Errors
- [ ] Test network errors
- [ ] Verify error boundaries
- [ ] Check user-friendly error messages
- [ ] Test error recovery

## Performance Testing

### 1. Database Queries
- [ ] Test user listing performance
- [ ] Verify notification queries
- [ ] Check parent-child relationship queries
- [ ] Test large dataset handling

### 2. Frontend Performance
- [ ] Test dashboard loading
- [ ] Verify notification updates
- [ ] Check component rendering
- [ ] Test memory usage

## Security Testing

### 1. Authentication
- [ ] Test JWT token validation
- [ ] Verify role-based authorization
- [ ] Check session management
- [ ] Test token refresh

### 2. Data Protection
- [ ] Verify sensitive data encryption
- [ ] Test input validation
- [ ] Check SQL injection prevention
- [ ] Test XSS protection

## Integration Testing

### 1. End-to-End Flows
- [ ] Test complete parent-child connection flow
- [ ] Verify admin user management flow
- [ ] Test notification system integration
- [ ] Check blocked account resolution

### 2. Cross-Component Testing
- [ ] Test notification updates across components
- [ ] Verify state management
- [ ] Check component communication
- [ ] Test data consistency

## Browser Testing

### 1. Cross-Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

### 2. Responsive Design
- [ ] Test on desktop
- [ ] Test on tablet
- [ ] Test on mobile
- [ ] Verify responsive layouts

## Accessibility Testing

### 1. Screen Reader Support
- [ ] Test with screen readers
- [ ] Verify ARIA labels
- [ ] Check keyboard navigation
- [ ] Test focus management

### 2. Color Contrast
- [ ] Verify color contrast ratios
- [ ] Test color blind accessibility
- [ ] Check high contrast mode
- [ ] Test dark/light themes 