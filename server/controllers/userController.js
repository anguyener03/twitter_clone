const User = require('../models/user');
const Tweet = require('../models/tweet');

// Middleware: require the userID cookie to be present
exports.requireAuth = (req, res, next) => {
  if (!req.cookies.userID) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GET /users/search?q=
exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query is required' });

  try {
    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    }).select('username bio profileImage').limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /users/:id
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tweets = await Tweet.find({ author: req.params.id }).sort({ created: -1 });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profileImage: user.profileImage,
      followerCount: user.followers.length,
      followingCount: user.following.length,
      tweets,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /users/:id
exports.updateProfile = async (req, res) => {
  const currentUserId = req.cookies.userID;
  const targetId = req.params.id;

  try {
    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (String(currentUserId) !== String(targetId)) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const { bio, profileImage } = req.body;

    if (bio !== undefined) {
      if (bio.length > 160) {
        return res.status(400).json({ error: 'Bio cannot exceed 160 characters' });
      }
      user.bio = bio;
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /users/:id/follow
exports.followUser = async (req, res) => {
  const currentUserId = req.cookies.userID;
  const targetId = req.params.id;

  if (String(currentUserId) === String(targetId)) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    if (currentUser.following.map(String).includes(String(targetId))) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await User.findByIdAndUpdate(currentUserId, { $push: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $push: { followers: currentUserId } });

    res.status(200).json({ message: 'Followed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /users/:id/follow
exports.unfollowUser = async (req, res) => {
  const currentUserId = req.cookies.userID;
  const targetId = req.params.id;

  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser.following.map(String).includes(String(targetId))) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } });

    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
