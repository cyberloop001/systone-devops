'use strict';

const { handler } = require('../src/handler');

function makeEvent(method, path, body = null) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: { 'Content-Type': 'application/json' },
  };
}

describe('GET / — serves HTML', () => {
  test('returns 200 with HTML content-type', async () => {
    const res = await handler(makeEvent('GET', '/'));
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toMatch('text/html');
    expect(res.body).toContain('<!DOCTYPE html>');
  });
});

describe('OPTIONS — CORS preflight', () => {
  test('returns 204 with CORS headers', async () => {
    const res = await handler(makeEvent('OPTIONS', '/convert'));
    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

describe('POST /convert — happy path', () => {
  test('correct answer', async () => {
    const res = await handler(
      makeEvent('POST', '/convert', {
        inputValue: 84.2,
        inputUnit: 'fahrenheit',
        targetUnit: 'rankine',
        studentResponse: '543.94',
      })
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.result).toBe('correct');
  });

  test('incorrect answer', async () => {
    const res = await handler(
      makeEvent('POST', '/convert', {
        inputValue: 317.33,
        inputUnit: 'kelvin',
        targetUnit: 'fahrenheit',
        studentResponse: '111.554',
      })
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.result).toBe('incorrect');
  });

  test('non-numeric student response → incorrect', async () => {
    const res = await handler(
      makeEvent('POST', '/convert', {
        inputValue: 6.5,
        inputUnit: 'fahrenheit',
        targetUnit: 'rankine',
        studentResponse: 'dog',
      })
    );
    const body = JSON.parse(res.body);
    expect(body.result).toBe('incorrect');
  });

  test('invalid unit → invalid', async () => {
    const res = await handler(
      makeEvent('POST', '/convert', {
        inputValue: 136.1,
        inputUnit: 'dogcow',
        targetUnit: 'celsius',
        studentResponse: '45.32',
      })
    );
    const body = JSON.parse(res.body);
    expect(body.result).toBe('invalid');
  });
});

describe('POST /convert — input validation', () => {
  test('missing fields returns 400', async () => {
    const res = await handler(makeEvent('POST', '/convert', { inputValue: 100 }));
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/Missing required/i);
  });

  test('malformed JSON body returns 400', async () => {
    const event = { httpMethod: 'POST', path: '/convert', body: '{bad json' };
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/valid JSON/i);
  });
});

describe('Unknown routes', () => {
  test('GET /unknown returns 404', async () => {
    const res = await handler(makeEvent('GET', '/unknown'));
    expect(res.statusCode).toBe(404);
  });
});
