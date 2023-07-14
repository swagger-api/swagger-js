import path from 'node:path';
import { mediaTypes, isParameterElement } from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate } from '@swagger-api/apidom-json-pointer';
import { parse, dereferenceApiDOM } from '@swagger-api/apidom-reference/configuration/empty';

import * as jestSetup from '../__utils__/jest.local.setup.js';

const rootFixturePath = path.join(__dirname, '__fixtures__');

describe('dereference', () => {
  beforeAll(() => {
    jestSetup.beforeAll();
  });

  afterAll(() => {
    jestSetup.afterAll();
  });

  describe('strategies', () => {
    describe('openapi-3-1-swagger-client', () => {
      describe('Reference Object', () => {
        describe('given single ReferenceElement passed to dereferenceApiDOM with internal references', () => {
          describe('given dereferencing using local file system', () => {
            const fixturePath = path.join(__dirname, '__fixtures__', 'internal-only', 'root.json');

            test('should dereference', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate('/components/parameters/userId', parseResult.api);
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: {
                  baseURI: `${fixturePath}#/components/parameters/userId`,
                },
              });

              expect(isParameterElement(dereferenced)).toBe(true);
            });

            test('should dereference and contain metadata about origin', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate('/components/parameters/userId', parseResult.api);
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: `${fixturePath}#/components/parameters/userId` },
              });

              expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
                expect.stringMatching(/internal-only\/root\.json$/)
              );
            });
          });

          describe('given dereferencing using HTTP protocol', () => {
            const fixturePath = path.join(__dirname, '__fixtures__', 'internal-only', 'root.json');
            const httpPort = 8123;
            let httpServer;

            beforeEach(() => {
              const cwd = path.join(__dirname, '__fixtures__', 'internal-only');
              httpServer = globalThis.createHTTPServer({ port: httpPort, cwd });
            });

            afterEach(async () => {
              await httpServer.terminate();
            });

            test('should dereference', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate('/components/parameters/userId', parseResult.api);
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: {
                  baseURI: `http://localhost:${httpPort}/root.json#/components/parameters/userId`,
                },
              });

              expect(isParameterElement(dereferenced)).toBe(true);
            });

            test('should dereference and contain metadata about origin', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate('/components/parameters/userId', parseResult.api);
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: {
                  baseURI: `http://localhost:${httpPort}/root.json#/components/parameters/userId`,
                },
              });

              expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
                expect.stringMatching(/\/root\.json$/)
              );
            });
          });
        });

        describe('given single ReferenceElement passed to dereferenceApiDOM with external references', () => {
          describe('given dereferencing using local file system', () => {
            const fixturePath = path.join(rootFixturePath, 'external-only', 'root.json');

            test('should dereference', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate(
                '/components/parameters/externalRef',
                parseResult.api
              );
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: fixturePath },
              });

              expect(isParameterElement(dereferenced)).toBe(true);
            });

            test('should dereference and contain metadata about origin', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate(
                '/components/parameters/externalRef',
                parseResult.api
              );
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: fixturePath },
              });

              expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
                expect.stringMatching(/external-only\/ex\.json$/)
              );
            });
          });

          describe('given dereferencing using HTTP protocol', () => {
            const fixturePath = path.join(rootFixturePath, 'external-only', 'root.json');
            const httpPort = 8123;
            let httpServer;

            beforeEach(() => {
              const cwd = path.join(rootFixturePath, 'external-only');
              httpServer = globalThis.createHTTPServer({ port: httpPort, cwd });
            });

            afterEach(async () => {
              await httpServer.terminate();
            });

            test('should dereference', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate(
                '/components/parameters/externalRef',
                parseResult.api
              );
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: `http://localhost:${httpPort}/root.json` },
              });

              expect(isParameterElement(dereferenced)).toBe(true);
            });

            test('should dereference and contain metadata about origin', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate(
                '/components/parameters/externalRef',
                parseResult.api
              );
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: `http://localhost:${httpPort}/root.json` },
              });

              expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
                expect.stringMatching(/\/ex\.json$/)
              );
            });
          });

          describe('given dereferencing using HTTP protocol and absolute URLs', () => {
            const fixturePath = path.join(
              rootFixturePath,
              'external-only-absolute-url',
              'root.json'
            );
            const httpPort = 8123;
            let httpServer;

            beforeEach(() => {
              const cwd = path.join(rootFixturePath, 'external-only-absolute-url');
              httpServer = globalThis.createHTTPServer({ port: httpPort, cwd });
            });

            afterEach(async () => {
              await httpServer.terminate();
            });

            test('should dereference', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate(
                '/components/parameters/externalRef',
                parseResult.api
              );
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: `http://localhost:${httpPort}/root.json` },
              });

              expect(isParameterElement(dereferenced)).toBe(true);
            });

            test('should dereference and contain metadata about origin', async () => {
              const parseResult = await parse(fixturePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const referenceElement = evaluate(
                '/components/parameters/externalRef',
                parseResult.api
              );
              const dereferenced = await dereferenceApiDOM(referenceElement, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { baseURI: `http://localhost:${httpPort}/root.json` },
              });

              expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
                expect.stringMatching(/\/ex\.json$/)
              );
            });
          });
        });
      });
    });
  });
});
