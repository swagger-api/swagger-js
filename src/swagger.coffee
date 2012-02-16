class SwaggeringApi
  discoveryUrl: "http://api.wordnik.com/v4/resources.json"
  debug: false
  format: "json"
  resources: []
  api_key: null
  basePath: null
  
  constructor: (options={}) ->    
    @discoveryUrl = options.discoveryUrl if options.discoveryUrl?
    @debug = options.debug if options.debug?
    @format = options.format if options.format?
    @api_key = options.apiKey if options.apiKey?
    @api_key = options.api_key if options.api_key?

  log: ->
    if @debug and window.console
      console.log.apply console, arguments
  
  build: (callback) ->
    
    $.getJSON @discoveryUrl, (response) =>
      
      @basePath = response.basePath

      @resources = for resource in response.apis
        new Resource resource.path, resource.description, this
        
class Resource
  operations = []
  
  constructor: (@path, @description, @api) ->
    $.getJSON @descriptionUrl(), (response) =>
      @basePath = response.basePath
      if response.apis
        for endpoint in response.apis
          if endpoint.operations
            @operations = for o in endpoint.operations
              new Operation o.nickname, o.path, o.httpMethod, o.parameters, o.summary, this

  descriptionUrl: ->
    @api.basePath + @path.replace('{format}', @api.format)

class Operation

  constructor: (@nickname, @path, @httpMethod, @parameters, @summary, @resource) ->

  argsToUrl: (args) ->

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

  run: (args) =>

    $.ajax
      type: this.httpMethod
      url: @argsToUrl(args)
      # data: {}
      dataType: 'json'
      # headers:
      #   api_key: window.swagger.api_key
      error: (xhr, textStatus, error) ->
        console.log 'ajax.error', error
      success: (data) ->
        console.log 'ajax.success', data
    
# class Parameter
  
# Expose these classes for later use:
window.SwaggeringApi = SwaggeringApi
window.Resource = Resource
window.Operation = Operation