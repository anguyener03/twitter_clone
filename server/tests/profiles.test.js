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
// GET /users/:id
// ---------------------------------------------------------------------------

describe('GET /users/:id', () => {
  test('returns 401 when not authenticated', async () => {
    const { userId } = await registerAndLogin('profuser1');

    const res = await request(app).get(`/users/${userId}`);
    expect(res.status).toBe(401);
  });

  test('returns 404 when user does not exist', async () => {
    const { cookie } = await registerAndLogin('profuser2');
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';

    const res = await request(app).get(`/users/${fakeId}`).set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  test('returns 200 with username, bio, and profileImage', async () => {
    const { cookie, userId } = await registerAndLogin('profuser3');

    const res = await request(app).get(`/users/${userId}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('profuser3');
    expect(res.body).toHaveProperty('bio');
    expect(res.body).toHaveProperty('profileImage');
  });

  test('does NOT expose password in response', async () => {
    const { cookie, userId } = await registerAndLogin('profuser4');

    const res = await request(app).get(`/users/${userId}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
  });

  test('returns followerCount and followingCount', async () => {
    const user1 = await registerAndLogin('profuser5');
    const user2 = await registerAndLogin('profuser6');

    // user2 follows user1
    await request(app)
      .post(`/users/${user1.userId}/follow`)
      .set('Cookie', user2.cookie);

    const res = await request(app).get(`/users/${user1.userId}`).set('Cookie', user1.cookie);

    expect(res.status).toBe(200);
    expect(res.body.followerCount).toBe(1);
    expect(res.body.followingCount).toBe(0);
  });

  test('returns tweets array for the user', async () => {
    const { cookie, userId } = await registerAndLogin('profuser7');

    await request(app).post('/tweets/create').set('Cookie', cookie).send({ text: 'profile tweet' });

    const res = await request(app).get(`/users/${userId}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tweets)).toBe(true);
    expect(res.body.tweets.length).toBe(1);
    expect(res.body.tweets[0].text).toBe('profile tweet');
  });

  test('can view another user\'s profile', async () => {
    const viewer = await registerAndLogin('viewer1');
    const target = await registerAndLogin('target9');

    const res = await request(app).get(`/users/${target.userId}`).set('Cookie', viewer.cookie);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('target9');
  });
});

// ---------------------------------------------------------------------------
// PUT /users/:id
// ---------------------------------------------------------------------------

describe('PUT /users/:id', () => {
  test('returns 401 when not authenticated', async () => {
    const { userId } = await registerAndLogin('updateuser1');

    const res = await request(app)
      .put(`/users/${userId}`)
      .send({ bio: 'hello' });

    expect(res.status).toBe(401);
  });

  test('returns 404 when user does not exist', async () => {
    const { cookie } = await registerAndLogin('updateuser2');
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';

    const res = await request(app)
      .put(`/users/${fakeId}`)
      .set('Cookie', cookie)
      .send({ bio: 'hello' });

    expect(res.status).toBe(404);
  });

  test('returns 403 when trying to update another user\'s profile', async () => {
    const owner = await registerAndLogin('profileowner');
    const other = await registerAndLogin('profileother');

    const res = await request(app)
      .put(`/users/${owner.userId}`)
      .set('Cookie', other.cookie)
      .send({ bio: 'hacked' });

    expect(res.status).toBe(403);
  });

  test('returns 400 when bio exceeds 160 characters', async () => {
    const { cookie, userId } = await registerAndLogin('updateuser3');

    const res = await request(app)
      .put(`/users/${userId}`)
      .set('Cookie', cookie)
      .send({ bio: 'a'.repeat(161) });

    expect(res.status).toBe(400);
  });

  test('successfully updates bio and returns 200', async () => {
    const { cookie, userId } = await registerAndLogin('updateuser4');

    const res = await request(app)
      .put(`/users/${userId}`)
      .set('Cookie', cookie)
      .send({ bio: 'my new bio' });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('my new bio');
  });

  test('bio update is persisted in DB', async () => {
    const { cookie, userId } = await registerAndLogin('updateuser5');

    await request(app)
      .put(`/users/${userId}`)
      .set('Cookie', cookie)
      .send({ bio: 'persisted bio' });

    const user = await User.findById(userId);
    expect(user.bio).toBe('persisted bio');
  });

  test('successfully updates profileImage URL and returns 200', async () => {
    const { cookie, userId } = await registerAndLogin('updateuser6');

    const res = await request(app)
      .put(`/users/${userId}`)
      .set('Cookie', cookie)
      .send({ profileImage: 'https://example.com/avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.profileImage).toBe('https://example.com/avatar.png');
  });

  test('cannot update username via this route', async () => {
    const { cookie, userId } = await registerAndLogin('updateuser7');

    await request(app)
      .put(`/users/${userId}`)
      .set('Cookie', cookie)
      .send({ username: 'hacked' });

    const user = await User.findById(userId);
    expect(user.username).toBe('updateuser7');
  });

  test('cannot update password via this route', async () => {
    const { cookie, userId } = await registerAndLogin('updateuser8');

    const before = (await User.findById(userId)).password;

    await request(app)
      .put(`/users/${userId}`)
      .set('Cookie', cookie)
      .send({ password: 'newpassword' });

    const after = (await User.findById(userId)).password;
    expect(after).toBe(before);
  });
});
