/* global describe, it */

'use strict';

var expect = require('expect');
var Operation = require('../lib/types/operation');
var OperationParams = require( '../lib/types/OperationParams.js' );
describe('header extraction', function () {
  it('should extract header params', function () {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'string'
      }
    ];
    var op = new Operation(new OperationParams(), 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = new OperationParams();
    args.set( 'header', 'myHeader', 'tony' );
    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('tony');
  });


  it('should not URL encode header string values', function () {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'string'
      }
    ];
    var op = new Operation(new OperationParams(), 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = new OperationParams();
    args.set( 'header', 'myHeader', 'someKey=someValue' );
    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('someKey=someValue');
  });

  it('should not URL encode header string array values', function () {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'array',
        items: {
          type: 'string'
        }
      }
    ];
    var op = new Operation(new OperationParams(), 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = new OperationParams();
    args.set( 'header', 'myHeader', ['firstParam=firstValue', 'secondParam=secondValue'] );

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('firstParam=firstValue,secondParam=secondValue');
  });

  it('should extract header params with string array with default collectionFormat', function () {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'array',
        items: {
          type: 'string'
        }
      }
    ];
    var op = new Operation(new OperationParams(), 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = new OperationParams();
    args.set( 'header', 'myHeader', ['tony', 'tam'] );

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('tony,tam');
  });

  it('should distinct header params from query params that have the same names', function(){
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'array',
        items: {
          type: 'string'
        }
      },
      {
        in: 'query',
        name: 'myHeader',
        type: 'string',
        items: {
          type: 'string'
        }
      }
    ];

    var op = new Operation(new OperationParams(), 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = new OperationParams();
    args.set( 'header', 'myHeader', ['tony', 'tam'] );
    args.set( 'query', 'myHeader', 'johnny' );

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe( 'http://localhost/path?myHeader=johnny');
    expect(headers.myHeader).toBe('tony,tam');

  } );
});
