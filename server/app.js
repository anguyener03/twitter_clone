
// Import required modules
const express = require('express');
const mongoose = require('mongoose');

// Import routes and controllers
const authRoutes = require('./routes/authRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const userRoutes = require('./routes/userRoutes');
const authController = require('./controllers/authController');
const tweetController = require('./controllers/tweetController');
const userController = require('./controllers/userController');

// Set up Express app
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public_html'));

// Connect to MongoDB database
mongoose.connect('mongodb://localhost/twitter-clone', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Middleware for parsing request bodies
app.use(express.json());

// Mount routes
app.use('/auth', authRoutes);
app.use('/tweets', tweetRoutes);
app.use('/users', userRoutes);


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});