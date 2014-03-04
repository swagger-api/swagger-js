// full spec
wordnik_1_0_spec = {
  "apiDeclarations": [
    {
      "resourcePath": "/word",
      "apis": [
        {
          "path": "/word.{format}/{word}/examples",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to return examples for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "includeDuplicates",
                  "defaultValue": "false",
                  "description": "Show duplicate examples from different sources",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "skip",
                  "defaultValue": "0",
                  "description": "Results to skip",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "5",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns examples for a word",
              "httpMethod": "GET",
              "nickname": "getExamples",
              "responseClass": "exampleSearchResults",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "String value of WordObject to return",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includeSuggestions",
                  "defaultValue": "true",
                  "description": "Return suggestions (for correct spelling, case variants, etc.)",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                }
              ],
              "summary": "Given a word as a string, returns the WordObject that represents it",
              "httpMethod": "GET",
              "nickname": "getWord",
              "responseClass": "wordObject",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/definitions",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to return definitions for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "200",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "partOfSpeech",
                  "description": "CSV list of part-of-speech types",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "noun",
                      "adjective",
                      "verb",
                      "adverb",
                      "interjection",
                      "pronoun",
                      "preposition",
                      "abbreviation",
                      "affix",
                      "article",
                      "auxiliary-verb",
                      "conjunction",
                      "definite-article",
                      "family-name",
                      "given-name",
                      "idiom",
                      "imperative",
                      "noun-plural",
                      "noun-posessive",
                      "past-participle",
                      "phrasal-prefix",
                      "proper-noun",
                      "proper-noun-plural",
                      "proper-noun-posessive",
                      "suffix",
                      "verb-intransitive",
                      "verb-transitive"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includeRelated",
                  "defaultValue": "false",
                  "description": "Return related words with definitions",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "true",
                      "false"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "sourceDictionaries",
                  "description": "Source dictionary to return definitions from.  If 'all' is received, results are returned from all sources. If multiple values are received (e.g. 'century,wiktionary'), results are returned from the first specified dictionary that has definitions. If left blank, results are returned from the first dictionary that has definitions. By default, dictionaries are searched in this order: ahd, wiktionary, webster, century, wordnet",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": true,
                  "allowableValues": {
                    "values": [
                      "all",
                      "ahd",
                      "century",
                      "wiktionary",
                      "webster",
                      "wordnet"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includeTags",
                  "defaultValue": "false",
                  "description": "Return a closed set of XML tags in response",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                }
              ],
              "summary": "Return definitions for a word",
              "httpMethod": "GET",
              "nickname": "getDefinitions",
              "responseClass": "List[definition]",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                },
                {
                  "reason": "No definitions found.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/topExample",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to fetch examples for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                }
              ],
              "summary": "Returns a top example for a word",
              "httpMethod": "GET",
              "nickname": "getTopExample",
              "responseClass": "example",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/relatedWords",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to fetch relationships for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "relationshipTypes",
                  "description": "Limits the total results per type of relationship type",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "synonym",
                      "antonym",
                      "variant",
                      "equivalent",
                      "cross-reference",
                      "related-word",
                      "rhyme",
                      "form",
                      "etymologically-related-term",
                      "hypernym",
                      "hyponym",
                      "inflected-form",
                      "primary",
                      "same-context",
                      "verb-form",
                      "verb-stem",
                      "has_topic"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "limitPerRelationshipType",
                  "defaultValue": "10",
                  "description": "Restrict to the supplied relatinship types",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 1.0,
                    "valueType": "RANGE"
                  }
                }
              ],
              "summary": "Given a word as a string, returns relationships from the Word Graph",
              "httpMethod": "GET",
              "nickname": "getRelatedWords",
              "responseClass": "List[related]",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/etymologies",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to return",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                }
              ],
              "summary": "Fetches etymology data",
              "httpMethod": "GET",
              "nickname": "getEtymologies",
              "responseClass": "List[String]",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                },
                {
                  "reason": "No definitions found.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/audio",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to get audio for.",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "Use the canonical form of the word",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "50",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Fetches audio metadata for a word.",
              "httpMethod": "GET",
              "nickname": "getAudio",
              "responseClass": "List[audioFile]",
              "notes": "The metadata includes a time-expiring fileUrl which allows reading the audio file directly from the API.  Currently only audio pronunciations from the American Heritage Dictionary in mp3 format are supported.",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/pronunciations",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to get pronunciations for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return a correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "sourceDictionary",
                  "description": "Get from a single dictionary",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "ahd",
                      "century",
                      "cmu",
                      "macmillan",
                      "wiktionary",
                      "webster",
                      "wordnet"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "typeFormat",
                  "description": "Text pronunciation type",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "ahd",
                      "arpabet",
                      "gcide-diacritical",
                      "IPA"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "limit",
                  "defaultValue": "50",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns text pronunciations for a given word",
              "httpMethod": "GET",
              "nickname": "getTextPronunciations",
              "responseClass": "List[textPron]",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/scrabbleScore",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to get scrabble score for.",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns the Scrabble score for a word",
              "httpMethod": "GET",
              "nickname": "getScrabbleScore",
              "responseClass": "long",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                },
                {
                  "reason": "No scrabble score found.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/hyphenation",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to get syllables for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return a correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "sourceDictionary",
                  "description": "Get from a single dictionary. Valid options: ahd, century, wiktionary, webster, and wordnet.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "50",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns syllable information for a word",
              "httpMethod": "GET",
              "nickname": "getHyphenation",
              "responseClass": "List[syllable]",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/frequency",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to return",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "startYear",
                  "defaultValue": "1800",
                  "description": "Starting Year",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "endYear",
                  "defaultValue": "2012",
                  "description": "Ending Year",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns word usage over time",
              "httpMethod": "GET",
              "nickname": "getWordFrequency",
              "responseClass": "frequencySummary",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                },
                {
                  "reason": "No results.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/word.{format}/{word}/phrases",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "word",
                  "description": "Word to fetch phrases for",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "5",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "wlmi",
                  "defaultValue": "0",
                  "description": "Minimum WLMI for the phrase",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "useCanonical",
                  "defaultValue": "false",
                  "description": "If true will try to return the correct word root ('cats' -> 'cat'). If false returns exactly what was requested.",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                }
              ],
              "summary": "Fetches bi-gram phrases for a word",
              "httpMethod": "GET",
              "nickname": "getPhrases",
              "responseClass": "List[bigram]",
              "errorResponses": [
                {
                  "reason": "Invalid word supplied.",
                  "code": 400
                }
              ]
            }
          ]
        }
      ],
      "apiVersion": "4.0",
      "swaggerVersion": "1.0",
      "models": {
        "Long": {
          "uniqueItems": false,
          "properties": {
            "value": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            }
          },
          "id": "long",
          "type": "any",
          "required": false
        },
        "Syllable": {
          "uniqueItems": false,
          "properties": {
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "seq": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "type": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "syllable",
          "type": "any",
          "required": false
        },
        "AudioType": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "audioType",
          "type": "any",
          "required": false
        },
        "Facet": {
          "uniqueItems": false,
          "properties": {
            "facetValues": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "facetValue",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "facet",
          "type": "any",
          "required": false
        },
        "Note": {
          "uniqueItems": false,
          "properties": {
            "noteType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "appliesTo": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "value": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "pos": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            }
          },
          "id": "note",
          "type": "any",
          "required": false
        },
        "FacetValue": {
          "uniqueItems": false,
          "properties": {
            "count": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "value": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "facetValue",
          "type": "any",
          "required": false
        },
        "WordObject": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "originalWord": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "suggestions": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "canonicalForm": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "vulgar": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "wordObject",
          "type": "any",
          "required": false
        },
        "Related": {
          "uniqueItems": false,
          "properties": {
            "label1": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "label2": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "relationshipType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "label3": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "words": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "gram": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "label4": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "related",
          "type": "any",
          "required": false
        },
        "ScoredWord": {
          "uniqueItems": false,
          "properties": {
            "position": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "lemma": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "docTermCount": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "wordType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "score": {
              "uniqueItems": false,
              "type": "float",
              "required": false
            },
            "sentenceId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "stopword": {
              "uniqueItems": false,
              "type": "boolean",
              "required": false
            },
            "baseWordScore": {
              "uniqueItems": false,
              "type": "double",
              "required": false
            },
            "partOfSpeech": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "scoredWord",
          "type": "any",
          "required": false
        },
        "Citation": {
          "uniqueItems": false,
          "properties": {
            "cite": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "source": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "citation",
          "type": "any",
          "required": false
        },
        "ExampleSearchResults": {
          "uniqueItems": false,
          "properties": {
            "facets": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "facet",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "examples": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "example",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            }
          },
          "id": "exampleSearchResults",
          "type": "any",
          "required": false
        },
        "Example": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "exampleId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "title": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "score": {
              "uniqueItems": false,
              "type": "scoredWord",
              "required": false
            },
            "sentence": {
              "uniqueItems": false,
              "type": "sentence",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "provider": {
              "uniqueItems": false,
              "type": "contentProvider",
              "required": false
            },
            "year": {
              "uniqueItems": false,
              "type": "integer",
              "required": false
            },
            "rating": {
              "uniqueItems": false,
              "type": "float",
              "required": false
            },
            "documentId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "url": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "example",
          "type": "any",
          "required": false
        },
        "Sentence": {
          "uniqueItems": false,
          "properties": {
            "hasScoredWords": {
              "uniqueItems": false,
              "type": "boolean",
              "required": false
            },
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "scoredWords": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "scoredWord",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "display": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "rating": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "documentMetadataId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            }
          },
          "id": "sentence",
          "type": "any",
          "required": false
        },
        "ExampleUsage": {
          "uniqueItems": false,
          "properties": {
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "ExampleUsage",
          "type": "any",
          "required": false
        },
        "ContentProvider": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "contentProvider",
          "type": "any",
          "required": false
        },
        "AudioFile": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "duration": {
              "uniqueItems": false,
              "type": "double",
              "required": false
            },
            "attributionText": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdBy": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "description": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "voteWeightedAverage": {
              "uniqueItems": false,
              "type": "float",
              "required": false
            },
            "voteAverage": {
              "uniqueItems": false,
              "type": "float",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "commentCount": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "attributionUrl": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "voteCount": {
              "uniqueItems": false,
              "type": "integer",
              "required": false
            },
            "audioType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "fileUrl": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "audioFile",
          "type": "any",
          "required": false
        },
        "Bigram": {
          "uniqueItems": false,
          "properties": {
            "count": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "gram2": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "gram1": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "wlmi": {
              "uniqueItems": false,
              "type": "double",
              "required": false
            },
            "mi": {
              "uniqueItems": false,
              "type": "double",
              "required": false
            }
          },
          "id": "bigram",
          "type": "any",
          "required": false
        },
        "Label": {
          "uniqueItems": false,
          "properties": {
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "type": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "Label",
          "type": "any",
          "required": false
        },
        "Frequency": {
          "uniqueItems": false,
          "properties": {
            "count": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "year": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            }
          },
          "id": "frequency",
          "type": "any",
          "required": false
        },
        "FrequencySummary": {
          "uniqueItems": false,
          "properties": {
            "unknownYearCount": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "totalCount": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "frequencyString": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "frequency": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "frequency",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            }
          },
          "id": "frequencySummary",
          "type": "any",
          "required": false
        },
        "TextPron": {
          "uniqueItems": false,
          "properties": {
            "raw": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "seq": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "rawType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "textPron",
          "type": "any",
          "required": false
        },
        "Definition": {
          "uniqueItems": false,
          "properties": {
            "extendedText": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "sourceDictionary": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "citations": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "citation",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "labels": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "Label",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "score": {
              "uniqueItems": false,
              "type": "float",
              "required": false
            },
            "exampleUses": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "ExampleUsage",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "attributionUrl": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "seqString": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "attributionText": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "relatedWords": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "related",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "sequence": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "textProns": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "textPron",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "notes": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "note",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "partOfSpeech": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "definition",
          "type": "any",
          "required": false
        },
        "PartOfSpeech": {
          "uniqueItems": false,
          "properties": {
            "roots": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "root",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "storageAbbr": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "allCategories": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "category",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            }
          },
          "id": "partOfSpeech",
          "type": "any",
          "required": false
        }
      },
      "basePath": "http://api.wordnik.com/v4"
    },
    {
      "resourcePath": "/words",
      "apis": [
        {
          "path": "/words.{format}/search/{query}",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "allowRegex",
                  "defaultValue": "false",
                  "description": "Search term is a Regular Expression",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "true",
                      "false"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "query",
                  "description": "Search query",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "caseSensitive",
                  "defaultValue": "true",
                  "description": "Search case sensitive",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "true",
                      "false"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includePartOfSpeech",
                  "description": "Only include these comma-delimited parts of speech",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "noun",
                      "adjective",
                      "verb",
                      "adverb",
                      "interjection",
                      "pronoun",
                      "preposition",
                      "abbreviation",
                      "affix",
                      "article",
                      "auxiliary-verb",
                      "conjunction",
                      "definite-article",
                      "family-name",
                      "given-name",
                      "idiom",
                      "imperative",
                      "noun-plural",
                      "noun-posessive",
                      "past-participle",
                      "phrasal-prefix",
                      "proper-noun",
                      "proper-noun-plural",
                      "proper-noun-posessive",
                      "suffix",
                      "verb-intransitive",
                      "verb-transitive"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "excludePartOfSpeech",
                  "description": "Exclude these comma-delimited parts of speech",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "minCorpusCount",
                  "defaultValue": "5",
                  "description": "Minimum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "maxCorpusCount",
                  "defaultValue": "-1",
                  "description": "Maximum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "minDictionaryCount",
                  "defaultValue": "1",
                  "description": "Minimum number of dictionary entries for words returned",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "maxDictionaryCount",
                  "defaultValue": "-1",
                  "description": "Maximum dictionary definition count",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "minLength",
                  "defaultValue": "1",
                  "description": "Minimum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1024.0,
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "maxLength",
                  "defaultValue": "-1",
                  "description": "Maximum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1024.0,
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "skip",
                  "defaultValue": "0",
                  "description": "Results to skip",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1000.0,
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "limit",
                  "defaultValue": "10",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1000.0,
                    "min": 1.0,
                    "valueType": "RANGE"
                  }
                }
              ],
              "summary": "Searches words",
              "httpMethod": "GET",
              "nickname": "searchWords",
              "responseClass": "wordSearchResults",
              "errorResponses": [
                {
                  "reason": "Invalid query supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/words.{format}/wordOfTheDay",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "date",
                  "description": "Fetches by date in yyyy-MM-dd",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns a specific WordOfTheDay",
              "httpMethod": "GET",
              "nickname": "getWordOfTheDay",
              "responseClass": "WordOfTheDay"
            }
          ]
        },
        {
          "path": "/words.{format}/reverseDictionary",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "query",
                  "description": "Search term",
                  "required": true,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "findSenseForWord",
                  "description": "Restricts words and finds closest sense",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "includeSourceDictionaries",
                  "description": "Only include these comma-delimited source dictionaries",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "ahd",
                      " century",
                      " wiktionary",
                      " webster",
                      " wordnet"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "excludeSourceDictionaries",
                  "description": "Exclude these comma-delimited source dictionaries",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "ahd",
                      " century",
                      " wiktionary",
                      " webster",
                      " wordnet"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includePartOfSpeech",
                  "description": "Only include these comma-delimited parts of speech",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "excludePartOfSpeech",
                  "description": "Exclude these comma-delimited parts of speech",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "minCorpusCount",
                  "defaultValue": "5",
                  "description": "Minimum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "maxCorpusCount",
                  "defaultValue": "-1",
                  "description": "Maximum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": "Infinity",
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "minLength",
                  "defaultValue": "1",
                  "description": "Minimum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1024.0,
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "maxLength",
                  "defaultValue": "-1",
                  "description": "Maximum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1024.0,
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "expandTerms",
                  "description": "Expand terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "synonym",
                      "hypernym"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includeTags",
                  "defaultValue": "false",
                  "description": "Return a closed set of XML tags in response",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "sortBy",
                  "description": "Attribute to sort by",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "alpha",
                      "count",
                      "length"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "sortOrder",
                  "description": "Sort direction",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "asc",
                      "desc"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "skip",
                  "defaultValue": "0",
                  "description": "Results to skip",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1000.0,
                    "min": 0.0,
                    "valueType": "RANGE"
                  }
                },
                {
                  "name": "limit",
                  "defaultValue": "10",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false,
                  "allowableValues": {
                    "max": 1000.0,
                    "min": 1.0,
                    "valueType": "RANGE"
                  }
                }
              ],
              "summary": "Reverse dictionary search",
              "httpMethod": "GET",
              "nickname": "reverseDictionary",
              "responseClass": "DefinitionSearchResults",
              "errorResponses": [
                {
                  "reason": "Invalid term supplied.",
                  "code": 400
                }
              ]
            }
          ]
        },
        {
          "path": "/words.{format}/randomWords",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "hasDictionaryDef",
                  "defaultValue": "true",
                  "description": "Only return words with dictionary definitions",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includePartOfSpeech",
                  "description": "CSV part-of-speech values to include",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "noun",
                      "adjective",
                      "verb",
                      "adverb",
                      "interjection",
                      "pronoun",
                      "preposition",
                      "abbreviation",
                      "affix",
                      "article",
                      "auxiliary-verb",
                      "conjunction",
                      "definite-article",
                      "family-name",
                      "given-name",
                      "idiom",
                      "imperative",
                      "noun-plural",
                      "noun-posessive",
                      "past-participle",
                      "phrasal-prefix",
                      "proper-noun",
                      "proper-noun-plural",
                      "proper-noun-posessive",
                      "suffix",
                      "verb-intransitive",
                      "verb-transitive"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "excludePartOfSpeech",
                  "description": "CSV part-of-speech values to exclude",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "noun",
                      "adjective",
                      "verb",
                      "adverb",
                      "interjection",
                      "pronoun",
                      "preposition",
                      "abbreviation",
                      "affix",
                      "article",
                      "auxiliary-verb",
                      "conjunction",
                      "definite-article",
                      "family-name",
                      "given-name",
                      "idiom",
                      "imperative",
                      "noun-plural",
                      "noun-posessive",
                      "past-participle",
                      "phrasal-prefix",
                      "proper-noun",
                      "proper-noun-plural",
                      "proper-noun-posessive",
                      "suffix",
                      "verb-intransitive",
                      "verb-transitive"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "minCorpusCount",
                  "defaultValue": "0",
                  "description": "Minimum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "maxCorpusCount",
                  "defaultValue": "-1",
                  "description": "Maximum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "minDictionaryCount",
                  "defaultValue": "1",
                  "description": "Minimum dictionary count",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "maxDictionaryCount",
                  "defaultValue": "-1",
                  "description": "Maximum dictionary count",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "minLength",
                  "defaultValue": "5",
                  "description": "Minimum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "maxLength",
                  "defaultValue": "-1",
                  "description": "Maximum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "sortBy",
                  "description": "Attribute to sort by",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "alpha",
                      "count"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "sortOrder",
                  "description": "Sort direction",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "asc",
                      "desc"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "limit",
                  "defaultValue": "10",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns an array of random WordObjects",
              "httpMethod": "GET",
              "nickname": "getRandomWords",
              "responseClass": "List[wordObject]",
              "errorResponses": [
                {
                  "reason": "Invalid term supplied.",
                  "code": 400
                },
                {
                  "reason": "No results.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/words.{format}/randomWord",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "hasDictionaryDef",
                  "defaultValue": "true",
                  "description": "Only return words with dictionary definitions",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "false",
                      "true"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "includePartOfSpeech",
                  "description": "CSV part-of-speech values to include",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "noun",
                      "adjective",
                      "verb",
                      "adverb",
                      "interjection",
                      "pronoun",
                      "preposition",
                      "abbreviation",
                      "affix",
                      "article",
                      "auxiliary-verb",
                      "conjunction",
                      "definite-article",
                      "family-name",
                      "given-name",
                      "idiom",
                      "imperative",
                      "noun-plural",
                      "noun-posessive",
                      "past-participle",
                      "phrasal-prefix",
                      "proper-noun",
                      "proper-noun-plural",
                      "proper-noun-posessive",
                      "suffix",
                      "verb-intransitive",
                      "verb-transitive"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "excludePartOfSpeech",
                  "description": "CSV part-of-speech values to exclude",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "noun",
                      "adjective",
                      "verb",
                      "adverb",
                      "interjection",
                      "pronoun",
                      "preposition",
                      "abbreviation",
                      "affix",
                      "article",
                      "auxiliary-verb",
                      "conjunction",
                      "definite-article",
                      "family-name",
                      "given-name",
                      "idiom",
                      "imperative",
                      "noun-plural",
                      "noun-posessive",
                      "past-participle",
                      "phrasal-prefix",
                      "proper-noun",
                      "proper-noun-plural",
                      "proper-noun-posessive",
                      "suffix",
                      "verb-intransitive",
                      "verb-transitive"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "minCorpusCount",
                  "defaultValue": "0",
                  "description": "Minimum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "maxCorpusCount",
                  "defaultValue": "-1",
                  "description": "Maximum corpus frequency for terms",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "minDictionaryCount",
                  "defaultValue": "1",
                  "description": "Minimum dictionary count",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "maxDictionaryCount",
                  "defaultValue": "-1",
                  "description": "Maximum dictionary count",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "minLength",
                  "defaultValue": "5",
                  "description": "Minimum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "maxLength",
                  "defaultValue": "-1",
                  "description": "Maximum word length",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns a single random WordObject",
              "httpMethod": "GET",
              "nickname": "getRandomWord",
              "responseClass": "wordObject",
              "errorResponses": [
                {
                  "reason": "No word found.",
                  "code": 404
                }
              ]
            }
          ]
        }
      ],
      "apiVersion": "4.0",
      "swaggerVersion": "1.0",
      "models": {
        "WordSearchResult": {
          "uniqueItems": false,
          "properties": {
            "count": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "lexicality": {
              "uniqueItems": false,
              "type": "double",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "WordSearchResult",
          "type": "any",
          "required": false
        },
        "WordOfTheDay": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "parentId": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "category": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdBy": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "contentProvider": {
              "uniqueItems": false,
              "type": "contentProvider",
              "required": false
            },
            "htmlExtra": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "definitions": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "simpleDefinition",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "examples": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "simpleExample",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "publishDate": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "note": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "WordOfTheDay",
          "type": "any",
          "required": false
        },
        "DefinitionSearchResults": {
          "uniqueItems": false,
          "properties": {
            "results": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "definition",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "totalResults": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            }
          },
          "id": "DefinitionSearchResults",
          "type": "any",
          "required": false
        },
        "Note": {
          "uniqueItems": false,
          "properties": {
            "noteType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "appliesTo": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "value": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "pos": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            }
          },
          "id": "note",
          "type": "any",
          "required": false
        },
        "WordObject": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "originalWord": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "suggestions": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "canonicalForm": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "vulgar": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "wordObject",
          "type": "any",
          "required": false
        },
        "Related": {
          "uniqueItems": false,
          "properties": {
            "label1": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "label2": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "relationshipType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "label3": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "words": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "gram": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "label4": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "related",
          "type": "any",
          "required": false
        },
        "Citation": {
          "uniqueItems": false,
          "properties": {
            "cite": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "source": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "citation",
          "type": "any",
          "required": false
        },
        "WordSearchResults": {
          "uniqueItems": false,
          "properties": {
            "searchResults": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "WordSearchResult",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "totalResults": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            }
          },
          "id": "wordSearchResults",
          "type": "any",
          "required": false
        },
        "Category": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "category",
          "type": "any",
          "required": false
        },
        "SimpleDefinition": {
          "uniqueItems": false,
          "properties": {
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "source": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "note": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "partOfSpeech": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "simpleDefinition",
          "type": "any",
          "required": false
        },
        "Root": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "categories": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "category",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            }
          },
          "id": "root",
          "type": "any",
          "required": false
        },
        "ExampleUsage": {
          "uniqueItems": false,
          "properties": {
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "ExampleUsage",
          "type": "any",
          "required": false
        },
        "ContentProvider": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "contentProvider",
          "type": "any",
          "required": false
        },
        "Label": {
          "uniqueItems": false,
          "properties": {
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "type": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "Label",
          "type": "any",
          "required": false
        },
        "SimpleExample": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "title": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "url": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "simpleExample",
          "type": "any",
          "required": false
        },
        "Definition": {
          "uniqueItems": false,
          "properties": {
            "extendedText": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "text": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "sourceDictionary": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "citations": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "citation",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "labels": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "Label",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "score": {
              "uniqueItems": false,
              "type": "float",
              "required": false
            },
            "exampleUses": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "ExampleUsage",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "attributionUrl": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "seqString": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "attributionText": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "relatedWords": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "related",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "sequence": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "textProns": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "textPron",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "notes": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "note",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "partOfSpeech": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "definition",
          "type": "any",
          "required": false
        },
        "PartOfSpeech": {
          "uniqueItems": false,
          "properties": {
            "roots": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "root",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            },
            "storageAbbr": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "uniqueItems": false,
                "type": "string",
                "required": false
              }
            },
            "allCategories": {
              "uniqueItems": false,
              "type": "array",
              "required": false,
              "items": {
                "$ref": "category",
                "uniqueItems": false,
                "type": "any",
                "required": false
              }
            }
          },
          "id": "partOfSpeech",
          "type": "any",
          "required": false
        },
        "TextPron": {
          "uniqueItems": false,
          "properties": {
            "raw": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "seq": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "rawType": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "textPron",
          "type": "any",
          "required": false
        }
      },
      "basePath": "http://api.wordnik.com/v4"
    },
    {
      "resourcePath": "/account",
      "apis": [
        {
          "path": "/account.{format}/authenticate/{username}",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "username",
                  "description": "A confirmed Wordnik username",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "password",
                  "description": "The user's password",
                  "required": true,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Authenticates a User",
              "httpMethod": "GET",
              "nickname": "authenticate",
              "responseClass": "AuthenticationToken",
              "errorResponses": [
                {
                  "reason": "Account not available.",
                  "code": 403
                },
                {
                  "reason": "User not found.",
                  "code": 404
                }
              ]
            },
            {
              "parameters": [
                {
                  "name": "username",
                  "description": "A confirmed Wordnik username",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "description": "The user's password",
                  "required": true,
                  "paramType": "body",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Authenticates a user",
              "httpMethod": "POST",
              "nickname": "authenticatePost",
              "responseClass": "AuthenticationToken",
              "errorResponses": [
                {
                  "reason": "Account not available.",
                  "code": 403
                },
                {
                  "reason": "User not found.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/account.{format}/wordLists",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "auth_token",
                  "description": "auth_token of logged-in user",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "skip",
                  "defaultValue": "0",
                  "description": "Results to skip",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "50",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                }
              ],
              "summary": "Fetches WordList objects for the logged-in user.",
              "httpMethod": "GET",
              "nickname": "getWordListsForLoggedInUser",
              "responseClass": "List[wordList]",
              "errorResponses": [
                {
                  "reason": "Not authenticated.",
                  "code": 403
                },
                {
                  "reason": "User account not found.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/account.{format}/user",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns the logged-in User",
              "httpMethod": "GET",
              "nickname": "getLoggedInUser",
              "responseClass": "user",
              "notes": "Requires a valid auth_token to be set.",
              "errorResponses": [
                {
                  "reason": "Not logged in.",
                  "code": 403
                },
                {
                  "reason": "User not found.",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/account.{format}/apiTokenStatus",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "api_key",
                  "description": "Wordnik authentication token",
                  "required": false,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Returns usage statistics for the API account.",
              "httpMethod": "GET",
              "nickname": "getApiTokenStatus",
              "responseClass": "ApiTokenStatus",
              "errorResponses": [
                {
                  "reason": "No token supplied.",
                  "code": 400
                },
                {
                  "reason": "No API account with supplied token.",
                  "code": 404
                }
              ]
            }
          ]
        }
      ],
      "apiVersion": "4.0",
      "swaggerVersion": "1.0",
      "models": {
        "User": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "username": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "email": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "status": {
              "uniqueItems": false,
              "type": "int",
              "required": false
            },
            "faceBookId": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "userName": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "displayName": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "password": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "user",
          "type": "any",
          "required": false
        },
        "ApiTokenStatus": {
          "uniqueItems": false,
          "properties": {
            "valid": {
              "uniqueItems": false,
              "type": "boolean",
              "required": false
            },
            "token": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "resetsInMillis": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "remainingCalls": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "expiresInMillis": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "totalRequests": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            }
          },
          "id": "ApiTokenStatus",
          "type": "any",
          "required": false
        },
        "AuthenticationToken": {
          "uniqueItems": false,
          "properties": {
            "token": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "userId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "userSignature": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "AuthenticationToken",
          "type": "any",
          "required": false
        },
        "WordList": {
          "uniqueItems": false,
          "properties": {
            "updatedAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "username": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "permalink": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "lastActivityAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "description": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "userId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "numberWordsInList": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "type": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "wordList",
          "type": "any",
          "required": false
        }
      },
      "basePath": "http://api.wordnik.com/v4"
    },
    {
      "resourcePath": "/wordLists",
      "apis": [
        {
          "path": "/wordLists.{format}",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "description": "WordList to create",
                  "required": false,
                  "paramType": "body",
                  "dataType": "wordList",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Creates a WordList.",
              "httpMethod": "POST",
              "nickname": "createWordList",
              "responseClass": "wordList",
              "errorResponses": [
                {
                  "reason": "Invalid WordList supplied or mandatory fields are missing",
                  "code": 400
                },
                {
                  "reason": "Not authenticated",
                  "code": 403
                },
                {
                  "reason": "WordList owner not found",
                  "code": 404
                }
              ]
            }
          ]
        }
      ],
      "apiVersion": "4.0",
      "swaggerVersion": "1.0",
      "models": {
        "WordList": {
          "uniqueItems": false,
          "properties": {
            "updatedAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "username": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "permalink": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "lastActivityAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "description": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "userId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "numberWordsInList": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "type": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "wordList",
          "type": "any",
          "required": false
        }
      },
      "basePath": "http://api.wordnik.com/v4"
    },
    {
      "resourcePath": "/wordList",
      "apis": [
        {
          "path": "/wordList.{format}/{permalink}",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "permalink",
                  "description": "permalink of WordList to update",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "description": "Updated WordList",
                  "required": false,
                  "paramType": "body",
                  "dataType": "wordList",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Updates an existing WordList",
              "httpMethod": "PUT",
              "nickname": "updateWordList",
              "responseClass": "ok",
              "errorResponses": [
                {
                  "reason": "Invalid ID supplied",
                  "code": 400
                },
                {
                  "reason": "Not Authorized to update WordList",
                  "code": 403
                },
                {
                  "reason": "WordList not found",
                  "code": 404
                }
              ]
            },
            {
              "parameters": [
                {
                  "name": "permalink",
                  "description": "ID of WordList to delete",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Deletes an existing WordList",
              "httpMethod": "DELETE",
              "nickname": "deleteWordList",
              "responseClass": "ok",
              "errorResponses": [
                {
                  "reason": "Invalid ID supplied",
                  "code": 400
                },
                {
                  "reason": "Not Authorized to delete WordList",
                  "code": 403
                },
                {
                  "reason": "WordList not found",
                  "code": 404
                }
              ]
            },
            {
              "parameters": [
                {
                  "name": "permalink",
                  "description": "permalink of WordList to fetch",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Fetches a WordList by ID",
              "httpMethod": "GET",
              "nickname": "getWordListByPermalink",
              "responseClass": "wordList",
              "errorResponses": [
                {
                  "reason": "Invalid ID supplied",
                  "code": 400
                },
                {
                  "reason": "Not Authorized to access WordList",
                  "code": 403
                },
                {
                  "reason": "WordList not found",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/wordList.{format}/{permalink}/words",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "permalink",
                  "description": "permalink of WordList to user",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "description": "Array of words to add to WordList",
                  "required": false,
                  "paramType": "body",
                  "dataType": "Array[StringValue]",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Adds words to a WordList",
              "httpMethod": "POST",
              "nickname": "addWordsToWordList",
              "responseClass": "ok",
              "errorResponses": [
                {
                  "reason": "Invalid permalink supplied",
                  "code": 400
                },
                {
                  "reason": "Not Authorized to access WordList",
                  "code": 403
                },
                {
                  "reason": "WordList not found",
                  "code": 404
                }
              ]
            },
            {
              "parameters": [
                {
                  "name": "permalink",
                  "description": "ID of WordList to use",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "name": "sortBy",
                  "defaultValue": "createDate",
                  "description": "Field to sort by",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "createDate",
                      "alpha"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "sortOrder",
                  "defaultValue": "desc",
                  "description": "Direction to sort",
                  "required": false,
                  "paramType": "query",
                  "dataType": "string",
                  "allowMultiple": false,
                  "allowableValues": {
                    "values": [
                      "asc",
                      "desc"
                    ],
                    "valueType": "LIST"
                  }
                },
                {
                  "name": "skip",
                  "defaultValue": "0",
                  "description": "Results to skip",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "limit",
                  "defaultValue": "100",
                  "description": "Maximum number of results to return",
                  "required": false,
                  "paramType": "query",
                  "dataType": "int",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Fetches words in a WordList",
              "httpMethod": "GET",
              "nickname": "getWordListWords",
              "responseClass": "List[wordListWord]",
              "errorResponses": [
                {
                  "reason": "Invalid ID supplied",
                  "code": 400
                },
                {
                  "reason": "Not Authorized to access WordList",
                  "code": 403
                },
                {
                  "reason": "WordList not found",
                  "code": 404
                }
              ]
            }
          ]
        },
        {
          "path": "/wordList.{format}/{permalink}/deleteWords",
          "description": "",
          "operations": [
            {
              "parameters": [
                {
                  "name": "permalink",
                  "description": "permalink of WordList to use",
                  "required": true,
                  "paramType": "path",
                  "dataType": "string",
                  "allowMultiple": false
                },
                {
                  "description": "Words to remove from WordList",
                  "required": false,
                  "paramType": "body",
                  "dataType": "Array[StringValue]",
                  "allowMultiple": false
                },
                {
                  "name": "auth_token",
                  "description": "The auth token of the logged-in user, obtained by calling /account.{format}/authenticate/{username} (described above)",
                  "required": true,
                  "paramType": "header",
                  "dataType": "string",
                  "allowMultiple": false
                }
              ],
              "summary": "Removes words from a WordList",
              "httpMethod": "POST",
              "nickname": "deleteWordsFromWordList",
              "responseClass": "ok",
              "errorResponses": [
                {
                  "reason": "Invalid permalink supplied",
                  "code": 400
                },
                {
                  "reason": "Not Authorized to modify WordList",
                  "code": 403
                },
                {
                  "reason": "WordList not found",
                  "code": 404
                }
              ]
            }
          ]
        }
      ],
      "apiVersion": "4.0",
      "swaggerVersion": "1.0",
      "models": {
        "WordList": {
          "uniqueItems": false,
          "properties": {
            "updatedAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "username": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "permalink": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "lastActivityAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "description": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "userId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "name": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "numberWordsInList": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "type": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "wordList",
          "type": "any",
          "required": false
        },
        "WordListWord": {
          "uniqueItems": false,
          "properties": {
            "id": {
              "uniqueItems": false,
              "type": "long",
              "required": true
            },
            "username": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "createdAt": {
              "uniqueItems": false,
              "type": "Date",
              "required": false
            },
            "numberCommentsOnWord": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "userId": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            },
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            },
            "numberLists": {
              "uniqueItems": false,
              "type": "long",
              "required": false
            }
          },
          "id": "wordListWord",
          "type": "any",
          "required": false
        },
        "StringValue": {
          "uniqueItems": false,
          "properties": {
            "word": {
              "uniqueItems": false,
              "type": "string",
              "required": false
            }
          },
          "id": "StringValue",
          "type": "any",
          "required": false
        }
      },
      "basePath": "http://api.wordnik.com/v4"
    }
  ],
  "apis": [
    {
      "path": "/wordList.{format}",
      "description": ""
    },
    {
      "path": "/wordLists.{format}",
      "description": ""
    },
    {
      "path": "/account.{format}",
      "description": ""
    },
    {
      "path": "/word.{format}",
      "description": ""
    },
    {
      "path": "/words.{format}",
      "description": ""
    }
  ],
  "apiVersion": "4.0",
  "swaggerVersion": "1.0",
  "basePath": "http://api.wordnik.com/v4"
}