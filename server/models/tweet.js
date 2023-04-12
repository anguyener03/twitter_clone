/**
 * Holds a model and schema for a tweet.
 */
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tweet', tweetSchema);