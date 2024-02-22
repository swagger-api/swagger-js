import { Blob } from 'node:buffer';
import process from 'node:process';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { ReadableStream } from 'node:stream/web';
import { fetch, Headers, Request, Response, FormData, File } from 'undici';

// force using undici for testing
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.FormData = FormData;
globalThis.File = File;
globalThis.Blob = Blob;
globalThis.ReadableStream = ReadableStream;

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

  // makes node:http and undici work properly
  if (process.version.startsWith('v18') || process.version.startsWith('v16')) {
    server.keepAliveTimeout = 100;
  }
  server.listen(port);

  server.terminate = () =>
    new Promise((resolve) => {
      server.close(() => resolve(server));
    });

  return server;
};
