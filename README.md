# Twitter Clone

A full-stack Twitter clone built with MongoDB, Express, Vanilla JavaScript, and Node.js.

## Current Status

> **✅ Feature-complete.** All 5 phases implemented, 67 backend tests passing.

| Feature | Status |
|---------|--------|
| User registration | ✅ Done |
| User login / logout | ✅ Done |
| Tweet creation | ✅ Done |
| Tweet feed (follow-filtered) | ✅ Done |
| Tweet deletion | ✅ Done |
| Follow / unfollow | ✅ Done |
| Likes (toggle) | ✅ Done |
| User profiles (view + edit) | ✅ Done |
| User search | ✅ Done |
| Home page — fully wired frontend | ✅ Done |
| Profile page | ✅ Done |
| Relative timestamps on tweets | ✅ Done |
| Image uploads (Multer) | ❌ Not implemented |

---

## Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** bcrypt + express-session (cookie-based)
- **Testing:** Jest + Supertest + mongodb-memory-server (67 tests)

---

## Setup

```bash
# Install server dependencies
cd server && npm install

# Run tests
npm test

# Start the server
npm start
```

Then open `client/public_html/index.html` in your browser (or serve it via the Express static middleware).

Make sure MongoDB is running (or update the URI in `server/server.js`).

---

## Build Roadmap

### Phase 1 — Core Tweets ✅ Complete
- [x] `POST /tweets/create` — create a tweet (max 280 chars)
- [x] `GET /tweets/feed` — fetch tweets
- [x] `DELETE /tweets/:id` — delete own tweet
- [x] Frontend: chirp form submits, feed renders on load

### Phase 2 — Follow System ✅ Complete
- [x] `POST /users/:id/follow` — follow a user
- [x] `DELETE /users/:id/follow` — unfollow a user
- [x] Feed filtered to own tweets + followed users

### Phase 3 — Likes ✅ Complete
- [x] `POST /tweets/:id/like` — toggle like on/off
- [x] Returns `liked` boolean and `likeCount`
- [x] Frontend: heart button toggles state live

### Phase 4 — User Profiles ✅ Complete
- [x] `GET /users/:id` — username, bio, profileImage, follower/following counts, tweets
- [x] `PUT /users/:id` — update own bio / profileImage (owner-only)
- [x] `bio`, `profileImage`, timestamps added to User schema
- [x] `profile.html` — view any profile, follow/unfollow, edit own profile

### Phase 5 — Polish ✅ Complete
- [x] `POST /auth/logout` — wired and clears cookie
- [x] `GET /auth/me` — returns current user (used by frontend on load)
- [x] `GET /users/search?q=` — case-insensitive partial username search
- [x] Logout button in nav
- [x] User search in right sidebar (debounced, 300ms)
- [x] Relative timestamps on tweets (just now / 5m / 3h / 2d)
- [x] Tweet cards with like + delete buttons
- [x] Profile page with follow/unfollow and inline edit form
- [ ] Multer image uploads (tweets + profile pictures)

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, sets `userID` cookie |
| POST | `/auth/logout` | — | Clear session cookie |
| GET | `/auth/me` | ✅ | Get current logged-in user |

### Tweets
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/tweets/create` | ✅ | Create a tweet (max 280 chars) |
| GET | `/tweets/feed` | ✅ | Get feed (own + followed, newest first) |
| POST | `/tweets/:id/like` | ✅ | Toggle like — returns `{ liked, likeCount }` |
| DELETE | `/tweets/:id` | ✅ | Delete own tweet |

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/users/search?q=` | ✅ | Search users by partial username |
| GET | `/users/:id` | ✅ | Get profile (username, bio, counts, tweets) |
| PUT | `/users/:id` | ✅ | Update own bio / profileImage |
| POST | `/users/:id/follow` | ✅ | Follow a user |
| DELETE | `/users/:id/follow` | ✅ | Unfollow a user |

---

## Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| tweets.test.js | 17 | create, feed, delete |
| users.test.js | 15 | follow, unfollow, filtered feed |
| likes.test.js | 8 | toggle like/unlike, multi-user |
| profiles.test.js | 16 | GET profile, PUT profile |
| auth.test.js | 5 | logout, /auth/me |
| search.test.js | 6 | search cases, auth, edge cases |
| **Total** | **67** | |

---

## File Map

```
twitter_clone/
├── server/
│   ├── app.js                        # Express app (exported, no DB/listen)
│   ├── server.js                     # Connects to MongoDB Atlas, starts server
│   ├── jest.config.js                # Jest config
│   ├── controllers/
│   │   ├── authController.js         # register, login, logout, getMe
│   │   ├── userController.js         # searchUsers, getProfile, updateProfile, follow, unfollow
│   │   └── tweetController.js        # createTweet, getFeed, toggleLike, deleteTweet
│   ├── models/
│   │   ├── user.js                   # bio, profileImage, timestamps, following/followers/tweets
│   │   └── tweet.js                  # text, author, likes[], created
│   ├── routes/
│   │   ├── authRoutes.js             # /auth/*
│   │   ├── tweetRoutes.js            # /tweets/*
│   │   └── userRoutes.js             # /users/*
│   └── tests/
│       ├── globalSetup.js            # starts mongodb-memory-server
│       ├── globalTeardown.js         # stops mongodb-memory-server
│       ├── setup.js                  # mongoose connect + collection wipe per test
│       ├── tweets.test.js
│       ├── users.test.js
│       ├── likes.test.js
│       ├── profiles.test.js
│       ├── auth.test.js
│       └── search.test.js
└── client/public_html/
    ├── index.html                    # login / register page
    ├── account.css
    ├── home.html                     # main feed
    ├── home.css                      # feed + tweet card styles
    ├── profile.html                  # user profile page
    ├── profile.css
    └── src/components/
        ├── login.js                  # auth form logic
        ├── home.js                   # feed, chirp, likes, delete, search, logout
        └── profile.js                # profile view, edit, follow/unfollow, search
```
