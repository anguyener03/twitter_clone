
// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Import routes and controllers
const authRoutes = require('./routes/authRoutes');
//const tweetRoutes = require('./routes/tweetRoutes');
//const userRoutes = require('./routes/userRoutes');
const authController = require('./controllers/authController');
//const tweetController = require('./controllers/tweetController');
//const userController = require('./controllers/userController');

// Set up Express app
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('../client/public_html'));
app.use(cookieParser);
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));


const uri = "mongodb+srv://adlertnguyen:adlernguyen@twitter-clone.oarbq3n.mongodb.net/test";
// Connect to MongoDB database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Middleware for parsing request bodies
app.use(express.json());

// Mount routes
app.use('/auth', authRoutes);
//app.use('/tweets', tweetRoutes);
//app.use('/users', userRoutes);


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});