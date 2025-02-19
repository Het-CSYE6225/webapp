const request = require('supertest');
const app = require('../app'); 
const { sequelize } = require('../db/config'); 
const { setImmediate } = require('timers'); 
const { globalAgent } = require('http'); 
let server; 

describe('Health Check Routes', () => {
  beforeAll(async () => {
    try {
      await sequelize.authenticate(); 
      server = app.listen(0); 
    } catch (error) {
      console.error('Database is down, tests may fail', error);
    }
  });

  afterAll(async () => {
    console.log('Closing all resources...');

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    if (sequelize) {
      await sequelize.close();
    }

    // Close open HTTP connections
    globalAgent.destroy();

    // Allow all microtasks to finish before Jest exits
    await new Promise((resolve) => setImmediate(resolve));
  });

  afterEach(async () => {
    jest.restoreAllMocks(); 
    await new Promise((resolve) => setImmediate(resolve)); 
  });

  test('GET /healthz should return 200 OK when the database is up', async () => {
    const response = await request(server).get('/healthz');
    expect(response.status).toBe(200);
  });

  const methods = ['post', 'put', 'delete', 'patch', 'options'];
  methods.forEach((method) => {
    test(`${method.toUpperCase()} /healthz should return 405 Method Not Allowed`, async () => {
      const response = await request(server)[method]('/healthz');
      expect(response.status).toBe(405);
    });
  });

  test('GET /healthz with payload should return 400 Bad Request', async () => {
    const response = await request(server).get('/healthz').send({ key: 'value' });
    expect(response.status).toBe(400);
    expect(response.text).toBe('GET requests should not have a body.');
  });

  test('GET /healthz with query parameters should return 400 Bad Request', async () => {
    const response = await request(server).get('/healthz?param=value');
    expect(response.status).toBe(400);
    expect(response.text).toContain('GET requests should not have query parameters');
  });

  test('Database down should return 503 Service Unavailable', async () => {
    jest.spyOn(sequelize, 'authenticate').mockRejectedValue(new Error('Database is down'));

    const response = await request(server).get('/healthz');
    expect(response.status).toBe(503);
  });
});
