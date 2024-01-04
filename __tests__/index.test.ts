import request from 'supertest';

import app from '../src/server';

describe('Test Express + TypeScript server', () => {
  it('should get route "/"', async () => {
    const res = await request(app).get('/');
    expect(res.text).toEqual('Express + TypeScript Server');
  });
});
