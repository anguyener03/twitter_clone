/**
 * Holds a model and Schema for a user
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }]
});
// TODO compare password function. Implement salting and hasing
userSchema.methods.comparePassword = async function(candidatePassword){
    try {
        const match = await bcrypt.compare(candidatePassword, this.password);
        return match;
      } catch (error) {
        console.error(error);
        return false;
      }
    };
module.exports = mongoose.model('User', userSchema);
