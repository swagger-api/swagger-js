class SwaggerApi
  
  # Defaults
  discoveryUrl: "http://api.wordnik.com/v4/resources.json"
  debug: false
  api_key: null
  basePath: null
  
  constructor: (options={}) ->
    @discoveryUrl = options.discoveryUrl if options.discoveryUrl?
    @debug = options.debug if options.debug?
    @api_key = options.apiKey if options.apiKey?
    @api_key = options.api_key if options.api_key?
    @verbose = options.verbose if options.verbose?
    @success = options.success if options.success?
    
    # Build right away if a callback was passed to the initializer
    @build() if options.success?
    
  build: ->
    $.getJSON @discoveryUrl, (response) =>
      @basePath = response.basePath
      
      throw "discoveryUrl basePath must be a URL." unless @basePath.match(/^HTTP/i)?
      
      # TODO: Take this out. It's an API regression.
      @basePath = @basePath.replace(/\/$/, '')

      # Store a map of resources by name
      @resources = {}
      for resource in response.apis
        
        # TODO: Remove this temporary sillyness
        continue if resource.path is "/tracking.{format}" or resource.path is "/partner.{format}"
        
        res = new SwaggerResource resource.path, resource.description, this
        @resources[res.name] = res
        
      this
  
  # This method is called each time a child resource finishes loading
  # 
  selfReflect: ->
    return false unless @resources?
    for resource_name, resource of @resources
      return false unless resource.ready?
    
    @ready = true
    @success() if @success?
    
  help: ->
    for resource_name, resource of @resources
      console.log resource_name
      for operation_name, operation of resource.operations
        console.log "  #{operation.nickname}"
        for parameter in operation.parameters
          console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @
        
class SwaggerResource

  constructor: (@path, @description, @api) ->
    throw "SwaggerResources must have a path." unless @path?
    @operations = {}
    
    # e.g."http://api.wordnik.com/v4/word.json"
    @url = @api.basePath + @path.replace('{format}', 'json')

    # Extract name from path
    # '/foo/dogs.format' -> 'dogs'
    parts = @path.split("/")
    @name = parts[parts.length - 1].replace('.{format}', '')
    
    $.getJSON @url, (response) =>
      @basePath = response.basePath
      
      # TODO: Take this out.. it's a wordnik API regression
      @basePath = @basePath.replace(/\/$/, '')

      # Instantiate SwaggerOperations and store them in the @operations map
      if response.apis
        for endpoint in response.apis
          if endpoint.operations
            for o in endpoint.operations
              op = new SwaggerOperation o.nickname, endpoint.path, o.httpMethod, o.parameters, o.summary, this
              @operations[op.nickname] = op

      # Store a named reference to this resource on the parent object
      @api[this.name] = this

      # Mark as ready
      @ready = true

      # Now that this resource is loaded, tell the API to check in on itself
      @api.selfReflect()
      
  help: ->
    for operation_name, operation of @operations
      console.log "  #{operation.nickname}"
      for parameter in operation.parameters
        console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @


class SwaggerOperation

  constructor: (@nickname, @path, @httpMethod, @parameters=[], @summary, @resource) ->
    throw "SwaggerOperations must have a nickname." unless @nickname?
    throw "SwaggerOperation #{nickname} is missing path." unless @path?
    throw "SwaggerOperation #{nickname} is missing httpMethod." unless @httpMethod?
    # Convert {format} to 'json'
    @path = @path.replace('{format}', 'json')
        
    # Store a named reference to this operation on the parent resource
    # getDefinitions() maps to getDefinitionsData.do()
    @resource[@nickname]= (args, callback, error) =>
      @do(args, callback, error)
      
  do: (args={}, callback, error) =>
    
    # if the args is a function, then it must be a resource without
    # parameters
    if (typeof args) == "function"
      error = callback
      callback = args
      args = {}
      
    # Define a default error handler
    unless error?
      error = (xhr, textStatus, error) -> console.log xhr, textStatus, error

    # Define a default success handler
    # TODO MAYBE: Call this success instead of callback
    unless callback?
      callback = (data) -> console.log data
    
    # Pull headers out of args    
    if args.headers?
      headers = args.headers
      delete args.headers
      
    # Pull body out of args
    if args.body?
      body = args.body
      delete args.body

    new SwaggerRequest(@httpMethod, @urlify(args), headers, body, callback, error, this)
        
  urlify: (args) ->
    
    url = @resource.basePath + @path
    
    # Convert {format} to 'json' (in case operation.path was modified after 
    # the operation was initialized)
    url = url.replace('{format}', 'json')
  
    # Iterate over allowable params, interpolating the 'path' params into the url string.
    # Whatever's left over in the args object will become the query string
    for param in @parameters
      if param.paramType == 'path'
        
        if args[param.name]
          url = url.replace("{#{param.name}}", args[param.name])
          delete args[param.name]
        else
          throw "#{param.name} is a required path param."

    # TODO: Remove this in favor of header
    # Add API key to the params
    args['api_key'] = @resource.api.api_key if @resource.api.api_key?

    # Append the query string to the URL
    url += ("?" + $.param(args))

    url

  help: ->
    for parameter in @parameters
      console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @


class SwaggerRequest
  
  constructor: (@type, @url, @headers, @body, @callback, @error, @operation) ->
    throw "SwaggerRequest type is required (get/post/put/delete)." unless @type?
    throw "SwaggerRequest url is required." unless @url?
    throw "SwaggerRequest callback is required." unless @callback?
    throw "SwaggerRequest error callback is required." unless @error?
    throw "SwaggerRequest operation is required." unless @operation?
    
    # console.log "new SwaggerRequest: %o", this
    console.log this.asCurl() if @operation.resource.api.verbose
    
    # Stick the API key into the headers, if present
    @headers or= {}
    @headers.api_key = @operation.resource.api.api_key if @operation.resource.api.api_key?

    unless @headers.mock?
    
      obj = 
        type: @type
        url: @url
        # TODO: Figure out why the API is not accepting these
        # headers: @headers
        data: JSON.stringify(@body)
        dataType: 'json'
        error: (xhr, textStatus, error) ->
          @error(xhr, textStatus, error)
        success: (data) =>
          @callback(data)

      obj.contentType = "application/json" if (obj.type.toLowerCase() == "post" or obj.type.toLowerCase() == "put")
    
      $.ajax(obj)

  asCurl: ->
    header_args = ("--header \"#{k}: #{v}\"" for k,v of @headers)
    "curl #{header_args.join(" ")} #{@url}"
  
# Expose these classes:
window.SwaggerApi = SwaggerApi
window.SwaggerResource = SwaggerResource
window.SwaggerOperation = SwaggerOperation
window.SwaggerRequest = SwaggerRequest