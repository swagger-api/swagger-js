// https://github.com/swagger-api/swagger-ui/issues/4071
import { buildRequest } from '../../src/execute/index.js';

const spec = {
  openapi: '3.0.0',
  servers: [
    {
      url: 'https://workbcjobs.api.gov.bc.ca/v1',
    },
  ],
  paths: {
    '/jobs': {
      post: {
        operationId: 'postJobs',
        description:
          'The job feed endpoint returns an array of job records that satisfy the supplied criteria.',
        responses: {
          default: {
            description: 'Unexpected error',
          },
        },
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  industries: {
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                },
              },
              encoding: {
                industries: {
                  style: 'form',
                  explode: false,
                },
              },
            },
          },
        },
      },
    },
  },
};

test('should generate a request with application/x-www-form-urlencoded', () => {
  const req = buildRequest({
    spec,
    requestContentType: 'application/x-www-form-urlencoded',
    operationId: 'postJobs',
    requestBody: {
      industries: [1, 16],
    },
  });

  expect(req).toEqual({
    url: 'https://workbcjobs.api.gov.bc.ca/v1/jobs',
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'industries=1%2C16',
  });
});
