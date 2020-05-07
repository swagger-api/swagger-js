import fetchMock from 'fetch-mock'
import {Headers, Request, Response} from 'cross-fetch'

fetchMock.setImplementations({
  Promise,
  Request,
  Response,
  Headers
})
