const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');

router.post('/create', tweetController.requireAuth, tweetController.createTweet);
router.get('/feed', tweetController.requireAuth, tweetController.getFeed);
router.post('/:id/like', tweetController.requireAuth, tweetController.toggleLike);
router.delete('/:id', tweetController.requireAuth, tweetController.deleteTweet);

module.exports = router;
