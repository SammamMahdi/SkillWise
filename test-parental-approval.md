# Parental Approval System Test Guide

## Overview
This guide tests the enhanced parental approval system where **student accounts under 13** remain blocked until parent approval.

## Test Scenarios

### 1. Student Under-13 Registration and Blocking
1. Register a new **student** user with age under 13
2. Verify parent email field appears and is required
3. Enter parent's email address
4. Complete registration
5. Verify account is automatically blocked
6. Check that blocked account screen is shown
7. Verify `requiresParentalApproval` is set to true
8. Verify `isAccountBlocked` is set to true
9. Verify parent request is automatically sent

### 2. Non-Student Under-13 Registration (Should Not Block)
1. Register a new **parent/teacher/admin** user with age under 13
2. Verify parent email field does NOT appear
3. Verify account is NOT blocked
4. Verify `requiresParentalApproval` is set to false
5. Verify `isAccountBlocked` is set to false

### 3. Parent Request Flow
1. From blocked student account, enter parent email
2. Send parent request
3. Verify request is sent successfully
4. Check parent receives notification
5. Verify student account remains blocked

### 4. Parent Approval Process
1. Parent logs in and navigates to Parent Dashboard
2. Verify pending student approvals are shown
3. Parent approves student account
4. Verify student account is unblocked
5. Test student can now access platform
6. Verify notification is sent to student

### 5. Account Blocking Persistence
1. Create **student** account under 13
2. Verify account is blocked
3. Try to login - should see blocked screen
4. Send parent request
5. Verify account remains blocked until parent approval
6. Parent approves account
7. Verify account is now accessible

### 6. Parent Dashboard Features
1. Login as parent
2. Navigate to Parent Dashboard
3. Verify "Pending Approvals" section is shown
4. Test approving student accounts
5. Verify student accounts move from pending to connected
6. Test notification system

### 7. Parent-Child Request System
1. **Parent sends request to child by email**
   - Login as parent
   - Click "Request Child by Email" button
   - Enter child's email address
   - Send request
   - Verify child receives notification

2. **Child receives parent request**
   - Login as child
   - Check notifications for parent request
   - Accept or reject parent request
   - Verify connection is established if accepted

3. **Parent receives child request**
   - Child sends request to parent during registration
   - Parent receives notification
   - Parent can accept/reject from dashboard
   - Verify connection is established if accepted

### 8. Bidirectional Request System
1. **Parent → Child Request**
   - Parent uses "Request Child by Email" feature
   - Child receives request and can accept/reject
   - Connection established upon acceptance

2. **Child → Parent Request**
   - Child registers with parent email
   - Parent receives automatic request
   - Parent can accept/reject from dashboard
   - Account unblocked upon acceptance

### 9. Notification System
1. Test parent request notifications
2. Test student approval notifications
3. Test account unblocked notifications
4. Verify notification filtering works

### 10. Parent Email Field Validation
1. Try to register student under 13 without parent email
2. Verify form validation prevents submission
3. Enter invalid email format
4. Verify email format validation works
5. Enter valid parent email
6. Verify registration proceeds successfully

### 11. All Pending Requests Dashboard
1. Login as parent
2. Navigate to Parent Dashboard
3. Verify "Pending Child Requests" section (children wanting to connect)
4. Verify "Pending Parent Requests" section (other parents wanting to connect)
5. Test accepting/rejecting both types of requests
6. Verify proper notifications are sent

## API Endpoints to Test

### Student Account Management
- `POST /api/parent/request-child` - Send parent request
- `POST /api/parent/request-child-by-email` - Send parent request to child by email
- `POST /api/parent/accept-request` - Accept parent request (child)
- `POST /api/parent/reject-request` - Reject parent request (child)
- `POST /api/parent/accept-child-request` - Accept child request (parent)
- `POST /api/parent/reject-child-request` - Reject child request (parent)
- `POST /api/parent/approve-child/:childId` - Approve student account (parent)
- `GET /api/parent/pending-approvals` - Get pending student approvals
- `GET /api/parent/all-pending-requests` - Get all pending requests for parent

### Account Status
- Verify `isAccountBlocked` remains true until parent approval (for students only)
- Verify `parentConfirmed` is set to true after approval
- Verify `blockedReason` is cleared after approval

## Expected Behavior

### For Students Under 13
1. Parent email field appears during registration
2. Parent email is required for registration
3. Account automatically blocked on registration
4. Parent request automatically sent during registration
5. Cannot access platform until parent approval
6. Account remains blocked until parent explicitly approves

### For Non-Students Under 13
1. Parent email field does NOT appear during registration
2. Account is NOT blocked on registration
3. Can access platform normally
4. No parental approval required

### For Students 13 and Over
1. Parent email field does NOT appear during registration
2. Account is NOT blocked on registration
3. Can access platform normally
4. No parental approval required

### For Parents
1. Receive automatic notification when student registers
2. Can see pending student approvals in dashboard
3. Can approve student accounts with one click
4. Receive notifications for new student requests
5. Can monitor approved students' progress
6. Can send requests to children by email address
7. Can see all pending requests (both child and parent requests)
8. Can accept/reject requests from both directions

### For System
1. Automatically sends parent request during student registration
2. Maintains security by keeping student accounts blocked until approval
3. Sends appropriate notifications
4. Updates account status correctly
5. Provides clear UI feedback
6. Only applies to students, not other roles
7. Validates parent email format and presence
8. Supports bidirectional parent-child requests
9. Handles all types of pending requests in dashboard 