const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

async function registerAndLogin(username, password = 'password123') {
  await request(app).post('/auth/register').send({ username, password });
  const res = await request(app).post('/auth/login').send({ username, password });
  return { cookie: res.headers['set-cookie'], res };
}

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------

describe('POST /auth/logout', () => {
  test('returns 200', async () => {
    const { cookie } = await registerAndLogin('logoutuser1');
    const res = await request(app).post('/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  test('after logout, /auth/me returns 401', async () => {
    const { cookie } = await registerAndLogin('logoutuser2');
    await request(app).post('/auth/logout').set('Cookie', cookie);

    // Use an agent to persist cookie state
    const agent = request.agent(app);
    await agent.post('/auth/register').send({ username: 'logoutuser3', password: 'password123' });
    await agent.post('/auth/login').send({ username: 'logoutuser3', password: 'password123' });
    await agent.post('/auth/logout');
    const res = await agent.get('/auth/me');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------

describe('GET /auth/me', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 200 with _id and username when authenticated', async () => {
    const { cookie } = await registerAndLogin('meuser1');
    const res = await request(app).get('/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('meuser1');
    expect(res.body._id).toBeDefined();
  });

  test('does not expose password', async () => {
    const { cookie } = await registerAndLogin('meuser2');
    const res = await request(app).get('/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
  });
});
