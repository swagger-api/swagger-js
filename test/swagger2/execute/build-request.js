import {buildRequest} from '../../../src/execute'

describe('buildRequest - swagger 2.0', () => {
  it('should include empty parameter values for a query param with allowEmptyValue', () => {
    const spec = {
      swagger: '2.0',
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [
              {
                name: 'name',
                in: 'query',
                allowEmptyValue: true
              }
            ]
          }
        }
      }
    }

    // when
    const req = buildRequest({
      spec,
      operationId: 'getMe',
      parameters: {
        name: ''
      }
    })

    expect(req).toMatchObject({
      method: 'GET',
      url: '/one?name=',
      credentials: 'same-origin',
      headers: {},
    })
  })

  it('should not include omitted parameter values for a query param with allowEmptyValue', () => {
    const spec = {
      swagger: '2.0',
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [
              {
                name: 'name',
                in: 'query',
                allowEmptyValue: true
              }
            ]
          }
        }
      }
    }

    // when
    const req = buildRequest({
      spec,
      operationId: 'getMe',
      parameters: {}
    })

    expect(req).toMatchObject({
      method: 'GET',
      url: '/one',
      credentials: 'same-origin',
      headers: {},
    })
  })

  it('should not include empty parameter values for a query param lacking allowEmptyValue', () => {
    const spec = {
      swagger: '2.0',
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [
              {
                name: 'name',
                in: 'query'
              }
            ]
          }
        }
      }
    }

    // when
    const req = buildRequest({
      spec,
      operationId: 'getMe',
      parameters: {
        name: ''
      }
    })

    expect(req).toMatchObject({
      method: 'GET',
      url: '/one',
      credentials: 'same-origin',
      headers: {},
    })
  })

  it('should not include omitted parameter values for a query param lacking allowEmptyValue', () => {
    const spec = {
      swagger: '2.0',
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [
              {
                name: 'name',
                in: 'query'
              }
            ]
          }
        }
      }
    }

    // when
    const req = buildRequest({
      spec,
      operationId: 'getMe',
      parameters: {}
    })

    expect(req).toMatchObject({
      method: 'GET',
      url: '/one',
      credentials: 'same-origin',
      headers: {},
    })
  })
})
