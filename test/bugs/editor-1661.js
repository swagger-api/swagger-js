// https://github.com/swagger-api/swagger-editor/issues/1661

import expect, {createSpy, spyOn} from 'expect'
import Swagger from '../../src'

const spec = {
  paths: {
    '/path1': {
      get: {
        responses: {
          200: {
            schema: {
              $ref: '#/definitions/DataObjectArray'
            }
          }
        }
      }
    }
  },
  definitions: {
    DataObject: {
      properties: {
        modifiers: {
          $ref: '#/definitions/DataModifiers'
        }
      }
    },
    DataObjectArray: {
      items: {
        $ref: '#/definitions/DataObject'
      }
    },
    DataModifier: {
      properties: {
        prop1: {
          type: 'string'
        }
      }
    },
    DataModifiers: {
      items: {
        $ref: '#/definitions/DataModifier'
      }
    }
  }
}


it('should resolve a deeply-nested $ref series correctly', async function () {
  const res = await Swagger.resolve({
    spec
  })

  expect(res).toEqual({
    errors: [],
    spec: {
      paths: {
        '/path1': {
          get: {
            responses: {
              200: {
                schema: {
                  $$ref: '#/definitions/DataObjectArray',
                  items: {
                    $$ref: '#/definitions/DataObject',
                    properties: {
                      modifiers: {
                        $$ref: '#/definitions/DataModifiers',
                        items: {
                          $$ref: '#/definitions/DataModifier',
                          properties: {
                            prop1: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      definitions: {
        DataObject: {
          properties: {
            modifiers: {
              $$ref: '#/definitions/DataModifiers',
              items: {
                $$ref: '#/definitions/DataModifier',
                properties: {
                  prop1: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        DataObjectArray: {
          items: {
            $$ref: '#/definitions/DataObject',
            properties: {
              modifiers: {
                $$ref: '#/definitions/DataModifiers',
                items: {
                  $$ref: '#/definitions/DataModifier',
                  properties: {
                    prop1: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        },
        DataModifier: {
          properties: {
            prop1: {
              type: 'string'
            }
          }
        },
        DataModifiers: {
          items: {
            $$ref: '#/definitions/DataModifier',
            properties: {
              prop1: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  })
})
