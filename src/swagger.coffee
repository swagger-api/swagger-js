class Api
  discoveryUrl: "http://api.wordnik.com/v4/resources.json"
  debug: false
  format: "json"
  api_key: null
  basePath: null
  
  constructor: (options={}) ->    
    @discoveryUrl = options.discoveryUrl if options.discoveryUrl?
    @debug = options.debug if options.debug?
    @format = options.format if options.format?
    @api_key = options.apiKey if options.apiKey?
    @api_key = options.api_key if options.api_key?
    
  build: (callback) ->
    $.getJSON @discoveryUrl, (response) =>
      @basePath = response.basePath
      @resources = for resource in response.apis
        new Resource resource.path, resource.description, this
  
  # Apis are ready when all their resources are ready
  isReady: ->
    return false unless @resources?
    return false unless @resources.length > 0
    for resource in @resources
      return false unless resource.ready?
    true
        
class Resource

  constructor: (@path, @description, @api) ->
    @operations = []
    
    $.getJSON @url(), (response) =>
      @basePath = response.basePath

      # Instantiate Operations
      if response.apis
        for endpoint in response.apis
          if endpoint.operations
            for o in endpoint.operations
              @operations.push(new Operation o.nickname, o.path, o.httpMethod, o.parameters, o.summary, this)

      # Store a named reference to this resource on the parent object
      @api[this.name()] = this

      # Mark as ready
      @ready = true

  # e.g."http://api.wordnik.com/v4/word.json"
  url: ->
    @api.basePath + @path.replace('{format}', @api.format)
  
  # Extract name from path
  # '/foo/dogs.format' -> 'dogs'
  name: ->
    parts = @path.split("/")
    parts[parts.length - 1].replace('.{format}', '')

class Operation

  constructor: (@nickname, @path, @httpMethod, @parameters, @summary, @resource) ->
    
    # Store a named reference to this operation on the parent resource
    @resource[@nickname] = this

  run: (args, callback) =>
  
    $.ajax
      type: @httpMethod
      url: @urlFor(args)
      # data: {}
      dataType: @resource.api.format
      # headers:
      #   api_key: window.swagger.api_key
      error: (xhr, textStatus, error) ->
        console.log 'ajax.error', error
      success: (data) ->
        console.log 'ajax.success', data
        
  urlFor: (args) ->
  
    url = @resource.basePath + @path
  
    # Iterate over allowable params, interpolating the 'path' params into the url string.
    # Whatever's left over in the args object will become the query string
    for param in @parameters
      if param.paramType == 'path' and args[param.name]
        url = url.replace("{#{param.name}}", args[param.name])
        delete args[param.name]
    
    # Stick the API key in the query string object
    args['api_key'] = @resource.api.api_key
    
    # Append the query string to the URL
    url += ("?" + $.param(args))
  
    console.log "Request URL: #{url}"
    url
    
# class Parameter
  
# Expose these classes for later use:
window.Api = Api
window.Resource = Resource
window.Operation = Operation