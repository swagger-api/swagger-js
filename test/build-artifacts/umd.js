import SwaggerClient from '../../dist/swagger-client.browser.js';
import SwaggerClientMin from '../../dist/swagger-client.browser.min.js';

describe('webpack browser umd build', () => {
  test('should export a function', () => {
    expect(SwaggerClient).toBeInstanceOf(Function);
  });

  test('should export helpers attached to the default export', () => {
    expect(SwaggerClient.http).toBeInstanceOf(Function);
    expect(SwaggerClient.makeHttp).toBeInstanceOf(Function);
    expect(SwaggerClient.resolve).toBeInstanceOf(Function);
    expect(SwaggerClient.resolveSubtree).toBeInstanceOf(Function);
    expect(SwaggerClient.execute).toBeInstanceOf(Function);
    expect(SwaggerClient.serializeRes).toBeInstanceOf(Function);
    expect(SwaggerClient.serializeHeaders).toBeInstanceOf(Function);
    expect(SwaggerClient.clearCache).toBeInstanceOf(Function);
    expect(SwaggerClient.makeApisTagOperation).toBeInstanceOf(Function);
    expect(SwaggerClient.buildRequest).toBeInstanceOf(Function);
    expect(Object.keys(SwaggerClient.helpers)).toContain('opId');
    expect(SwaggerClient.getBaseUrl).toBeInstanceOf(Function);
  });

  test('should be able to resolve things when minified', async () => {
    const spec = {
      a: {
        $ref: '#/b',
      },
      b: {
        value: {
          $ref: '#/c/value',
        },
      },
      c: {
        value: 1234,
      },
    };

    const res = await SwaggerClient.resolve({
      spec,
      allowMetaPatches: false,
    });

    expect(res.errors).toEqual([]);
    expect(res.spec).toEqual({
      a: {
        value: 1234,
      },
      b: {
        value: 1234,
      },
      c: {
        value: 1234,
      },
    });
  });
});

describe('webpack browser umd minimized build', () => {
  test('should export a function', () => {
    expect(SwaggerClientMin).toBeInstanceOf(Function);
  });

  test('should export helpers attached to the default export', () => {
    expect(SwaggerClientMin.http).toBeInstanceOf(Function);
    expect(SwaggerClientMin.makeHttp).toBeInstanceOf(Function);
    expect(SwaggerClientMin.resolve).toBeInstanceOf(Function);
    expect(SwaggerClientMin.resolveSubtree).toBeInstanceOf(Function);
    expect(SwaggerClientMin.execute).toBeInstanceOf(Function);
    expect(SwaggerClientMin.serializeRes).toBeInstanceOf(Function);
    expect(SwaggerClientMin.serializeHeaders).toBeInstanceOf(Function);
    expect(SwaggerClientMin.clearCache).toBeInstanceOf(Function);
    expect(SwaggerClientMin.makeApisTagOperation).toBeInstanceOf(Function);
    expect(SwaggerClientMin.buildRequest).toBeInstanceOf(Function);
    expect(Object.keys(SwaggerClientMin.helpers)).toContain('opId');
    expect(SwaggerClientMin.getBaseUrl).toBeInstanceOf(Function);
  });

  test('should be able to resolve things when minified', async () => {
    const spec = {
      a: {
        $ref: '#/b',
      },
      b: {
        value: {
          $ref: '#/c/value',
        },
      },
      c: {
        value: 1234,
      },
    };

    const res = await SwaggerClientMin.resolve({
      spec,
      allowMetaPatches: false,
    });

    expect(res.errors).toEqual([]);
    expect(res.spec).toEqual({
      a: {
        value: 1234,
      },
      b: {
        value: 1234,
      },
      c: {
        value: 1234,
      },
    });
  });
});
