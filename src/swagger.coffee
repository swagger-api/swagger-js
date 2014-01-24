class SwaggerApi
  
  # Defaults
  url: "http://api.wordnik.com/v4/resources.json"
  debug: false
  basePath: null
  authorizations: null
  authorizationScheme: null
  info: null
  useJQuery: null 

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

    @success = options.success if options.success?
    @failure = if options.failure? then options.failure else ->
    @progress = if options.progress? then options.progress else ->

    # Build right away if a callback was passed to the initializer
    @build() if options.success?

  build: ->
    @progress 'fetching resource list: ' + @url
    obj = 
      useJQuery: @useJQuery
      url: @url
      method: "get"
      headers: {}
      on:
        error: (response) =>
          if @url.substring(0, 4) isnt 'http'
            @fail 'Please specify the protocol for ' + @url
          else if response.status == 0
            @fail 'Can\'t read from server.  It may not have the appropriate access-control-origin settings.'
          else if response.status == 404
            @fail 'Can\'t read swagger JSON from '  + @url
          else
            @fail response.status + ' : ' + response.statusText + ' ' + @url
        response: (response) =>
          responseObj = JSON.parse(response.data)
          @swaggerVersion = responseObj.swaggerVersion

          if @swaggerVersion is "1.2"
            @buildFromSpec responseObj
          else
            @buildFrom1_1Spec responseObj
          
    # apply authorizations
    e = {}
    if typeof window != 'undefined'
      e = window
    else
      e = exports
    e.authorizations.apply obj

    new SwaggerHttp().execute obj
    @

  # build the spec
  buildFromSpec: (response)->
    @apiVersion = response.apiVersion if response.apiVersion?
    @apis = {}
    @apisArray = []
    @produces = response.produces
    @authSchemes = response.authorizations
    @info = response.info if response.info?

    # if apis.operations exists, this is an api declaration as opposed to a resource listing
    isApi = false
    for api in response.apis
      if api.operations
        for operation in api.operations
          isApi = true

    # The base path derived from url
    if response.basePath
      # support swagger 1.1, which has basePath
      @basePath = response.basePath
    else if @url.indexOf('?') > 0
      @basePath = @url.substring(0, @url.lastIndexOf('?'))
    else
      @basePath = @url

    if isApi
      newName = response.resourcePath.replace(/\//g,'')
      this.resourcePath = response.resourcePath

      res = new SwaggerResource response, this
      @apis[newName] = res
      @apisArray.push res
    else
      for resource in response.apis
        res = new SwaggerResource resource, this
        @apis[res.name] = res
        @apisArray.push res
    if this.success
      this.success()
    this


  buildFrom1_1Spec: (response)->
    log "This API is using a deprecated version of Swagger!  Please see http://github.com/wordnik/swagger-core/wiki for more info"
    @apiVersion = response.apiVersion if response.apiVersion?
    @apis = {}
    @apisArray = []
    @produces = response.produces
    @info = response.info if response.info?

    # if apis.operations exists, this is an api declaration as opposed to a resource listing
    isApi = false
    for api in response.apis
      if api.operations
        for operation in api.operations
          isApi = true

    # The base path derived from url
    if response.basePath
      # support swagger 1.1, which has basePath
      @basePath = response.basePath
    else if @url.indexOf('?') > 0
      @basePath = @url.substring(0, @url.lastIndexOf('?'))
    else
      @basePath = @url

    if isApi
      newName = response.resourcePath.replace(/\//g,'')
      this.resourcePath = response.resourcePath

      res = new SwaggerResource response, this
      @apis[newName] = res
      @apisArray.push res
    else
      for resource in response.apis
        res = new SwaggerResource resource, this
        @apis[res.name] = res
        @apisArray.push res
    if this.success
      this.success()
    this

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
      log resource_name
      for operation_name, operation of resource.operations
        log "  #{operation.nickname}"
        for parameter in operation.parameters
          log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
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
    @rawModels = {}

    if resourceObj.apis? and @api.resourcePath?
      # read resource directly from operations object
      @addApiDeclaration(resourceObj)

    else
      # read from server
      @api.fail "SwaggerResources must have a path." unless @path?

      # e.g."http://api.wordnik.com/v4/word.json"

      if @path.substring(0,4) == 'http'
        # user absolute path
        @url = @path.replace('{format}', 'json')
      else
        @url = @api.basePath + @path.replace('{format}', 'json')

      @api.progress 'fetching resource ' + @name + ': ' + @url
      obj = 
        url: @url
        method: "get"
        useJQuery: @useJQuery
        headers: {}
        on:
          error: (response) =>
            @api.fail "Unable to read api '" + @name + "' from path " + @url + " (server returned " + response.statusText + ")"
          response: (response) =>
            responseObj = JSON.parse(response.data)
            @addApiDeclaration(responseObj)

      # apply authorizations
      e = {}
      if typeof window != 'undefined'
        e = window
      else
        e = exports
      e.authorizations.apply obj

      new SwaggerHttp().execute obj

  # Constructs an absolute resource's basePath from relative one, using the @api basePath
  # eg. if the @api.basePath = http://myhost.com:8090/mywebapp/v0/api-docs 
  # and the resource response contains a relative basePath='v0'
  # then the function will return 'http://myhost.com:8090/mywebapp/v0'
  getAbsoluteBasePath: (relativeBasePath) ->
    url = @api.basePath
    # first check if the base is a part of given url
    pos = url.lastIndexOf(relativeBasePath)
    if pos is -1
      # take the protocol, host and port parts only and glue the 'relativeBasePath'
      parts = url.split("/")
      url = parts[0] + "//" + parts[2]
      if relativeBasePath.indexOf("/") is 0
         url + relativeBasePath
      else
         url + "/" + relativeBasePath
    else if (relativeBasePath is "/")
      url.substring(0, pos)
    else
      url.substring(0, pos) + relativeBasePath

  addApiDeclaration: (response) ->
    if response.produces?
      @produces = response.produces
    if response.consumes?
      @consumes = response.consumes

    # If there is a basePath in response, use that or else use
    # the one from the api object
    if response.basePath? and response.basePath.replace(/\s/g,'').length > 0
      @basePath = if response.basePath.indexOf("http") is -1 then @getAbsoluteBasePath(response.basePath) else response.basePath

    @addModels(response.models)

    # Instantiate SwaggerOperations and store them in the @operations map and @operationsArray
    if response.apis
      for endpoint in response.apis
        @addOperations(endpoint.path, endpoint.operations, response.consumes, response.produces)

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
          @rawModels[modelName] = models[modelName];
      for model in @modelsArray
        model.setReferencedModels(@models)


  addOperations: (resource_path, ops, consumes, produces) ->
    if ops
      for o in ops
        consumes = @consumes
        produces = @produces

        if o.consumes?
          consumes = o.consumes
        else
          consumes = @consumes

        if o.produces?
          produces = o.produces
        else
          produces = @produces

        type = o.type || o.responseClass
        if(type is "array")
          ref = null
          if o.items
            ref = o.items["type"] || o.items["$ref"]
          type = "array[" + ref + "]"

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
          for r in responseMessages
            r.message = r.reason
            r.reason = null

        # sanitize the nickname
        o.nickname = @sanitize o.nickname

        op = new SwaggerOperation o.nickname, resource_path, method, o.parameters, o.summary, o.notes, type, responseMessages, this, consumes, produces, o.authorizations
        @operations[op.nickname] = op
        @operationsArray.push op

  sanitize: (nickname) ->
    # allow only _a-zA-Z0-9
    op = nickname.replace /[\s!@#$%^&*()_+=\[{\]};:<>|./?,\\'""-]/g, '_'
    # trim multiple underscores to one
    op = op.replace /((_){2,})/g, '_'
    # ditch leading underscores
    op = op.replace /^(_)*/g, ''
    # ditch trailing underscores
    op = op.replace /([_])*$/g, ''
    op

  help: ->
    for operation_name, operation of @operations
      msg = "  #{operation.nickname}"
      for parameter in operation.parameters
        msg.concat("    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}")
      msg


class SwaggerModel
  constructor: (modelName, obj) ->
    @name = if obj.id? then obj.id else modelName
    @properties = []
    for propertyName of obj.properties
      if obj.required?
        for value of obj.required
          if propertyName is obj.required[value]
            obj.properties[propertyName].required = true
      prop = new SwaggerModelProperty(propertyName, obj.properties[propertyName])
      @properties.push prop
    # support the 1.2 spec for required fields


  # Set models referenced  bu this model
  setReferencedModels: (allModels) ->
    for prop in @properties
      type = prop.type || prop.dataType
      if allModels[type]?
        prop.refModel = allModels[type]
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
      if(prop.refModel? and (modelsToIgnore[prop.refModel] != 'undefined') == -1)
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
    @dataType = obj.type || obj.dataType || obj["$ref"]
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
    if obj.enum?
      @valueType = "string"
      @values = obj.enum
      if @values?
        @valueString = "'" + @values.join("' or '") + "'"

  getSampleValue: (modelsToIgnore) ->
    if(@refModel? and (modelsToIgnore[@refModel.name] is 'undefined'))
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
  constructor: (@nickname, @path, @method, @parameters=[], @summary, @notes, @type, @responseMessages, @resource, @consumes, @produces, @authorizations) ->
    @resource.api.fail "SwaggerOperations must have a nickname." unless @nickname?
    @resource.api.fail "SwaggerOperation #{nickname} is missing path." unless @path?
    @resource.api.fail "SwaggerOperation #{nickname} is missing method." unless @method?

    # Convert {format} to 'json'
    @path = @path.replace('{format}', 'json')
    @method = @method.toLowerCase()
    @isGetMethod = @method == "get"
    @resourceName = @resource.name

    # if void clear it
    if(@type?.toLowerCase() is 'void') then @type = undefined
    if @type?
      # set the signature of response class
      @responseClassSignature = @getSignature(@type, @resource.models)
      @responseSampleJSON = @getSampleJSON(@type, @resource.models)

    @responseMessages = @responseMessages || []

    for parameter in @parameters
      # Path params do not have a name, set the name to the path if name is n/a
      parameter.name = parameter.name || parameter.type || parameter.dataType

      type = parameter.type || parameter.dataType

      if(type.toLowerCase() is 'boolean')
        parameter.allowableValues = {}
        parameter.allowableValues.values = ["true", "false"]

      parameter.signature = @getSignature(type, @resource.models)
      parameter.sampleJSON = @getSampleJSON(type, @resource.models)

      if parameter.enum?
        parameter.isList = true
        # set the values
        parameter.allowableValues = {}
        parameter.allowableValues.descriptiveValues = []
        for v in parameter.enum
          if parameter.defaultValue? and parameter.defaultValue == v
            parameter.allowableValues.descriptiveValues.push {value: String(v), isDefault: true}
          else
            parameter.allowableValues.descriptiveValues.push {value: String(v), isDefault: false}

      # Set allowableValue attributes for 1.1 spec
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

  isListType: (type) ->
    if(type.indexOf('[') >= 0) then type.substring(type.indexOf('[') + 1, type.indexOf(']')) else undefined

  getSignature: (type, models) ->
    # set listType if it exists
    listType = @isListType(type)

    # set flag which says if its primitive or not
    isPrimitive = if ((listType? and models[listType]) or models[type]?) then false else true

    if (isPrimitive) then type else (if listType? then models[listType].getMockSignature() else models[type].getMockSignature())

  getSampleJSON: (type, models) ->
    # set listType if it exists
    listType = @isListType(type)

    # set flag which says if its primitive or not
    isPrimitive = if ((listType? and models[listType]) or models[type]?) then false else true

    val = if (isPrimitive) then undefined else (if listType? then models[listType].createJSONSample() else models[type].createJSONSample())

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
      error = (xhr, textStatus, error) -> 
        log xhr, textStatus, error

    # Define a default success handler
    unless callback?
      callback = (response) ->
        content = null
        if response?
          content = response.data
        else
          content = "no data"
        log "default callback: " + content
    
    # params to pass into the request
    params = {}
    params.headers = []

    # Pull headers out of args    
    if args.headers?
      params.headers = args.headers
      delete args.headers

    for param in @parameters when (param.paramType is "header" )
      if args[param.name]
        params.headers[param.name] = args[param.name]
      
    # Pull body out of args
    if args.body?
      params.body = args.body
      delete args.body

    # pull out any form params
    possibleParams = (param for param in @parameters when (param.paramType is "form" or param.paramType.toLowerCase() is "file" ))
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
    # some servers will die if content-type is set but there is no body
    if body and (@type is "POST" or @type is "PUT" or @type is "PATCH")
      if @opts.requestContentType
        requestContentType = @opts.requestContentType
    else
      # if any form params, content-type must be set
      if (param for param in @operation.parameters when param.paramType is "form").length > 0
        type = param.type || param.dataType
        if (param for param in @operation.parameters when type.toLowerCase() is "file").length > 0
          requestContentType = "multipart/form-data"
        else
          requestContentType = "application/x-www-form-urlencoded"
      else if @type isnt "DELETE"
        requestContentType = null

    # verify the content type is acceptable from what it defines
    if requestContentType and @operation.consumes
      if @operation.consumes[requestContentType] is 'undefined'
        log "server doesn't consume " + requestContentType + ", try " + JSON.stringify(@operation.consumes)
        if @requestContentType == null
          requestContentType = @operation.consumes[0]

    responseContentType = null
    # if get or post, set the content-type being sent, otherwise make it null
    if (@type is "POST" or @type is "GET" or @type is "PATCH")
      if @opts.responseContentType
        responseContentType = @opts.responseContentType
      else
        responseContentType = "application/json"
    else
      responseContentType = null

    # verify the content type can be produced
    if responseContentType and @operation.produces
      if @operation.produces[responseContentType] is 'undefined'
        log "server can't produce " + responseContentType

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
    for name of headers
      myHeaders[name] = headers[name]
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
        useJQuery: @useJQuery
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
      status = e.authorizations.apply obj, @operation.authorizations

      unless opts.mock?
        if status isnt false
          new SwaggerHttp().execute obj
        else
          obj.canceled = true
      else
        return obj

  asCurl: ->
    header_args = ("--header \"#{k}: #{v}\"" for k,v of @headers)
    "curl #{header_args.join(" ")} #{@url}"

class SwaggerHttp
  Shred: null
  shred: null
  content: null

  initShred: ->
    if typeof window != 'undefined'
      @Shred = require "./shred"
    else
      @Shred = require "shred"
    @shred = new @Shred()

    identity = (x) => x
    toString = (x) => x.toString()
      
    if typeof window != 'undefined'
      @content = require "./shred/content"
      @content.registerProcessor(
        ["application/json; charset=utf-8","application/json","json"],
        {
          parser: (identity),
          stringify: toString 
        }
      )
    else
      @Shred.registerProcessor(
        ["application/json; charset=utf-8","application/json","json"],
        {
          parser: (identity),
          stringify: toString
        }
      )

  execute: (obj) ->
    if @isIE() or obj.useJQuery
      @executeWithJQuery obj
    else
      @executeWithShred obj

  executeWithShred: (obj) ->
    if !@Shred
      @initShred()
    cb = obj.on
    res = {
      error: (response) =>
        if obj
          cb.error response
      redirect: (response) =>
        if obj
          cb.redirect response
      307: (response) =>
        if obj
          cb.redirect response
      response: (raw) =>
        if obj
          headers = raw._headers
          out = {
            headers: headers
            url: raw.request.url
            method: raw.request.method
            status: raw.status
            data: raw.content.data
          }
          cb.response out
    }
    if obj
      obj.on = res

    @shred.request obj

  executeWithJQuery: (obj) ->
    cb = obj.on
    request = obj
    obj.type = obj.method
    obj.cache = false

    # set headers
    beforeSend = (xhr) ->
      if obj.headers
        for key of obj.headers
          if key.toLowerCase() is "content-type"
            obj.contentType = obj.headers[key]
          else if key.toLowerCase() is "accept"
            obj.accepts = obj.headers[key]
          else
            xhr.setRequestHeader(key, obj.headers[key])

    obj.beforeSend = beforeSend
    obj.data = obj.body

    obj.complete = (response, textStatus, opts) =>
      headers = {}
      headerArray = response.getAllResponseHeaders().split(":")
      for i in [0..headerArray.length/2] by (2)
        headers[headerArray[i]] = headerArray[i+1]

      out = {
        headers: headers
        url: request.url
        method: request.method
        status: response.status
        data: response.responseText
        headers: headers
      }
      if response.status in [200..299]
        cb.response out
      if response.status in [400..599] or response.status is 0
        cb.error out
      cb.response out
    $.support.cors = true
    $.ajax(obj)

  isIE:() ->
    isIE: false
    if typeof navigator isnt 'undefined' and navigator.userAgent
      nav = navigator.userAgent.toLowerCase()
      if nav.indexOf('msie') isnt -1
        version = parseInt(nav.split('msie')[1])
        if version <= 8
          isIE = true
    isIE

class SwaggerAuthorizations
  authz: null

  constructor: ->
    @authz = {}

  add: (name, auth) ->
    @authz[name] = auth
    auth

  remove: (name) ->
    delete @authz[name]

  apply: (obj, authorizations) ->
    status = null
    for key, value of @authz
      # see if it applies
      result = value.apply obj, authorizations
      if result is false
        status = false
      if result is true
        status = true
    status

class ApiKeyAuthorization
  type: null
  name: null
  value: null

  constructor: (name, value, type) ->
    @name = name
    @value = value
    @type = type

  apply: (obj, authorizations) ->
    if @type == "query"
      if obj.url.indexOf('?') > 0
        obj.url = obj.url + "&" + @name + "=" + @value
      else
        obj.url = obj.url + "?" + @name + "=" + @value
      true
    else if @type == "header"
      obj.headers[@name] = @value
      true

class PasswordAuthorization
  @_btoa: null
  name: null
  username: null
  password: null

  constructor: (name, username, password) ->
    @name = name
    @username = username
    @password = password
    PasswordAuthorization._ensureBtoa()

  apply: (obj, authorizations) ->
    obj.headers["Authorization"] = "Basic " + PasswordAuthorization._btoa(@username + ":" + @password)
    true

  @_ensureBtoa: ->
    if typeof window != 'undefined'
      @_btoa = btoa
    else
      @_btoa = require "btoa"

@SwaggerApi = SwaggerApi
@SwaggerResource = SwaggerResource
@SwaggerOperation = SwaggerOperation
@SwaggerRequest = SwaggerRequest
@SwaggerModelProperty = SwaggerModelProperty
@ApiKeyAuthorization = ApiKeyAuthorization
@PasswordAuthorization = PasswordAuthorization
@SwaggerHttp = SwaggerHttp

@authorizations = new SwaggerAuthorizations()
