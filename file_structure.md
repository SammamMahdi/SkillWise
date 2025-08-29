# Project File Structure

```
├── .gitignore
├── README.md
├── client
    ├── .eslintrc.cjs
    ├── Public
    │   └── logo.png
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── src
    │   ├── App.jsx
    │   ├── components
    │   │   ├── admin
    │   │   │   ├── AdminAIRecommendations.jsx
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── ApproveTeacherPage.jsx
    │   │   │   ├── PaymentCodeManager.jsx
    │   │   │   ├── ReAttemptRequests.jsx
    │   │   │   └── ReAttemptRequestsReview.jsx
    │   │   ├── ai
    │   │   │   └── AI_recommendations.jsx
    │   │   ├── auth
    │   │   │   ├── AgeVerificationWrapper.jsx
    │   │   │   ├── AuthPage.jsx
    │   │   │   ├── BlockedAccount.jsx
    │   │   │   ├── DSC02202.jpg
    │   │   │   ├── ForgotPasswordForm.jsx
    │   │   │   ├── GoogleRoleSelectionModal.jsx
    │   │   │   ├── LoginForm.jsx
    │   │   │   ├── SetUsername.jsx
    │   │   │   ├── SetUsername_old.jsx
    │   │   │   ├── SignupForm.jsx
    │   │   │   ├── a.jpg
    │   │   │   ├── evening-b2g.jpg
    │   │   │   └── evening-bg.gif
    │   │   ├── child
    │   │   │   └── BecomeChildPage.jsx
    │   │   ├── common
    │   │   │   ├── AgeRestricted.jsx
    │   │   │   ├── ChildLockModal.jsx
    │   │   │   ├── DashboardButton.jsx
    │   │   │   ├── GlobalNavigation.jsx
    │   │   │   ├── NotificationContainer.jsx
    │   │   │   └── ThemeToggle.jsx
    │   │   ├── community
    │   │   │   ├── CommentSection.jsx
    │   │   │   ├── CommunityFeed.jsx
    │   │   │   ├── CommunityHeader.jsx
    │   │   │   ├── CreatePost.jsx
    │   │   │   ├── EditPostModal.jsx
    │   │   │   ├── FeedCard.jsx
    │   │   │   ├── FloatingActionButton.jsx
    │   │   │   ├── ImageGrid.jsx
    │   │   │   ├── Poll.jsx
    │   │   │   ├── PostHighlighter.jsx
    │   │   │   ├── PostSkeleton.jsx
    │   │   │   ├── PrivacyBadge.jsx
    │   │   │   ├── ThreeJSBackground.jsx
    │   │   │   └── index.js
    │   │   ├── consultations
    │   │   │   ├── ConsultationForm.jsx
    │   │   │   └── ConsultationsPage.jsx
    │   │   ├── courses
    │   │   │   ├── AddLectureForm.jsx
    │   │   │   ├── BasicInformationSection.jsx
    │   │   │   ├── ContentManagementModal.jsx
    │   │   │   ├── CourseContent.jsx
    │   │   │   ├── CourseDetail.jsx
    │   │   │   ├── CourseGrid.jsx
    │   │   │   ├── CourseHeader.jsx
    │   │   │   ├── CourseSidebar.jsx
    │   │   │   ├── CreateCourseForm.jsx
    │   │   │   ├── EditCourseForm.jsx
    │   │   │   ├── ExamAssignmentModal.jsx
    │   │   │   ├── ExamCreationModal.jsx
    │   │   │   ├── LectureItem.jsx
    │   │   │   ├── LecturesSection.jsx
    │   │   │   ├── StudentCourseHeader.jsx
    │   │   │   ├── StudentCourseStats.jsx
    │   │   │   ├── StudentCourseView.jsx
    │   │   │   └── StudentLectureList.jsx
    │   │   ├── dashboard
    │   │   │   ├── CompletedCoursesSection.jsx
    │   │   │   ├── CurrentCoursesSection.jsx
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── DashboardContent.jsx
    │   │   │   ├── LearningDashboard.jsx
    │   │   │   ├── NotesSection.jsx
    │   │   │   ├── ProfileBanner.jsx
    │   │   │   ├── SharedContentSection.jsx
    │   │   │   └── TopBar.jsx
    │   │   ├── exams
    │   │   │   ├── ContactCreatorModal.jsx
    │   │   │   ├── CreateExamForm.jsx
    │   │   │   ├── ExamInterface.jsx
    │   │   │   ├── ExamResults.jsx
    │   │   │   ├── ExamSubmissionReview.jsx
    │   │   │   ├── ExamSubmissionSuccess.jsx
    │   │   │   ├── ExamViolationTerminated.jsx
    │   │   │   ├── ExamWarningModal.jsx
    │   │   │   ├── StudentExamList.jsx
    │   │   │   └── TeacherExamDashboard.jsx
    │   │   ├── friends
    │   │   │   ├── FriendChatBox.jsx
    │   │   │   ├── FriendChatList.jsx
    │   │   │   ├── FriendsPage.jsx
    │   │   │   ├── FriendsPage.jsx.backup
    │   │   │   └── FriendsPageNew.jsx
    │   │   ├── messages
    │   │   │   ├── ChatBox.jsx
    │   │   │   └── Messages.jsx
    │   │   ├── notes
    │   │   │   └── NotesPage.jsx
    │   │   ├── notifications
    │   │   │   ├── NotificationCenter.jsx
    │   │   │   └── PostShareNotification.jsx
    │   │   ├── parent
    │   │   │   └── BecomeParentPage.jsx
    │   │   ├── payment
    │   │   │   ├── RedeemCodeModal.jsx
    │   │   │   ├── SkillPayWallet.jsx
    │   │   │   └── TransactionHistory.jsx
    │   │   ├── profile
    │   │   │   ├── AccentColorPicker.jsx
    │   │   │   ├── ProfileSettings.jsx
    │   │   │   ├── ProfileVisuals.jsx
    │   │   │   ├── PublicProfile.jsx
    │   │   │   └── StyledProfileSetup.jsx
    │   │   ├── skillConnect
    │   │   │   ├── SkillConnect.jsx
    │   │   │   └── SkillOnboarding.jsx
    │   │   ├── skills
    │   │   │   ├── ContactModal.jsx
    │   │   │   ├── CreateSkillPost.jsx
    │   │   │   ├── SkillPostCard.jsx
    │   │   │   └── SkillsWall.jsx
    │   │   ├── superuser
    │   │   │   └── SuperUserRoleManagement.jsx
    │   │   ├── teacher
    │   │   │   ├── TeacherApplicationForm.jsx
    │   │   │   ├── TeacherDashboard.jsx
    │   │   │   ├── TeacherReAttemptRequests.jsx
    │   │   │   └── TeacherSubmissionReview.jsx
    │   │   └── test
    │   │   │   ├── FriendSystemTest.jsx
    │   │   │   └── SuperUserAccessTest.jsx
    │   ├── config
    │   │   └── api.js
    │   ├── contexts
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── hooks
    │   │   ├── useCommunityFeed.js
    │   │   └── useCourseManagement.js
    │   ├── index.css
    │   ├── main.jsx
    │   ├── services
    │   │   ├── aiService.js
    │   │   ├── authService.js
    │   │   ├── childService.js
    │   │   ├── communityService.js
    │   │   ├── consultationService.js
    │   │   ├── courseService.js
    │   │   ├── examService.js
    │   │   ├── friendChatService.js
    │   │   ├── friendService.js
    │   │   ├── googleAuthService.js
    │   │   ├── learningService.js
    │   │   ├── messagesService.js
    │   │   ├── notesService.js
    │   │   ├── notificationService.js
    │   │   ├── parentService.js
    │   │   ├── paymentService.js
    │   │   ├── skillConnectService.js
    │   │   ├── skillsService.js
    │   │   ├── superUserService.js
    │   │   ├── teacherApplicationService.js
    │   │   └── usernameService.js
    │   └── utils
    │   │   ├── dateUtils.js
    │   │   ├── googleSignInDebug.js
    │   │   ├── passwordUtils.js
    │   │   ├── permissions.js
    │   │   ├── permissions.js.backup
    │   │   └── profilePictureUtils.js
    ├── tailwind.config.js
    └── vite.config.js
├── package-lock.json
├── package.json
└── server
    ├── .eslintrc.json
    ├── config
        ├── auth.js
        └── database.js
    ├── controllers
        ├── adminController.js
        ├── aiController.js
        ├── authController.js
        ├── authController.js.backup
        ├── authController_old.js
        ├── childController.js
        ├── communityController.js
        ├── consultationController.js
        ├── courseController.js
        ├── examController.js
        ├── friendChatController.js
        ├── friendController.js
        ├── learningController.js
        ├── messagesController.js
        ├── noteController.js
        ├── notificationController.js
        ├── parentController.js
        ├── parentRoleController.js
        ├── paymentController.js
        ├── reAttemptController.js
        ├── skillConnectController.js
        ├── skillsController.js
        ├── superUserController.js
        ├── teacherApplicationController.js
        └── userController.js
    ├── generated-codes
        └── payment-codes-2025-08-17.txt
    ├── middleware
        ├── auth.js
        ├── childRestrictions.js
        ├── errorHandler.js
        ├── rateLimiter.js
        └── upload.js
    ├── models
        ├── AIInteraction.js
        ├── AIRecommendation.js
        ├── BlogPost.js
        ├── CommunityPost.js
        ├── ConsultationRequest.js
        ├── Course.js
        ├── Event.js
        ├── Exam.js
        ├── ExamAttempt.js
        ├── ExamReAttemptRequest.js
        ├── FriendMessage.js
        ├── FriendMessages.js
        ├── LectureProgress.js
        ├── Message.js
        ├── Note.js
        ├── Notification.js
        ├── Payment.js
        ├── SkillConnect.js
        ├── SkillPost.js
        ├── SkillTracker.js
        ├── SuperUser.js
        ├── TeacherApplication.js
        ├── TempUserCV.js
        └── User.js
    ├── nodemon.json
    ├── package.json
    ├── routes
        ├── admin.js
        ├── ai.js
        ├── auth.js
        ├── child.js
        ├── community.js
        ├── consultationRoutes.js
        ├── courses.js
        ├── exams.js
        ├── friendChat.js
        ├── friends.js
        ├── learning.js
        ├── messages.js
        ├── notes.js
        ├── notifications.js
        ├── parent.js
        ├── payments.js
        ├── skillConnect.js
        ├── skills.js
        ├── superuser.js
        ├── teacherApplication.js
        ├── username.js
        └── users.js
    ├── scripts
        ├── addSuperUser.js
        ├── initializeSkills.js
        ├── populatePaymentCodes.js
        ├── testSkillConnectAPI.js
        └── updateSuperUserFlag.js
    ├── server.js
    ├── uploads
        ├── 1754859117895_503702193_9925341087586480_8676198591894.jpg
        ├── 1754859126130_503702193_9925341087586480_8676198591894.jpg
        ├── 1754863412536_503702193_9925341087586480_8676198591894.jpg
        ├── 1754863841616_503702193_9925341087586480_8676198591894.jpg
        ├── 1754863880728_images.jpeg
        ├── 1754864016767_503702193_9925341087586480_8676198591894.jpg
        ├── 1754864212331_images.jpeg
        ├── 1755152005229_5b8db2b9c97aa1d901809624aeea6202.jpg
        ├── 1755432621815_22544dc1-fd50-49a0-a815-966770139050.jpeg
        ├── 1755432683067_premium_photo-1673177667569-e3321a8d8256.jpeg
        ├── 1755432902923_22544dc1-fd50-49a0-a815-966770139050.jpeg
        ├── 1755432903193_premium_photo-1673177667569-e3321a8d8256.jpeg
        ├── 1755481593556_IMG20250611190453.jpg
        ├── 1755481628119_IMG20250611190453.jpg
        ├── 1755482145330_20250528_040701.jpg
        ├── 1755482150259_20250528_040701.jpg
        ├── 1755482159100_20250528_040701.jpg
        ├── 1755482448410_IMG20250611190453.jpg
        ├── 1755482995600_5f92610bade68.png
        └── 1755483147236_Gerq6fhbsAAdUoc.jpg
    └── utils
        ├── encryption.js
        └── messageEncryption.js
```
