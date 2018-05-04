import expect from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import jsYaml from 'js-yaml'

import Swagger from '../src'

describe('resolver', () => {
  afterEach(function () {
    // Restore all xhr/http mocks
    xmock().restore()
    // Clear the http cache
    Swagger.clearCache()
  })

  it('should expose a resolver function', () => {
    expect(Swagger.resolve).toBeA(Function)
  })

  it('should be able to resolve simple $refs', () => {
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

  it('should be able to resolve circular $refs when a baseDoc is provided', () => {
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
  })

  it('should resolve the url, if no spec provided', function () {
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

  it('should be able to resolve simple allOf', () => {
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

  it('should be able to resolve simple allOf', () => {
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

  it('should be able to resolve complex allOf', () => {
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
    it('should be able to resolve without meta patches', () => {
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
    it('should be able to resolve with meta patches', () => {
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

  it('should not throw errors on resvered-keywords in freely-named-fields', () => {
    // Given
    const ReservedKeywordSpec = jsYaml.safeLoad(fs.readFileSync(path.resolve(__dirname, './data/reserved-keywords.yaml'), 'utf8'))

    // When
    return Swagger.resolve({spec: ReservedKeywordSpec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      // Sanity ( to make sure we're testing the right spec )
      expect(obj.spec.definitions).toInclude({$ref: {}})

      // The main assertion
      expect(obj.errors).toEqual([])
    }
  })

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

  describe('Swagger usage', function () {
    it.skip('should be able to resolve a Swagger document with $refs', () => {
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

    it('should be able to resolve a Swagger document with $refs when allowMetaPatches is enabled', () => {
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
    })
  })
})
