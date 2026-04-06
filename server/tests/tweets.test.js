const request = require('supertest');
const app = require('../app');
const Tweet = require('../models/tweet');
const User = require('../models/user');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerAndLogin(username = 'testuser', password = 'password123') {
  await request(app).post('/auth/register').send({ username, password });
  const res = await request(app).post('/auth/login').send({ username, password });
  const cookie = res.headers['set-cookie'];
  // Look up the user directly — avoids dealing with URL-encoded cookie values
  const user = await User.findOne({ username });
  return { cookie, userId: user._id.toString() };
}

// ---------------------------------------------------------------------------
// POST /tweets/create
// ---------------------------------------------------------------------------

describe('POST /tweets/create', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/tweets/create')
      .send({ text: 'hello world' });

    expect(res.status).toBe(401);
  });

  test('returns 400 when text field is missing', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({});

    expect(res.status).toBe(400);
  });

  test('returns 400 when text is an empty string', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when text exceeds 280 characters', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'a'.repeat(281) });

    expect(res.status).toBe(400);
  });

  test('creates tweet and returns 201 with tweet object', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'my first tweet' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      text: 'my first tweet',
    });
    expect(res.body._id).toBeDefined();
    expect(res.body.author).toBeDefined();
    expect(res.body.created).toBeDefined();
  });

  test('adds tweet _id to the user tweets array in the database', async () => {
    const { cookie, userId } = await registerAndLogin();

    const res = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'check user tweets array' });

    expect(res.status).toBe(201);

    const user = await User.findById(userId);
    expect(user.tweets.map(String)).toContain(res.body._id);
  });
});

// ---------------------------------------------------------------------------
// GET /tweets/feed
// ---------------------------------------------------------------------------

describe('GET /tweets/feed', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/tweets/feed');
    expect(res.status).toBe(401);
  });

  test('returns empty array when no tweets exist', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .get('/tweets/feed')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all tweets sorted newest first', async () => {
    const { cookie } = await registerAndLogin();

    await request(app).post('/tweets/create').set('Cookie', cookie).send({ text: 'first tweet' });
    await request(app).post('/tweets/create').set('Cookie', cookie).send({ text: 'second tweet' });
    await request(app).post('/tweets/create').set('Cookie', cookie).send({ text: 'third tweet' });

    const res = await request(app)
      .get('/tweets/feed')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    // Newest tweet should be first
    expect(res.body[0].text).toBe('third tweet');
    expect(res.body[2].text).toBe('first tweet');
  });

  test('populates author username on each tweet', async () => {
    const { cookie } = await registerAndLogin('authoruser');

    await request(app).post('/tweets/create').set('Cookie', cookie).send({ text: 'authored tweet' });

    const res = await request(app)
      .get('/tweets/feed')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].author).toBeDefined();
    expect(res.body[0].author.username).toBe('authoruser');
    // Password should NOT be exposed
    expect(res.body[0].author.password).toBeUndefined();
  });

  test('returns tweets from followed users and own tweets', async () => {
    const user1 = await registerAndLogin('alice');
    const user2 = await registerAndLogin('bob');

    await request(app).post('/tweets/create').set('Cookie', user1.cookie).send({ text: 'alice tweet' });
    await request(app).post('/tweets/create').set('Cookie', user2.cookie).send({ text: 'bob tweet' });

    // alice follows bob so bob's tweet appears in her feed
    const bobUser = await User.findOne({ username: 'bob' });
    await request(app)
      .post(`/users/${bobUser._id}/follow`)
      .set('Cookie', user1.cookie);

    const res = await request(app)
      .get('/tweets/feed')
      .set('Cookie', user1.cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    const texts = res.body.map(t => t.text);
    expect(texts).toContain('alice tweet');
    expect(texts).toContain('bob tweet');
  });
});

// ---------------------------------------------------------------------------
// DELETE /tweets/:id
// ---------------------------------------------------------------------------

describe('DELETE /tweets/:id', () => {
  test('returns 401 when not authenticated', async () => {
    // Create a tweet with a valid-looking id to get a 401 not 404
    const { cookie } = await registerAndLogin();
    const createRes = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'to be deleted' });

    const res = await request(app).delete(`/tweets/${createRes.body._id}`);
    expect(res.status).toBe(401);
  });

  test('returns 404 when tweet does not exist', async () => {
    const { cookie } = await registerAndLogin();
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1'; // valid ObjectId, non-existent

    const res = await request(app)
      .delete(`/tweets/${fakeId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
  });

  test('returns 403 when trying to delete another user\'s tweet', async () => {
    const owner = await registerAndLogin('owner');
    const other = await registerAndLogin('other');

    const createRes = await request(app)
      .post('/tweets/create')
      .set('Cookie', owner.cookie)
      .send({ text: "owner's tweet" });

    const res = await request(app)
      .delete(`/tweets/${createRes.body._id}`)
      .set('Cookie', other.cookie);

    expect(res.status).toBe(403);
  });

  test('successfully deletes own tweet and returns 200', async () => {
    const { cookie } = await registerAndLogin();

    const createRes = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'delete me' });

    const res = await request(app)
      .delete(`/tweets/${createRes.body._id}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
  });

  test('tweet no longer exists in database after deletion', async () => {
    const { cookie } = await registerAndLogin();

    const createRes = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'gone after delete' });

    await request(app)
      .delete(`/tweets/${createRes.body._id}`)
      .set('Cookie', cookie);

    const tweet = await Tweet.findById(createRes.body._id);
    expect(tweet).toBeNull();
  });

  test('tweet _id is removed from user tweets array after deletion', async () => {
    const { cookie, userId } = await registerAndLogin();

    const createRes = await request(app)
      .post('/tweets/create')
      .set('Cookie', cookie)
      .send({ text: 'remove from array' });

    await request(app)
      .delete(`/tweets/${createRes.body._id}`)
      .set('Cookie', cookie);

    const user = await User.findById(userId);
    expect(user.tweets.map(String)).not.toContain(createRes.body._id);
  });
});
