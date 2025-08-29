const express = require('express');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/communityController');
const { checkChildRestrictions } = require('../middleware/childRestrictions');

const router = express.Router();

router.use(verifyToken);
router.use(apiLimiter);

router.get('/feed', ctrl.listFeed);
router.get('/stats', ctrl.getCommunityStats);
router.post('/posts', checkChildRestrictions('community_post'), ctrl.createPost);
router.delete('/posts/:postId', ctrl.deletePost);
router.put('/posts/:postId', ctrl.editPost);
router.patch('/posts/:postId/privacy', ctrl.updatePostPrivacy);
router.post('/posts/:postId/like', ctrl.toggleLike);
router.post('/posts/:postId/comments', ctrl.addComment);
router.post('/posts/:postId/share', ctrl.sharePost);
router.post('/posts/:postId/poll/vote', ctrl.votePoll);
router.get('/posts/:postId/poll/top', ctrl.getHighestVotedOption);
router.post('/posts/:postId/report', ctrl.reportPost);
router.get('/reports', ctrl.listReports);
router.post('/reports/:reportId/resolve', ctrl.resolveReport);
router.get('/enrollments/shareable', ctrl.getShareableEnrollments);
router.get('/user/shared-content', ctrl.getUserSharedContent);

router.post('/uploads/images', upload.array('images', 6), ctrl.uploadImages);

module.exports = router;


