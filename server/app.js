const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const tweetRoutes = require('./routes/tweetRoutes');

const app = express();

app.use(express.static('../client/public_html'));
app.use(cookieParser());
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tweets', tweetRoutes);

module.exports = app;
