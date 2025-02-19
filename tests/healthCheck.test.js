const request = require('supertest');
const app = require('../app'); // Import the Express app
const { sequelize } = require('../db/config'); // Import Sequelize instance
let server; // For tracking the server instance if needed

// Helper function to close the server and Sequelize connection gracefully
const closeResources = async () => {
  if (server && server.close) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
  await sequelize.close();
};

describe('Health Check Routes', () => {
  beforeAll(async () => {
    try {
      await sequelize.authenticate(); // Ensure database connection
      server = app.listen(0); // Start the app on a random available port for testing
    } catch (error) {
      console.error('Database is down, tests may fail', error);
    }
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await sequelize.close(); // Ensure the database connection is closed
  });
  

  afterEach(async () => {
    jest.restoreAllMocks(); // Restore mocked functions after each test

    // Flush any pending microtasks to prevent open handle warnings
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
    const mock = jest.spyOn(sequelize, 'authenticate').mockRejectedValue(new Error('Database is down'));

    const response = await request(server).get('/healthz');
    expect(response.status).toBe(503);

    mock.mockRestore(); // Restore after the test
  });
});
