const Tweet = require('../models/tweet');
const User = require('../models/user');

// Middleware: require the userID cookie to be present
exports.requireAuth = (req, res, next) => {
  if (!req.cookies.userID) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// POST /tweets/create
exports.createTweet = async (req, res) => {
  const text = req.body.text?.trim();

  if (!text) {
    return res.status(400).json({ error: 'Tweet text is required' });
  }
  if (text.length > 280) {
    return res.status(400).json({ error: 'Tweet cannot exceed 280 characters' });
  }

  try {
    const tweet = await Tweet.create({
      text,
      author: req.cookies.userID,
    });

    // Add tweet to user's tweets array
    await User.findByIdAndUpdate(req.cookies.userID, {
      $push: { tweets: tweet._id },
    });

    res.status(201).json(tweet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /tweets/feed
exports.getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.cookies.userID).select('following');
    const authorIds = [req.cookies.userID, ...currentUser.following];

    const tweets = await Tweet.find({ author: { $in: authorIds } })
      .sort({ created: -1 })
      .populate('author', 'username');

    res.status(200).json(tweets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /tweets/:id/like  (toggle)
exports.toggleLike = async (req, res) => {
  const userId = req.cookies.userID;

  try {
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    const alreadyLiked = tweet.likes.map(String).includes(String(userId));
    if (alreadyLiked) {
      tweet.likes.pull(userId);
    } else {
      tweet.likes.push(userId);
    }
    await tweet.save();

    res.status(200).json({
      liked: !alreadyLiked,
      likeCount: tweet.likes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /tweets/:id
exports.deleteTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if (String(tweet.author) !== String(req.cookies.userID)) {
      return res.status(403).json({ error: 'Not authorized to delete this tweet' });
    }

    await Tweet.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.cookies.userID, {
      $pull: { tweets: tweet._id },
    });

    res.status(200).json({ message: 'Tweet deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
