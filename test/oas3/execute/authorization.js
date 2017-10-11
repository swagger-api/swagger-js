import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import jsYaml from 'js-yaml'

import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../src/execute'


// OAS 3.0 Authorization
//
// Testing TODO:
// - [ ] Ignore `Authorization` header parameters
// - [ ] OAuth2 with credentials in constructor
// - [ ] OAuth2 with credentials through buildRequest/execute
// - [ ] HTTP Basic with credentials in constructor
// - [ ] HTTP Basic with credentials through buildRequest/execute
// - [ ] HTTP Bearer with credentials in constructor
// - [ ] HTTP Bearer with credentials through buildRequest/execute

describe.only('Authorization - OpenAPI Specification 3.0', function () {
  it('should ignore a header parameter named `Authorization`', () => {
    const spec = {
      openapi: '3.0.0',
      paths: {
        '/': {
          get: {
            operationId: 'myOperation',
            parameters: [
              {
                name: 'Authorization',
                in: 'header'
              }
            ]
          }
        }
      }
    }

    // when
    const req = buildRequest({
      spec,
      operationId: 'myOperation',
      parameters: {
        Authorization: 'myAuthValue'
      }
    })

    expect(req).toEqual({
      method: 'GET',
      url: '/',
      credentials: 'same-origin',
      headers: {},
    })
  })

  describe('OAuth2', () => {
    describe('implicit', () => {
      it('should build a request with constructor credentials', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'Authorization',
                    in: 'header'
                  }
                ]
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          parameters: {
            Authorization: 'myAuthValue'
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
      it('should build a request with buildRequest credentials', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'Authorization',
                    in: 'header'
                  }
                ]
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          parameters: {
            Authorization: 'myAuthValue'
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
      it('should set buildRequest credentials over constructor', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'Authorization',
                    in: 'header'
                  }
                ]
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          parameters: {
            Authorization: 'myAuthValue'
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
    describe('password', () => {

    })
    describe('application', () => {

    })
    describe('access code', () => {

    })
  })
})
