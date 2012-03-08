class Api
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
      
      # TODO: Take this out
      @basePath = @basePath.replace(/\/$/, '')
      
      @resources = for resource in response.apis
        new Resource resource.path, resource.description, this
  
  # This method is called each time a child resource finished loading
  # 
  selfReflect: ->
    return false unless @resources?
    return false unless @resources.length > 0
    for resource in @resources
      return false unless resource.ready?
    
    @ready = true
    @success() if @success?
        
class Resource

  constructor: (@path, @description, @api) ->
    throw "Resources must have a path." unless @path?
    @operations = []
    
    $.getJSON @url(), (response) =>
      @basePath = response.basePath
      
      # TODO: Take this out.. it's a wordnik API regression
      @basePath = @basePath.replace(/\/$/, '')

      # Instantiate Operations
      if response.apis
        for endpoint in response.apis
          if endpoint.operations
            for o in endpoint.operations
              @operations.push(new Operation o.nickname, endpoint.path, o.httpMethod, o.parameters, o.summary, this)

      # Store a named reference to this resource on the parent object
      @api[this.name()] = this

      # Mark as ready
      @ready = true

      # Now that this resource is loaded, tell the API to check in on itself
      @api.selfReflect()

  # e.g."http://api.wordnik.com/v4/word.json"
  url: ->
    @api.basePath + @path.replace('{format}', 'json')
  
  # Extract name from path
  # '/foo/dogs.format' -> 'dogs'
  name: ->
    parts = @path.split("/")
    parts[parts.length - 1].replace('.{format}', '')

class Operation

  constructor: (@nickname, @path, @httpMethod, @parameters, @summary, @resource) ->
    throw "Operations must have a nickname." unless @nickname?
    throw "Operation #{nickname} is missing path." unless @path?
    throw "Operation #{nickname} is missing httpMethod." unless @httpMethod?
    
    # Convert {format} to 'json'
    @path = @path.replace('{format}', 'json')
        
    # Store a named reference to this operation on the parent resource
    @resource[@nickname] = this
    
  do: (args, callback) =>
    
    # Pull headers out of args    
    if args.headers?
      headers = args.headers
      delete args.headers
      
    # Pull body out of args
    if args.body?
      body = args.body
      delete args.body

    new Request(@httpMethod, @urlify(args), headers, body, callback, this)
        
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

class Request
  
  constructor: (@type, @url, @headers, @body, @callback, @operation) ->
    throw "Request type is required (get/post/put/delete)." unless @type?
    throw "Request url is required." unless @url?
    throw "Request callback is required." unless @callback?
    throw "Request operation is required." unless @operation?
    
    # console.log "new Request: %o", this
    console.log this.asCurl() if @operation.resource.api.verbose
    
    # Stick the API key into the headers, if present
    @headers or= {}
    @headers.api_key = @operation.resource.api.api_key if @operation.resource.api.api_key?

    unless @headers.mock?
      $.ajax
        type: @type
        url: @url
        # TODO: Figure out why the API is not accepting these
        # headers: @headers
        data: @body
        dataType: 'json'
        error: (xhr, textStatus, error) ->
          console.log xhr, textStatus, error
        success: (data) =>
          @callback(data)

  asCurl: ->
    header_args = ("--header \"#{k}: #{v}\"" for k,v of @headers)
    "curl #{header_args.join(" ")} #{@url}"
  
# Expose these classes:
window.Api = Api
window.Resource = Resource
window.Operation = Operation
window.Request = Request