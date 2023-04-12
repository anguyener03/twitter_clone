/**
 * Holds a model and Schema for a user
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }]
});
module.exports = mogoose.model('User', userSchema);
