const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/search', userController.requireAuth, userController.searchUsers);
router.get('/:id', userController.requireAuth, userController.getProfile);
router.put('/:id', userController.requireAuth, userController.updateProfile);
router.post('/:id/follow', userController.requireAuth, userController.followUser);
router.delete('/:id/follow', userController.requireAuth, userController.unfollowUser);

module.exports = router;
