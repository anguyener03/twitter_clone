# Twitter Clone

A full-stack Twitter clone built with MongoDB, Express, Vanilla JavaScript, and Node.js.

## Current Status

> **~20-30% complete.** Authentication works. Core features (tweets, feed, follows, likes, profiles) are not yet implemented.

| Feature | Status |
|---------|--------|
| User registration | ✅ Done |
| User login | ✅ Done |
| Home page layout (UI) | ✅ Done |
| Tweet creation (backend) | ❌ Missing |
| Tweet feed | ❌ Missing |
| Follow / unfollow | ❌ Missing |
| Likes | ❌ Missing |
| User profiles | ❌ Missing |
| Image uploads | ❌ Missing |
| Logout route | ⚠️ Partial |

---

## Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** bcrypt + express-session (cookie-based)
- **Image Uploads:** Multer (planned)

---

## Setup

```bash
# Install server dependencies
cd server && npm install

# Start the server
node app.js

# Open the frontend
open client/public_html/index.html
```

Make sure MongoDB is running locally (default: `mongodb://localhost:27017`).

---

## Build Roadmap

Work through phases in order — each phase depends on the previous one.

### Phase 1 — Core Tweets
> Everything else depends on tweets existing. Start here.

- [ ] Create `server/controllers/tweetController.js`
- [ ] Wire up `server/routes/tweetRoutes.js` (currently empty)
- [ ] Uncomment tweet routes in `server/app.js`
- [ ] `POST /tweets/create` — create a tweet
- [ ] `GET /tweets/feed` — fetch all tweets (global feed to start)
- [ ] `DELETE /tweets/:id` — delete own tweet
- [ ] Frontend: submit chirp form → POST to `/tweets/create`
- [ ] Frontend: fetch and render tweets in home feed on page load

### Phase 2 — Follow System
- [ ] Create `server/routes/userRoutes.js`
- [ ] Fill in `server/controllers/userController.js` (currently empty)
- [ ] `POST /users/:id/follow` — follow a user (update both users' arrays)
- [ ] `DELETE /users/:id/follow` — unfollow a user
- [ ] `GET /tweets/feed` — filter feed to only show tweets from followed users

### Phase 3 — Likes
- [ ] Add `likes: [{ type: ObjectId, ref: 'User' }]` to Tweet schema
- [ ] `POST /tweets/:id/like` — toggle like on/off
- [ ] Frontend: like button shows count + toggles liked state

### Phase 4 — User Profiles
- [ ] `GET /users/:id` — return profile info (bio, follower/following counts, tweets)
- [ ] `PUT /users/:id` — update bio, profile image
- [ ] Build out `client/public_html/nothing.html` → rename to `profile.html`
- [ ] Add `bio`, `profileImage`, and timestamps to User schema

### Phase 5 — Polish
- [ ] Wire logout into `server/routes/authRoutes.js` (handler exists, route missing)
- [ ] Configure Multer for image uploads (tweets + profile images)
- [ ] User search in right sidebar of home page
- [ ] Add `createdAt` timestamps to tweets (display relative time)
- [ ] Responsive/mobile layout improvements

---

## File Map

```
twitter_clone/
├── server/
│   ├── app.js                     # Express app + MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # ✅ register, login, logout
│   │   ├── userController.js      # ❌ empty — needs follow/profile logic
│   │   └── tweetController.js     # ❌ doesn't exist yet
│   ├── models/
│   │   ├── user.js                # ✅ schema with following/followers/tweets
│   │   └── tweet.js               # ✅ basic schema (missing likes/image)
│   └── routes/
│       ├── authRoutes.js          # ✅ /auth/register, /auth/login
│       └── tweetRoutes.js         # ❌ empty — needs all tweet routes
└── client/public_html/
    ├── index.html                 # ✅ login/register page
    ├── home.html                  # ✅ main feed layout
    ├── nothing.html               # ❌ stub — will become profile page
    └── src/components/
        ├── login.js               # ✅ auth form logic
        └── home.js                # ⚠️ partial — only toggles chirp box
```
