const request = require('supertest');
const app = require('../app');
const dbHandler = require('./db.setup');

// Увеличиваем таймаут, так как скачивание и запуск бинарника mongodb-memory-server может занять время
jest.setTimeout(30000);

// Устанавливаем In-memory MongoDB
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('API Routes', () => {

  it('GET /health должен возвращать статус ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('POST /api/items должен создавать элемент', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Test Object' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('name', 'Test Object');
  });

  it('GET /api/items должен возвращать список элементов', async () => {
    // Сначала создаем
    await request(app).post('/api/items').send({ name: 'Object 1' });
    await request(app).post('/api/items').send({ name: 'Object 2' });

    // Проверяем
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });
});
