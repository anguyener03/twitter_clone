const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

async function registerAndLogin(username, password = 'password123') {
  await request(app).post('/auth/register').send({ username, password });
  const res = await request(app).post('/auth/login').send({ username, password });
  return { cookie: res.headers['set-cookie'] };
}

// ---------------------------------------------------------------------------
// GET /users/search?q=
// ---------------------------------------------------------------------------

describe('GET /users/search', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/users/search?q=alice');
    expect(res.status).toBe(401);
  });

  test('returns empty array when no users match', async () => {
    const { cookie } = await registerAndLogin('searchuser1');
    const res = await request(app).get('/users/search?q=zzznomatch').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns matching users by partial username', async () => {
    const { cookie } = await registerAndLogin('findme_alpha');
    await request(app).post('/auth/register').send({ username: 'findme_beta', password: 'password123' });

    const res = await request(app).get('/users/search?q=findme').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const names = res.body.map(u => u.username);
    expect(names).toContain('findme_alpha');
    expect(names).toContain('findme_beta');
  });

  test('search is case insensitive', async () => {
    const { cookie } = await registerAndLogin('CasedUser');

    const res = await request(app).get('/users/search?q=caseduser').set('Cookie', cookie);

    expect(res.status).toBe(200);
    const names = res.body.map(u => u.username);
    expect(names).toContain('CasedUser');
  });

  test('does not expose password in results', async () => {
    const { cookie } = await registerAndLogin('nosecretuser');

    const res = await request(app).get('/users/search?q=nosecretuser').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].password).toBeUndefined();
  });

  test('returns 400 when query param is missing', async () => {
    const { cookie } = await registerAndLogin('searchuser2');
    const res = await request(app).get('/users/search').set('Cookie', cookie);

    expect(res.status).toBe(400);
  });
});
