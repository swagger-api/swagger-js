import fetchMock from 'fetch-mock'
import fetch, {Headers, Request, Response} from 'cross-fetch'

fetchMock.config.fetch = fetch
fetchMock.config.Request = Request
fetchMock.config.Response = Response
fetchMock.config.Headers = Headers
