const express = require('express');
const router = express.Router();
const socialController = require('../controllers/JS/socialController');
const authMiddleware = require('../middlewares/auth');

router.get('/posts', socialController.getPosts);
router.post('/posts', authMiddleware, socialController.createPost);
router.put('/posts/:postId', authMiddleware, socialController.updatePost);
router.post('/posts/:postId/reaction', authMiddleware, socialController.addReaction);
router.post('/posts/:postId/comment', authMiddleware, socialController.addComment);
router.post('/posts/:postId/comment/:commentId/reaction', authMiddleware, socialController.addCommentReaction);
router.post('/posts/:postId/comment/:commentId/reply', authMiddleware, socialController.replyToComment);
router.post(
  '/posts/:postId/comment/:commentId/reply/:replyId/reaction',
  authMiddleware,
  socialController.addReplyReaction
);

router.delete(
  '/posts/:postId',
  authMiddleware,
  socialController.deletePost
);

module.exports = router;