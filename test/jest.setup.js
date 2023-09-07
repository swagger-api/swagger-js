import process from 'node:process';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import fetchMock from 'fetch-mock';
import fetch, { Headers, Request, Response } from 'cross-fetch';
import AbortController from 'abort-controller';

// configures fetchMock
fetchMock.config.fetch = fetch;
fetchMock.config.Request = Request;
fetchMock.config.Response = Response;
fetchMock.config.Headers = Headers;

// force node-fetch to be used even for Node.js >= 18 where native fetch exists
globalThis.fetch = fetch;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.Headers = Headers;

// provide AbortController for older Node.js versions
globalThis.AbortController = globalThis.AbortController ?? AbortController;

// helpers for reading local files
globalThis.loadFile = (uri) => fs.readFileSync(uri).toString();
globalThis.loadJsonFile = (uri) => JSON.parse(globalThis.loadFile(uri));

// helper for providing HTTP server instance for testing
globalThis.createHTTPServer = ({ port = 8123, cwd = process.cwd() } = {}) => {
  const server = http.createServer((req, res) => {
    const filePath = path.join(cwd, req.url || '/favicon.ico');

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const data = fs.readFileSync(filePath).toString();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  });

  server.listen(port);

  server.terminate = () =>
    new Promise((resolve) => {
      server.close(() => resolve(server));
    });

  return server;
};
