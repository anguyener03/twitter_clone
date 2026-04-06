const request = require('supertest');
const app = require('../app');
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

// ---------------------------------------------------------------------------
// POST /users/:id/follow
// ---------------------------------------------------------------------------

describe('POST /users/:id/follow', () => {
  test('returns 401 when not authenticated', async () => {
    const target = await registerAndLogin('target1');

    const res = await request(app).post(`/users/${target.userId}/follow`);
    expect(res.status).toBe(401);
  });

  test('returns 404 when target user does not exist', async () => {
    const { cookie } = await registerAndLogin('follower1');
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';

    const res = await request(app)
      .post(`/users/${fakeId}/follow`)
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
  });

  test('returns 400 when trying to follow yourself', async () => {
    const { cookie, userId } = await registerAndLogin('selffollow');

    const res = await request(app)
      .post(`/users/${userId}/follow`)
      .set('Cookie', cookie);

    expect(res.status).toBe(400);
  });

  test('returns 400 when already following the user', async () => {
    const follower = await registerAndLogin('follower2');
    const target = await registerAndLogin('target2');

    // Follow once
    await request(app)
      .post(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    // Follow again
    const res = await request(app)
      .post(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    expect(res.status).toBe(400);
  });

  test('adds target to current user following array', async () => {
    const follower = await registerAndLogin('follower3');
    const target = await registerAndLogin('target3');

    await request(app)
      .post(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    const followerUser = await User.findById(follower.userId);
    expect(followerUser.following.map(String)).toContain(target.userId);
  });

  test('adds current user to target followers array', async () => {
    const follower = await registerAndLogin('follower4');
    const target = await registerAndLogin('target4');

    await request(app)
      .post(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    const targetUser = await User.findById(target.userId);
    expect(targetUser.followers.map(String)).toContain(follower.userId);
  });
});

// ---------------------------------------------------------------------------
// DELETE /users/:id/follow
// ---------------------------------------------------------------------------

describe('DELETE /users/:id/follow', () => {
  test('returns 401 when not authenticated', async () => {
    const target = await registerAndLogin('target5');

    const res = await request(app).delete(`/users/${target.userId}/follow`);
    expect(res.status).toBe(401);
  });

  test('returns 404 when target user does not exist', async () => {
    const { cookie } = await registerAndLogin('follower5');
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';

    const res = await request(app)
      .delete(`/users/${fakeId}/follow`)
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
  });

  test('returns 400 when not currently following the user', async () => {
    const follower = await registerAndLogin('follower6');
    const target = await registerAndLogin('target6');

    const res = await request(app)
      .delete(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    expect(res.status).toBe(400);
  });

  test('removes target from current user following array', async () => {
    const follower = await registerAndLogin('follower7');
    const target = await registerAndLogin('target7');

    await request(app)
      .post(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    await request(app)
      .delete(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    const followerUser = await User.findById(follower.userId);
    expect(followerUser.following.map(String)).not.toContain(target.userId);
  });

  test('removes current user from target followers array', async () => {
    const follower = await registerAndLogin('follower8');
    const target = await registerAndLogin('target8');

    await request(app)
      .post(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    await request(app)
      .delete(`/users/${target.userId}/follow`)
      .set('Cookie', follower.cookie);

    const targetUser = await User.findById(target.userId);
    expect(targetUser.followers.map(String)).not.toContain(follower.userId);
  });
});

// ---------------------------------------------------------------------------
// GET /tweets/feed — filtered behaviour
// ---------------------------------------------------------------------------

describe('GET /tweets/feed (follow-filtered)', () => {
  test('does not show tweets from users not followed', async () => {
    const alice = await registerAndLogin('alice2');
    const bob = await registerAndLogin('bob2');

    await request(app).post('/tweets/create').set('Cookie', bob.cookie).send({ text: 'bob unfollow tweet' });

    // alice does NOT follow bob
    const res = await request(app).get('/tweets/feed').set('Cookie', alice.cookie);

    expect(res.status).toBe(200);
    const texts = res.body.map(t => t.text);
    expect(texts).not.toContain('bob unfollow tweet');
  });

  test('shows own tweets even when following no one', async () => {
    const { cookie } = await registerAndLogin('solo');

    await request(app).post('/tweets/create').set('Cookie', cookie).send({ text: 'solo tweet' });

    const res = await request(app).get('/tweets/feed').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].text).toBe('solo tweet');
  });

  test('shows tweets from followed user after following', async () => {
    const alice = await registerAndLogin('alice3');
    const bob = await registerAndLogin('bob3');

    await request(app).post('/tweets/create').set('Cookie', bob.cookie).send({ text: 'bob visible tweet' });

    await request(app).post(`/users/${bob.userId}/follow`).set('Cookie', alice.cookie);

    const res = await request(app).get('/tweets/feed').set('Cookie', alice.cookie);

    expect(res.status).toBe(200);
    const texts = res.body.map(t => t.text);
    expect(texts).toContain('bob visible tweet');
  });

  test('hides tweets from unfollowed user after unfollowing', async () => {
    const alice = await registerAndLogin('alice4');
    const bob = await registerAndLogin('bob4');

    await request(app).post('/tweets/create').set('Cookie', bob.cookie).send({ text: 'bob gone tweet' });

    await request(app).post(`/users/${bob.userId}/follow`).set('Cookie', alice.cookie);
    await request(app).delete(`/users/${bob.userId}/follow`).set('Cookie', alice.cookie);

    const res = await request(app).get('/tweets/feed').set('Cookie', alice.cookie);

    expect(res.status).toBe(200);
    const texts = res.body.map(t => t.text);
    expect(texts).not.toContain('bob gone tweet');
  });
});
