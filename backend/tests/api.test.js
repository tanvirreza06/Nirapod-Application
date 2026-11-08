const request = require('supertest');
const app = require('../app');

describe('Nirapod API', () => {
  test('health route says ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('register needs name, email and password', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  test('login needs email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('me route blocks requests without a token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Login required');
  });

  test('contacts route blocks requests without a token', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(401);
  });

  test('sos start blocks requests without a token', async () => {
    const res = await request(app).post('/api/sos/start');
    expect(res.status).toBe(401);
  });
});