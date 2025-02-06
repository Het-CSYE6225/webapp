const request = require('supertest');
const app = require('../app'); // Import the Express app
const { sequelize } = require('../db/config'); // Import Sequelize instance

describe('Health Check Routes', () => {
  beforeAll(async () => {
    try {
      await sequelize.authenticate(); // Ensure database connection
    } catch (error) {
      console.error('Database is down, tests may fail');
    }
  });

  afterAll(async () => {
    await sequelize.close(); // Close DB connection after tests
  });

  test('GET /healthz should return 200 OK when the database is up', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
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

    sequelize.authenticate.mockRestore(); 
  });
});
