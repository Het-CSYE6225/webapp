const request = require('supertest');
const { app, server } = require('../app');
const { sequelize } = require('../db/config');
const { setImmediate } = require('timers');
const { globalAgent } = require('http');
require('dotenv').config();

jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('Health Check Routes', () => {
  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ force: true });
      if (!server) {
        throw new Error('Server failed to initialize');
      }
    } catch (error) {
      console.error('Database is down, tests may fail', error);
    }
  });

  afterAll(async () => {
    console.log('Closing all resources...');
    await new Promise(resolve => {
      if (server) {
        server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    await sequelize.close();
    await new Promise(resolve => setImmediate(resolve));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await new Promise(resolve => setImmediate(resolve));
  });

  test('GET /healthz should return 200 OK when the database is up', async () => {
    try {
      const response = await request(app).get('/healthz');
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  const methods = ['post', 'put', 'delete', 'patch', 'options'];
  methods.forEach((method) => {
    test(`${method.toUpperCase()} /healthz should return 405 Method Not Allowed`, async () => {
      const response = await request(app)[method]('/healthz');
      expect(response.status).toBe(405);
    });
  });

  test('GET /healthz with payload should return 400 Bad Request', async () => {
    const response = await request(app).get('/healthz').send({ key: 'value' });
    expect(response.status).toBe(400);
    expect(response.text).toBe('GET requests should not have a body.');
  });

  test('GET /healthz with query parameters should return 400 Bad Request', async () => {
    const response = await request(app).get('/healthz?param=value');
    expect(response.status).toBe(400);
    expect(response.text).toContain('GET requests should not have query parameters');
  });

  test('Database down should return 503 Service Unavailable', async () => {
    jest.spyOn(sequelize, 'authenticate').mockRejectedValue(new Error('Database is down'));
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(503);
  });
});
