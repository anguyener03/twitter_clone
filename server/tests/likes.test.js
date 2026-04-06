const request = require('supertest');
const app = require('../app');
const Tweet = require('../models/tweet');
const User = require('../models/user');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerAndLogin(username, password = 'password123') {
  await request(app).post('/auth/register').send({ username, password });
  const res = await request(app).post('/auth/login').send({ username, password });
  const cookie = res.headers['set-cookie'];
  const user = await User.findOne({ username });
  return { cookie, userId: user._id.toString() };
}

async function createTweet(cookie, text = 'a tweet') {
  const res = await request(app)
    .post('/tweets/create')
    .set('Cookie', cookie)
    .send({ text });
  return res.body;
}

// ---------------------------------------------------------------------------
// POST /tweets/:id/like  (toggle)
// ---------------------------------------------------------------------------

describe('POST /tweets/:id/like', () => {
  test('returns 401 when not authenticated', async () => {
    const { cookie } = await registerAndLogin('likeuser1');
    const tweet = await createTweet(cookie);

    const res = await request(app).post(`/tweets/${tweet._id}/like`);
    expect(res.status).toBe(401);
  });

  test('returns 404 when tweet does not exist', async () => {
    const { cookie } = await registerAndLogin('likeuser2');
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';

    const res = await request(app)
      .post(`/tweets/${fakeId}/like`)
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
  });

  test('likes a tweet — returns 200 with liked: true and likeCount: 1', async () => {
    const { cookie } = await registerAndLogin('likeuser3');
    const tweet = await createTweet(cookie);

    const res = await request(app)
      .post(`/tweets/${tweet._id}/like`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
    expect(res.body.likeCount).toBe(1);
  });

  test('like is persisted — userId is in tweet likes array in DB', async () => {
    const { cookie, userId } = await registerAndLogin('likeuser4');
    const tweet = await createTweet(cookie);

    await request(app)
      .post(`/tweets/${tweet._id}/like`)
      .set('Cookie', cookie);

    const updated = await Tweet.findById(tweet._id);
    expect(updated.likes.map(String)).toContain(userId);
  });

  test('toggling again unlikes — returns liked: false and likeCount: 0', async () => {
    const { cookie } = await registerAndLogin('likeuser5');
    const tweet = await createTweet(cookie);

    // Like
    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', cookie);

    // Unlike
    const res = await request(app)
      .post(`/tweets/${tweet._id}/like`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(false);
    expect(res.body.likeCount).toBe(0);
  });

  test('unlike is persisted — userId is removed from tweet likes array in DB', async () => {
    const { cookie, userId } = await registerAndLogin('likeuser6');
    const tweet = await createTweet(cookie);

    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', cookie);
    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', cookie);

    const updated = await Tweet.findById(tweet._id);
    expect(updated.likes.map(String)).not.toContain(userId);
  });

  test('multiple users can like the same tweet', async () => {
    const author = await registerAndLogin('likeauthor');
    const liker1 = await registerAndLogin('liker1');
    const liker2 = await registerAndLogin('liker2');
    const tweet = await createTweet(author.cookie);

    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', liker1.cookie);
    const res = await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', liker2.cookie);

    expect(res.status).toBe(200);
    expect(res.body.likeCount).toBe(2);

    const updated = await Tweet.findById(tweet._id);
    expect(updated.likes.map(String)).toContain(liker1.userId);
    expect(updated.likes.map(String)).toContain(liker2.userId);
  });

  test('one user unliking does not affect other users likes', async () => {
    const author = await registerAndLogin('likeauthor2');
    const liker1 = await registerAndLogin('liker3');
    const liker2 = await registerAndLogin('liker4');
    const tweet = await createTweet(author.cookie);

    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', liker1.cookie);
    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', liker2.cookie);

    // liker1 unlikes
    await request(app).post(`/tweets/${tweet._id}/like`).set('Cookie', liker1.cookie);

    const updated = await Tweet.findById(tweet._id);
    expect(updated.likes.map(String)).not.toContain(liker1.userId);
    expect(updated.likes.map(String)).toContain(liker2.userId);
    expect(updated.likes.length).toBe(1);
  });
});
