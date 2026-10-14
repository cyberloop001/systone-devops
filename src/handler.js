'use strict';

const fs = require('fs');
const path = require('path');
const { grade } = require('./grader');

const HTML = fs.readFileSync(path.join(__dirname, 'ui', 'index.html'), 'utf8');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * AWS Lambda handler. Supports both API Gateway REST API (v1) and HTTP API (v2) events.
 */
exports.handler = async (event) => {
  const method = (
    event.httpMethod ||
    event.requestContext?.http?.method ||
    'GET'
  ).toUpperCase();

  const rawPath = event.path || event.rawPath || '/';

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (method === 'GET' && (rawPath === '/' || rawPath === '')) {
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
      body: HTML,
    };
  }

  if (method === 'POST' && rawPath === '/convert') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return jsonResponse(400, { error: 'Request body must be valid JSON.' });
    }

    const { inputValue, inputUnit, targetUnit, studentResponse } = body;

    const missing = ['inputValue', 'inputUnit', 'targetUnit', 'studentResponse'].filter(
      (k) => body[k] === undefined || body[k] === null
    );
    if (missing.length > 0) {
      return jsonResponse(400, {
        error: `Missing required field(s): ${missing.join(', ')}`,
      });
    }

    const result = grade(inputValue, inputUnit, targetUnit, studentResponse);
    return jsonResponse(200, result);
  }

  return jsonResponse(404, { error: 'Not Found' });
};
