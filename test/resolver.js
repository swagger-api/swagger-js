import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import jsYaml from '@kyleshockey/js-yaml'

import Swagger from '../src'

describe('resolver', () => {
  afterEach(() => {
    // Restore all xhr/http mocks
    xmock().restore()
    // Clear the http cache
    Swagger.clearCache()
  })

  test('should expose a resolver function', () => {
    expect(Swagger.resolve).toBeInstanceOf(Function)
  })

  test('should be able to resolve simple $refs', () => {
    // Given
    const spec = {
      one: {
        uno: 1,
        $ref: '#/two'
      },
      two: {
        duos: 2
      }
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        one: {
          duos: 2
        },
        two: {
          duos: 2
        }
      })
    }
  })

  test('should be able to resolve $refs with percent-encoded values', () => {
    // Given
    const spec = {
      one: {
        uno: 1,
        $ref: '#/value%20two'
      },
      'value two': {
        duos: 2
      }
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        one: {
          duos: 2
        },
        'value two': {
          duos: 2
        }
      })
    }
  })

  test(
    'should tolerate $refs with raw values that should be percent-encoded',
    () => {
      // NOTE: this is for compatibility and can be removed in the next major
      // REVIEW for v4

      // Given
      const spec = {
        one: {
          uno: 1,
          $ref: '#/value two'
        },
        'value two': {
          duos: 2
        }
      }

      // When
      return Swagger.resolve({spec, allowMetaPatches: false})
        .then(handleResponse)

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([])
        expect(obj.spec).toEqual({
          one: {
            duos: 2
          },
          'value two': {
            duos: 2
          }
        })
      }
    }
  )

  test(
    'should be able to resolve circular $refs when a baseDoc is provided',
    () => {
      // Given
      const spec = {
        one: {
          $ref: '#/two'
        },
        two: {
          a: {
            $ref: '#/three'
          }
        },
        three: {
          b: {
            $ref: '#/two'
          }
        }
      }

      // When
      return Swagger.resolve({spec, baseDoc: 'http://example.com/swagger.json', allowMetaPatches: false})
        .then(handleResponse)

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([])
        expect(obj.spec).toEqual({
          one: {
            a: {
              b: {
                $ref: '#/two'
              }
            }
          },
          three: {
            b: {
              $ref: '#/two'
            }
          },
          two: {
            a: {
              b: {
                $ref: '#/two'
              }
            }
          }
        })
      }
    }
  )

  test('should resolve this edge case of allOf + items + deep $refs', () => {
    // Given
    const spec = {
      definitions: {
        First: {
          allOf: [
            {
              $ref: '#/definitions/Second'
            }
          ]
        },
        Second: {
          allOf: [
            {
              $ref: '#/definitions/Third'
            }
          ]
        },
        Third: {
          properties: {
            children: {
              type: 'array',
              items: {
                $ref: '#/definitions/Third'
              }
            }
          }
        }
      }
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
    }
  })

  test('should resolve the url, if no spec provided', () => {
    // Given
    const url = 'http://example.com/swagger.json'
    xmock().get(url, (req, res) => res.send({one: 1}))

    // When
    return Swagger.resolve({baseDoc: url, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        one: 1
      })
    }
  })

  test('should be able to resolve simple allOf', () => {
    // Given
    const spec = {
      allOf: [
        {uno: 1},
        {duos: 2}
      ]
    }

    // When
    return Swagger.resolve({spec})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        uno: 1,
        duos: 2
      })
    }
  })

  test('should be able to resolve simple allOf', () => {
    // Given
    const spec = {
      allOf: [
        {uno: 1},
        {duos: 2}
      ]
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        uno: 1,
        duos: 2
      })
    }
  })

  test('should be able to resolve complex allOf', () => {
    // Given
    const spec = {
      definitions: {
        Simple1: {
          type: 'object',
          properties: {
            id1: {
              type: 'integer',
              format: 'int64'
            }
          }
        },
        Simple2: {
          type: 'object',
          properties: {
            id2: {
              type: 'integer',
              format: 'int64'
            }
          }
        },
        Composed: {
          allOf: [
            {
              $ref: '#/definitions/Simple1'
            },
            {
              $ref: '#/definitions/Simple2'
            }
          ]
        }
      }
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        definitions: {
          Simple1: {
            type: 'object',
            properties: {
              id1: {
                type: 'integer',
                format: 'int64'
              }
            }
          },
          Simple2: {
            type: 'object',
            properties: {
              id2: {
                type: 'integer',
                format: 'int64'
              }
            }
          },
          Composed: {
            type: 'object',
            properties: {
              id1: {
                type: 'integer',
                format: 'int64'
              },
              id2: {
                type: 'integer',
                format: 'int64'
              }
            }
          }
        }
      })
    }
  })

  describe('complex allOf+$ref', () => {
    test('should be able to resolve without meta patches', () => {
      // Given
      const spec = {
        components: {
          schemas: {
            Error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string'
                }
              }
            },
            UnauthorizedError: {
              allOf: [
                {
                  $ref: '#/components/schemas/Error'
                },
                {
                  type: 'object',
                  properties: {
                    code: {
                      example: 401
                    },
                    message: {
                      example: 'Unauthorized'
                    }
                  }
                }
              ]
            },
            NotFoundError: {
              allOf: [
                {
                  $ref: '#/components/schemas/Error'
                },
                {
                  type: 'object',
                  properties: {
                    code: {
                      example: 404
                    },
                    message: {
                      example: 'Resource Not Found'
                    }
                  }
                }
              ]
            }
          }
        }
      }

      // When
      return Swagger.resolve({spec, allowMetaPatches: false})
        .then(handleResponse)

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([])
        expect(obj.spec).toEqual({
          components: {
            schemas: {
              Error: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  }
                }
              },
              UnauthorizedError: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Unauthorized'

                  },
                  code: {
                    example: 401
                  },
                }
              },
              NotFoundError: {
                type: 'object',
                properties: {
                  code: {
                    example: 404
                  },
                  message: {
                    type: 'string',
                    example: 'Resource Not Found'
                  }
                }
              }
            }
          }
        })
      }
    })
    test('should be able to resolve with meta patches', () => {
      // Given
      const spec = {
        components: {
          schemas: {
            Error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string'
                }
              }
            },
            UnauthorizedError: {
              allOf: [
                {
                  $ref: '#/components/schemas/Error'
                },
                {
                  type: 'object',
                  properties: {
                    code: {
                      example: 401
                    },
                    message: {
                      example: 'Unauthorized'
                    }
                  }
                }
              ]
            },
            NotFoundError: {
              allOf: [
                {
                  $ref: '#/components/schemas/Error'
                },
                {
                  type: 'object',
                  properties: {
                    code: {
                      example: 404
                    },
                    message: {
                      example: 'Resource Not Found'
                    }
                  }
                }
              ]
            }
          }
        }
      }

      // When
      return Swagger.resolve({spec, allowMetaPatches: true})
        .then(handleResponse)

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([])
        expect(obj.spec).toEqual({
          components: {
            schemas: {
              Error: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  }
                }
              },
              UnauthorizedError: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Unauthorized'

                  },
                  code: {
                    example: 401
                  },
                }
              },
              NotFoundError: {
                type: 'object',
                properties: {
                  code: {
                    example: 404
                  },
                  message: {
                    type: 'string',
                    example: 'Resource Not Found'
                  }
                }
              }
            }
          }
        })
      }
    })
  })

  describe('complex allOf+$ref+circular-reference', () => {
    test('should be able to resolve without meta patches', async () => {
      // Given
      const spec = {
        swagger: '2.0',
        info: {
          version: '0.2.1',
          title: 'Resolver Issue, undefind of \'0\'',
          description: 'Resolver issue'
        },
        paths: {
        },
        definitions: {
          First: {
            allOf: [
              {
                $ref: '#/definitions/Second'
              }
            ]
          },
          Second: {
            allOf: [
              {
                $ref: '#/definitions/Third'
              }
            ]
          },
          Third: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          }
        }
      }

      // When
      const result = await Swagger.resolve({spec, allowMetaPatches: false})

      // Then
      if (result.errors && result.errors.length) {
        // For debugging
        throw result.errors[0]
      }
      expect(result.errors).toEqual([])
      expect(result.spec).toEqual({
        $$normalized: true,
        swagger: '2.0',
        info: {
          version: '0.2.1',
          title: 'Resolver Issue, undefind of \'0\'',
          description: 'Resolver issue'
        },
        paths: {
        },
        definitions: {
          First: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          },
          Second: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          },
          Third: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          }
        }
      })
    })
    test('should be able to resolve with meta patches', async () => {
      // Given
      const spec = {
        swagger: '2.0',
        info: {
          version: '0.2.1',
          title: 'Resolver Issue, undefind of \'0\'',
          description: 'Resolver issue'
        },
        paths: {
        },
        definitions: {
          First: {
            allOf: [
              {
                $ref: '#/definitions/Second'
              }
            ]
          },
          Second: {
            allOf: [
              {
                $ref: '#/definitions/Third'
              }
            ]
          },
          Third: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          }
        }
      }

      // When
      const result = await Swagger.resolve({spec, allowMetaPatches: true})

      // Then
      if (result.errors && result.errors.length) {
        // For debugging
        throw result.errors[0]
      }

      expect(result.errors).toEqual([])
      expect(result.spec).toEqual({
        $$normalized: true,
        swagger: '2.0',
        info: {
          version: '0.2.1',
          title: 'Resolver Issue, undefind of \'0\'',
          description: 'Resolver issue'
        },
        paths: {
        },
        definitions: {
          First: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          },
          Second: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          },
          Third: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Third'
                }
              }
            }
          }
        }
      })
    })
  })

  test(
    'should not throw errors on resvered-keywords in freely-named-fields',
    () => {
      // Given
      const ReservedKeywordSpec = jsYaml.safeLoad(fs.readFileSync(path.resolve(__dirname, './data/reserved-keywords.yaml'), 'utf8'))

      // When
      return Swagger.resolve({spec: ReservedKeywordSpec, allowMetaPatches: false})
        .then(handleResponse)

      // Then
      function handleResponse(obj) {
        // Sanity ( to make sure we're testing the right spec )
        expect(obj.spec.definitions).toMatchObject({$ref: {}})

        // The main assertion
        expect(obj.errors).toEqual([])
      }
    }
  )

  const DOCUMENT_ORIGINAL = {
    swagger: '2.0',
    paths: {
      '/pet': {
        post: {
          tags: [
            'pet'
          ],
          summary: 'Add a new pet to the store',
          operationId: 'addPet',
          parameters: [
            {
              in: 'body',
              name: 'body',
              description: 'Pet object that needs to be added to the store',
              required: true,
              schema: {
                $ref: '#/definitions/Pet'
              }
            }
          ],
          responses: {
            405: {
              description: 'Invalid input'
            }
          }
        }
      }
    },
    definitions: {
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64'
          },
          name: {
            type: 'string'
          }
        }
      },
      Pet: {
        type: 'object',
        required: [
          'category'
        ],
        properties: {
          category: {
            $ref: '#/definitions/Category'
          }
        }
      }
    }
  }

  describe('Swagger usage', () => {
    test.skip('should be able to resolve a Swagger document with $refs', () => {
      // When
      return Swagger.resolve({spec: DOCUMENT_ORIGINAL, allowMetaPatches: false})
      .then(handleResponse)

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([])
        expect(obj.spec).toEqual({
          swagger: '2.0',
          paths: {
            '/pet': {
              post: {
                tags: [
                  'pet'
                ],
                summary: 'Add a new pet to the store',
                operationId: 'addPet',
                __originalOperationId: 'addPet',
                parameters: [
                  {
                    in: 'body',
                    name: 'body',
                    description: 'Pet object that needs to be added to the store',
                    required: true,
                    schema: {
                      type: 'object',
                      required: [
                        'category'
                      ],
                      properties: {
                        category: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'integer',
                              format: 'int64'
                            },
                            name: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    }
                  }
                ],
                responses: {
                  405: {
                    description: 'Invalid input'
                  }
                }
              }
            }
          },
          definitions: {
            Category: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64'
                },
                name: {
                  type: 'string'
                }
              }
            },
            Pet: {
              type: 'object',
              required: [
                'category'
              ],
              properties: {
                category: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      format: 'int64'
                    },
                    name: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        })
      }
    })

    test(
      'should be able to resolve a Swagger document with $refs when allowMetaPatches is enabled',
      () => {
        // When
        return Swagger.resolve({spec: DOCUMENT_ORIGINAL, allowMetaPatches: true})
        .then(handleResponse)

        // Then
        function handleResponse(obj) {
          expect(obj.errors).toEqual([])
          expect(obj.spec).toEqual({
            swagger: '2.0',
            $$normalized: true,
            paths: {
              '/pet': {
                post: {
                  tags: [
                    'pet'
                  ],
                  summary: 'Add a new pet to the store',
                  operationId: 'addPet',
                  __originalOperationId: 'addPet',
                  parameters: [
                    {
                      in: 'body',
                      name: 'body',
                      description: 'Pet object that needs to be added to the store',
                      required: true,
                      schema: {
                        $$ref: '#/definitions/Pet',
                        type: 'object',
                        required: [
                          'category'
                        ],
                        properties: {
                          category: {
                            $$ref: '#/definitions/Category',
                            type: 'object',
                            properties: {
                              id: {
                                type: 'integer',
                                format: 'int64'
                              },
                              name: {
                                type: 'string'
                              }
                            }
                          }
                        }
                      }
                    }
                  ],
                  responses: {
                    405: {
                      description: 'Invalid input'
                    }
                  }
                }
              }
            },
            definitions: {
              Category: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              },
              Pet: {
                type: 'object',
                required: [
                  'category'
                ],
                properties: {
                  category: {
                    $$ref: '#/definitions/Category',
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64'
                      },
                      name: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          })
        }
      }
    )
  })
})
