
class SwaggerApi
  
  # Defaults
  url: "http://api.wordnik.com/v4/resources.json"
  debug: false
  basePath: null
  authorizations: null
  authorizationScheme: null

  constructor: (url, options={}) ->
    # if url is a hash, assume only options were passed

    if url 
      if url.url
        options = url
      else
        @url = url
    else
      options = url
    @url = options.url if options.url?

    @supportedSubmitMethods = if options.supportedSubmitMethods? then options.supportedSubmitMethods else ['get']
    @success = options.success if options.success?
    @failure = if options.failure? then options.failure else ->
    @progress = if options.progress? then options.progress else ->
    @defaultHeaders = if options.headers? then options.headers else {}

    # Build right away if a callback was passed to the initializer
    @build() if options.success?

  build: ->
    @progress 'fetching resource list: ' + @url
    console.log 'getting ' + @url
    obj = 
      url: @url
      method: "get"
      on:
        error: (response) =>
          if @url.substring(0, 4) isnt 'http'
            @fail 'Please specify the protocol for ' + @url
          else if error.status == 0
            @fail 'Can\'t read from server.  It may not have the appropriate access-control-origin settings.'
          else if error.status == 404
            @fail 'Can\'t read swagger JSON from '  + @url
          else
            @fail error.status + ' : ' + error.statusText + ' ' + @url
        response: (rawResponse) =>
          response = JSON.parse(rawResponse.content.data)
          @apiVersion = response.apiVersion if response.apiVersion?

          @apis = {}
          @apisArray = []

          # if apis.operations exists, this is an api declaration as opposed to a resource listing
          isApi = false
          for api in response.apis
            if api.operations
              for operation in api.operations
                isApi = true

          if isApi
            newName = response.resourcePath.replace(/\//g,'')
            this.resourcePath = response.resourcePath

            res = new SwaggerResource response, this
            @apis[newName] = res
            @apisArray.push res
          else
            # The base path derived from url
            if response.basePath
              # support swagger 1.1, which has basePath
              @basePath = response.basePath
            else if @url.indexOf('?') > 0
              @basePath = @url.substring(0, @url.lastIndexOf('?'))
            else
              @basePath = @url

            for resource in response.apis
              res = new SwaggerResource resource, this
              @apis[res.name] = res
              @apisArray.push res
          if this.success
            this.success()
          this

    new SwaggerHttp().execute obj
    @

  # This method is called each time a child resource finishes loading
  # 
  selfReflect: ->
    return false unless @apis?
    for resource_name, resource of @apis
      return false unless resource.ready?

    @setConsolidatedModels()
    @ready = true
    @success() if @success?

  fail: (message) ->
    @failure message
    throw message

  # parses models in all apis and sets a unique consolidated list of models
  setConsolidatedModels: ->
    @modelsArray = []
    @models = {}
    for resource_name, resource of @apis
      for modelName of resource.models
        if not @models[modelName]?
          @models[modelName] = resource.models[modelName]
          @modelsArray.push resource.models[modelName]
    for model in @modelsArray
      model.setReferencedModels(@models)

  help: ->
    for resource_name, resource of @apis
      console.log resource_name
      for operation_name, operation of resource.operations
        console.log "  #{operation.nickname}"
        for parameter in operation.parameters
          console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @
        
class SwaggerResource
  api: null
  produces: null
  consumes: null

  constructor: (resourceObj, @api) ->
    this.api = @api
    produces = []
    consumes = []

    @path = if @api.resourcePath? then @api.resourcePath else resourceObj.path
    @description = resourceObj.description

    # Extract name from path
    # '/foo/dogs.format' -> 'dogs'
    parts = @path.split("/")
    @name = parts[parts.length - 1].replace('.{format}', '')

    # set the basePath to be the one in API. If response from server for this resource
    # has a more specific one, we'll set it again there.
    @basePath = @api.basePath

    # We're going to store operations in a map (operations) and a list (operationsArray)
    @operations = {}
    @operationsArray = []

    # We're going to store models in a map (models) and a list (modelsArray)
    @modelsArray = []
    @models = {}

    if resourceObj.apis? and @api.resourcePath?
      # read resource directly from operations object
      @addApiDeclaration(resourceObj)

    else
      # read from server
      @api.fail "SwaggerResources must have a path." unless @path?

      # e.g."http://api.wordnik.com/v4/word.json"
      @url = @api.basePath + @path.replace('{format}', 'json')

      @api.progress 'fetching resource ' + @name + ': ' + @url
      obj = 
        url: @url
        method: "get"
        on:
          error: (response) =>
            @api.fail "Unable to read api '" + @name + "' from path " + @url + " (server returned " + error.statusText + ")"
          response: (rawResponse) =>
            response = JSON.parse(rawResponse.content.data)
            @addApiDeclaration(response)

      new SwaggerHttp().execute obj

  addApiDeclaration: (response) ->
    if response.produces?
      @produces = response.produces
    if response.consumes?
      @consumes = response.consumes

    # If there is a basePath in response, use that or else use
    # the one from the api object
    if response.basePath? and response.basePath.replace(/\s/g,'').length > 0
      @basePath = response.basePath

    @addModels(response.models)

    # Instantiate SwaggerOperations and store them in the @operations map and @operationsArray
    if response.apis
      for endpoint in response.apis
        @addOperations(endpoint.path, endpoint.operations)

    # Store a named reference to this resource on the parent object
    @api[this.name] = this

    # Mark as ready
    @ready = true

    # Now that this resource is loaded, tell the API to check in on itself
    @api.selfReflect()

  addModels: (models) ->
    if models?
      for modelName of models
        if not @models[modelName]?
          swaggerModel = new SwaggerModel(modelName, models[modelName])
          @modelsArray.push swaggerModel
          @models[modelName] = swaggerModel
      for model in @modelsArray
        model.setReferencedModels(@models)


  addOperations: (resource_path, ops) ->
    if ops
      for o in ops
        consumes = null
        produces = null

        if o.consumes?
          consumes = o.consumes
        else
          consumes = @consumes

        if o.produces?
          produces = o.produces
        else
          produces = @produces

        responseMessages = o.responseMessages
        method = o.method

        # support old httpMethod
        if o.httpMethod
          method = o.httpMethod

        # support old naming
        if o.supportedContentTypes
          consumes = o.supportedContentTypes

        # support old error responses
        if o.errorResponses
          responseMessages = o.errorResponses

        op = new SwaggerOperation o.nickname, resource_path, method, o.parameters, o.summary, o.notes, o.responseClass, responseMessages, this, consumes, produces
        @operations[op.nickname] = op
        @operationsArray.push op

  help: ->
    for operation_name, operation of @operations
      msg = "  #{operation.nickname}"
      for parameter in operation.parameters
        msg.concat("    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}")
      msg


class SwaggerModel
  constructor: (modelName, obj) ->
    if obj.required?
      for propertyName of obj.required
        obj.properties[propertyName].required = true

    @name = if obj.id? then obj.id else modelName
    @properties = []
    for propertyName of obj.properties
      @properties.push new SwaggerModelProperty(propertyName, obj.properties[propertyName])

  # Set models referenced  bu this model
  setReferencedModels: (allModels) ->
    for prop in @properties
      if allModels[prop.dataType]?
        prop.refModel = allModels[prop.dataType]
      else if prop.refDataType? and allModels[prop.refDataType]?
        prop.refModel = allModels[prop.refDataType]

  getMockSignature: (modelsToIgnore) ->
    propertiesStr = []
    for prop in @properties
      propertiesStr.push prop.toString()

    strong = '<span class="strong">';
    stronger = '<span class="stronger">';
    strongClose = '</span>';
    classOpen = strong + @name + ' {' + strongClose
    classClose = strong + '}' + strongClose
    returnVal = classOpen + '<div>' + propertiesStr.join(',</div><div>') + '</div>' + classClose

    # create the array if necessary and then add the current element
    if !modelsToIgnore
      modelsToIgnore = []
    modelsToIgnore.push(@)

    # iterate thru all properties and add models which are not in modelsToIgnore
    # modelsToIgnore is used to ensure that recursive references do not lead to endless loop
    # and that the same model is not displayed multiple times
    for prop in @properties
      if(prop.refModel? and (modelsToIgnore.indexOf(prop.refModel)) == -1)
        returnVal = returnVal + ('<br>' + prop.refModel.getMockSignature(modelsToIgnore))

    returnVal

  createJSONSample: (modelsToIgnore) ->
    result = {}
    modelsToIgnore = modelsToIgnore || [];
    modelsToIgnore.push(@name);
    for prop in @properties
      result[prop.name] = prop.getSampleValue(modelsToIgnore)
    modelsToIgnore.pop(@name);
    result

class SwaggerModelProperty
  constructor: (@name, obj) ->
    @dataType = obj.type
    @isCollection  = @dataType && (@dataType.toLowerCase() is 'array' || @dataType.toLowerCase() is 'list' ||
      @dataType.toLowerCase() is 'set');
    @descr = obj.description
    @required = obj.required

    if obj.items?
      if obj.items.type? then @refDataType = obj.items.type
      if obj.items.$ref? then @refDataType = obj.items.$ref
    @dataTypeWithRef = if @refDataType? then (@dataType + '[' + @refDataType + ']') else @dataType
    if obj.allowableValues?
      @valueType = obj.allowableValues.valueType
      @values = obj.allowableValues.values
      if @values?
        @valuesString = "'" + @values.join("' or '") + "'"

  getSampleValue: (modelsToIgnore) ->
    if(@refModel? and (modelsToIgnore.indexOf(@refModel.name) is -1))
      result = @refModel.createJSONSample(modelsToIgnore)
    else
      if @isCollection
        result = @refDataType
      else
        result = @dataType
    if @isCollection then [result] else result

  toString: ->
    req = if @required then 'propReq' else 'propOpt'

    str = '<span class="propName ' + req + '">' + @name + '</span> (<span class="propType">' + @dataTypeWithRef + '</span>';
    if !@required
      str += ', <span class="propOptKey">optional</span>'

    str += ')';
    if @values?
      str += " = <span class='propVals'>['" + @values.join("' or '") + "']</span>"

    if @descr?
      str += ': <span class="propDesc">' + @descr + '</span>'

    str

# SwaggerOperation converts an operation into a method which can be executed directly
class SwaggerOperation
  constructor: (@nickname, @path, @method, @parameters=[], @summary, @notes, @responseClass, @responseMessages, @resource, @consumes, @produces) ->
    @resource.api.fail "SwaggerOperations must have a nickname." unless @nickname?
    @resource.api.fail "SwaggerOperation #{nickname} is missing path." unless @path?
    @resource.api.fail "SwaggerOperation #{nickname} is missing method." unless @method?

    # Convert {format} to 'json'
    @path = @path.replace('{format}', 'json')
    @method = @method.toLowerCase()
    @isGetMethod = @method == "get"
    @resourceName = @resource.name

    # if void clear it
    if(@responseClass?.toLowerCase() is 'void') then @responseClass = undefined
    if @responseClass?
      # set the signature of response class
      @responseClassSignature = @getSignature(@responseClass, @resource.models)
      @responseSampleJSON = @getSampleJSON(@responseClass, @resource.models)

    @responseMessages = @responseMessages || []

    for parameter in @parameters
      # Path params do not have a name, set the name to the path if name is n/a
      parameter.name = parameter.name || parameter.dataType

      if(parameter.dataType.toLowerCase() is 'boolean')
        parameter.allowableValues = {}
        parameter.allowableValues.values = @resource.api.booleanValues

      parameter.signature = @getSignature(parameter.dataType, @resource.models)
      parameter.sampleJSON = @getSampleJSON(parameter.dataType, @resource.models)

      # Set allowableValue attributes
      if parameter.allowableValues?
        # Set isRange and isList flags on param
        if parameter.allowableValues.valueType == "RANGE"
          parameter.isRange = true
        else
          parameter.isList = true

        # Set a descriptive values on allowable values
        # This contains value and isDefault flag for each value
        if parameter.allowableValues.values?
          parameter.allowableValues.descriptiveValues = []
          for v in parameter.allowableValues.values
            if parameter.defaultValue? and parameter.defaultValue == v
              parameter.allowableValues.descriptiveValues.push {value: v, isDefault: true}
            else
              parameter.allowableValues.descriptiveValues.push {value: v, isDefault: false}

    # Store a named reference to this operation on the parent resource
    # getDefinitions() maps to getDefinitionsData.do()
    @resource[@nickname]= (args, callback, error) =>
      @do(args, callback, error)

    # shortcut to help method
    @resource[@nickname].help = =>
      @help()

  isListType: (dataType) ->
    if(dataType.indexOf('[') >= 0) then dataType.substring(dataType.indexOf('[') + 1, dataType.indexOf(']')) else undefined

  getSignature: (dataType, models) ->
    # set listType if it exists
    listType = @isListType(dataType)

    # set flag which says if its primitive or not
    isPrimitive = if ((listType? and models[listType]) or models[dataType]?) then false else true

    if (isPrimitive) then dataType else (if listType? then models[listType].getMockSignature() else models[dataType].getMockSignature())

  getSampleJSON: (dataType, models) ->
    # set listType if it exists
    listType = @isListType(dataType)

    # set flag which says if its primitive or not
    isPrimitive = if ((listType? and models[listType]) or models[dataType]?) then false else true

    val = if (isPrimitive) then undefined else (if listType? then models[listType].createJSONSample() else models[dataType].createJSONSample())

    # pretty printing obtained JSON
    if val
      # if container is list wrap it
      val = if listType then [val] else val
      JSON.stringify(val, null, 2)
      
  do: (args={}, opts={}, callback, error) =>
    requestContentType = null
    responseContentType = null

    # if the args is a function, then it must be a resource without
    # parameters or opts
    if (typeof args) == "function"
      error = opts
      callback = args
      args = {}

    if (typeof opts) == "function"
      error = callback
      callback = opts

    # Define a default error handler
    unless error?
      error = (xhr, textStatus, error) -> console.log xhr, textStatus, error

    # Define a default success handler
    unless callback?
      callback = (data) ->
        content = null
        if data.content?
          content = data.content.data
        else
          content = "no data"
        console.log "default callback: " + content
    
    # params to pass into the request
    params = {}

    # Pull headers out of args    
    if args.headers?
      params.headers = args.headers
      delete args.headers
      
    # Pull body out of args
    if args.body?
      params.body = args.body
      delete args.body

    # pull out any form params
    possibleParams = (param for param in @parameters when param.paramType is "form")
    if possibleParams
      for key, value of possibleParams
        if args[value.name]
          params[value.name] = args[value.name]

    req = new SwaggerRequest(@method, @urlify(args), params, opts, callback, error, this)
    if opts.mock?
      req
    else
      true

  pathJson: -> @path.replace "{format}", "json"

  pathXml: -> @path.replace "{format}", "xml"

  # converts the operation path into a real URL, and appends query params
  urlify: (args) ->
    url = @resource.basePath + @pathJson()

    # Iterate over allowable params, interpolating the 'path' params into the url string.
    # Whatever's left over in the args object will become the query string
    for param in @parameters
      if param.paramType == 'path'
        if args[param.name]
          reg = new RegExp '\{'+param.name+'[^\}]*\}', 'gi'
          url = url.replace(reg, encodeURIComponent(args[param.name]))
          delete args[param.name]
        else
          throw "#{param.name} is a required path param."

    # Append the query string to the URL
    queryParams = ""
    for param in @parameters
      if param.paramType == 'query'
        if args[param.name]
          if queryParams != ""
            queryParams += "&"
          queryParams += encodeURIComponent(param.name) + '=' + encodeURIComponent(args[param.name])

    url += ("?" + queryParams) if queryParams? and queryParams.length > 0

    url

  # expose default headers
  supportHeaderParams: ->
    @resource.api.supportHeaderParams

  # expose supported submit methods
  supportedSubmitMethods: ->
    @resource.api.supportedSubmitMethods

  getQueryParams: (args) ->
    @getMatchingParams ['query'], args
 
  getHeaderParams: (args) ->
    @getMatchingParams ['header'], args

  # From args extract params of paramType and return them
  getMatchingParams: (paramTypes, args) ->
    matchingParams = {}
    for param in @parameters
      if args and args[param.name]
        matchingParams[param.name] = args[param.name]

    for name, value of @resource.api.headers
      matchingParams[name] = value

    matchingParams

  help: ->
    msg = ""
    for parameter in @parameters
      if msg isnt "" then msg += "\n"
      msg += "* #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    msg


# Swagger Request turns an operation into an actual request
class SwaggerRequest
  constructor: (@type, @url, @params, @opts, @successCallback, @errorCallback, @operation, @execution) ->
    throw "SwaggerRequest type is required (get/post/put/delete)." unless @type?
    throw "SwaggerRequest url is required." unless @url?
    throw "SwaggerRequest successCallback is required." unless @successCallback?
    throw "SwaggerRequest error callback is required." unless @errorCallback?
    throw "SwaggerRequest operation is required." unless @operation?

    @type = @type.toUpperCase()
    headers = params.headers
    myHeaders = {}
    body = params.body
    parent = params["parent"]

    requestContentType = "application/json"
    # if post or put, set the content-type being sent, otherwise make it null
    if body and (@type is "POST" or @type is "PUT" or @type is "PATCH")
      if @opts.requestContentType
        requestContentType = @opts.requestContentType
    else
      # if any form params
      if (param for param in @operation.parameters when param.paramType is "form").length > 0
        requestContentType = "application/x-www-form-urlencoded"
      else if @type isnt "DELETE"
        requestContentType = null

    # verify the content type is acceptable
    if requestContentType and @operation.consumes
      if @operation.consumes.indexOf(requestContentType) is -1
        console.log "server doesn't consume " + requestContentType + ", try " + JSON.stringify(@operation.consumes)
        if @requestContentType == null
          requestContentType = @operation.consumes[0]

    responseContentType = null
    # if get or post, set the content-type being sent, otherwise make it null
    if (@type is "POST" or @type is "GET")
      if @opts.responseContentType
        responseContentType = @opts.responseContentType
      else
        responseContentType = "application/json"
    else
      responseContentType = null

    # verify the content type can be produced
    if responseContentType and @operation.produces
      if @operation.produces.indexOf(responseContentType) is -1
        console.log "server can't produce " + responseContentType

    # prepare the body from params, if needed
    if requestContentType && requestContentType.indexOf("application/x-www-form-urlencoded") is 0
      # pull fields from args
      fields = {}
      possibleParams = (param for param in @operation.parameters when param.paramType is "form")

      values = {}
      for key, value of possibleParams
        if @params[value.name]
          values[value.name] = @params[value.name]
      urlEncoded = ""
      for key, value of values
        if urlEncoded != ""
          urlEncoded += "&"
        urlEncoded += encodeURIComponent(key) + '=' + encodeURIComponent(value)
      body = urlEncoded

    if requestContentType
      myHeaders["Content-Type"] = requestContentType
    if responseContentType
      myHeaders["Accept"] = responseContentType

    unless headers? and headers.mock?

      obj = 
        url: @url
        method: @type
        headers: myHeaders
        body: body
        on:
          error: (response) =>
            @errorCallback response, @opts.parent
          redirect: (response) =>
            @successCallback response, @opts.parent
          307: (response) =>
            @successCallback response, @opts.parent
          response: (response) =>
            @successCallback response, @opts.parent

      # apply authorizations
      e = {}
      if typeof window != 'undefined'
        e = window
      else
        e = exports
      e.authorizations.apply obj

      unless opts.mock?
        new SwaggerHttp().execute obj
      else
        console.log obj
        return obj

  asCurl: ->
    header_args = ("--header \"#{k}: #{v}\"" for k,v of @headers)
    "curl #{header_args.join(" ")} #{@url}"


# SwaggerHttp is a wrapper on top of Shred, which makes actual http requests
class SwaggerHttp
  Shred: null
  shred: null
  content: null

  constructor: ->    
    if typeof window != 'undefined'
      @Shred = require "./shred"
    else
      @Shred = require "shred"
    @shred = new @Shred()

    identity = (x) => x
    toString = (x) => x.toString
      
    if typeof window != 'undefined'
      @content = require "./shred/content"
      @content.registerProcessor(
        ["application/json; charset=utf-8","application/json","json"], { parser: (identity), stringify: toString })
    else
      @Shred.registerProcessor(
        ["application/json; charset=utf-8","application/json","json"], { parser: (identity), stringify: toString })

  execute: (obj) ->
    @shred.request obj

class SwaggerAuthorizations
  authz: null

  constructor: ->
    @authz = {}

  add: (name, auth) ->
    @authz[name] = auth
    auth

  apply: (obj) ->
    for key, value of @authz
      # see if it applies
      value.apply obj

class ApiKeyAuthorization
  type: null
  name: null
  value: null

  constructor: (name, value, type) ->
    @name = name
    @value = value
    @type = type

  apply: (obj) ->
    if @type == "query"
      if obj.url.indexOf('?') > 0
        obj.url = obj.url + "&" + @name + "=" + @value
      else
        obj.url = obj.url + "?" + @name + "=" + @value
      true
    else if @type == "header"
      obj.headers[@name] = @value

@SwaggerApi = SwaggerApi
@SwaggerResource = SwaggerResource
@SwaggerOperation = SwaggerOperation
@SwaggerRequest = SwaggerRequest
@SwaggerModelProperty = SwaggerModelProperty
@ApiKeyAuthorization = ApiKeyAuthorization

@authorizations = new SwaggerAuthorizations()
