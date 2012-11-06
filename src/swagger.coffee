class SwaggerApi
  
  # Defaults
  discoveryUrl: "http://api.wordnik.com/v4/resources.json"
  debug: false
  api_key: null
  basePath: null

  constructor: (options={}) ->
    @discoveryUrl = options.discoveryUrl if options.discoveryUrl?
    @debug = options.debug if options.debug?
    @apiKeyName = if options.apiKeyName? then options.apiKeyName else 'api_key'
    @api_key = options.apiKey if options.apiKey?
    @api_key = options.api_key if options.api_key?
    @verbose = options.verbose if options.verbose?
    @supportHeaderParams = if options.supportHeaderParams? then options.supportHeaderParams else false
    @supportedSubmitMethods = if options.supportedSubmitMethods? then options.supportedSubmitMethods else ['get']
    @success = options.success if options.success?
    @failure = if options.failure? then options.failure else ->
    @progress = if options.progress? then options.progress else ->
    @headers = if options.headers? then options.headers else {}
    @booleanValues = if options.booleanValues? then options.booleanValues else new Array('true', 'false')

    # Suffix discovery url with api_key
    @discoveryUrl = @suffixApiKey(@discoveryUrl)

    # Build right away if a callback was passed to the initializer
    @build() if options.success?
    
  build: ->
    @progress 'fetching resource list: ' + @discoveryUrl
    jQuery.getJSON(@discoveryUrl,
      (response) =>

        # If there is a basePath in response, use that or else derive from discoveryUrl
        if response.basePath? and jQuery.trim(response.basePath).length > 0
          @basePath = response.basePath
          @fail "discoveryUrl basePath must be a URL." unless @basePath.match(/^HTTP/i)?
          # TODO: Take this out. It's an API regression.
          @basePath = @basePath.replace(/\/$/, '')
        else
          # The base path derived from discoveryUrl
          @basePath = @discoveryUrl.substring(0, @discoveryUrl.lastIndexOf('/'))
          log 'derived basepath from discoveryUrl as ' + @basePath

        @resources = {}
        @resourcesArray = []

        # If this response contains resourcePath, all the resources in response belong to one single path
        if response.resourcePath?
          # set the resourcePath
          @resourcePath = response.resourcePath

          # create only one resource and add operations to the same one for the rest of them
          res = null
          for resource in response.apis
            if res is null
              res = new SwaggerResource resource, this
            else
              res.addOperations(resource.path, resource.operations)

          # if there are some resources
          if res?
            @resources[res.name] = res
            @resourcesArray.push res
            # Mark as ready
            res.ready = true

            # Now that this resource is loaded, tell the API to check in on itself
            @selfReflect()
        else
          # Store a Array of resources and a map of resources by name
          for resource in response.apis
            res = new SwaggerResource resource, this
            @resources[res.name] = res
            @resourcesArray.push res

        this

    ).error(
      (error) =>
        @fail error.status + ' : ' + error.statusText + ' ' + @discoveryUrl
    )

  # This method is called each time a child resource finishes loading
  # 
  selfReflect: ->
    return false unless @resources?
    for resource_name, resource of @resources
      return false unless resource.ready?

    @setConsolidatedModels()
    @ready = true
    @success() if @success?

  fail: (message) ->
    @failure message
    throw message

  # parses models in all resources and sets a unique consolidated list of models
  setConsolidatedModels: ->
    @modelsArray = []
    @models = {}
    for resource_name, resource of @resources
      for modelName of resource.models
        if not @models[modelName]?
          @models[modelName] = resource.models[modelName]
          @modelsArray.push resource.models[modelName]
    for model in @modelsArray
      model.setReferencedModels(@models)

  # Suffix a passed url with api_key
  #
  suffixApiKey: (url) ->
    if @api_key? and jQuery.trim(@api_key).length > 0 and url?
      sep = if url.indexOf('?') > 0 then '&' else '?'
      url + sep + @apiKeyName + '=' + @api_key
    else
      url

  help: ->
    for resource_name, resource of @resources
      console.log resource_name
      for operation_name, operation of resource.operations
        console.log "  #{operation.nickname}"
        for parameter in operation.parameters
          console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @
        
class SwaggerResource

  constructor: (resourceObj, @api) ->
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

    if resourceObj.operations? and @api.resourcePath?
      # read resource directly from operations object
      @api.progress 'reading resource ' + @name + ' models and operations'

      @addModels(resourceObj.models)

      @addOperations(resourceObj.path, resourceObj.operations)


      # Store a named reference to this resource on the parent object
      @api[this.name] = this

    else
      # read from server
      @api.fail "SwaggerResources must have a path." unless @path?

      # e.g."http://api.wordnik.com/v4/word.json"
      @url = @api.suffixApiKey(@api.basePath + @path.replace('{format}', 'json'))

      @api.progress 'fetching resource ' + @name + ': ' + @url
      jQuery.getJSON(@url
        (response) =>

          # If there is a basePath in response, use that or else use
          # the one from the api object
          if response.basePath? and jQuery.trim(response.basePath).length > 0
            @basePath = response.basePath
            # TODO: Take this out.. it's a wordnik API regression
            @basePath = @basePath.replace(/\/$/, '')

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
        ).error(
        (error) =>
          @api.fail error.status + ' : ' + error.statusText + ' ' + @url
        )


  addModels: (models) ->
    if models?
      for modelName of models
        swaggerModel = new SwaggerModel(modelName, models[modelName])
        @modelsArray.push swaggerModel
        @models[modelName] = swaggerModel
      for model in @modelsArray
        model.setReferencedModels(@models)


  addOperations: (resource_path, ops) ->
    if ops
      for o in ops
        op = new SwaggerOperation o.nickname, resource_path, o.httpMethod, o.parameters, o.summary, o.notes, o.responseClass, this
        @operations[op.nickname] = op
        @operationsArray.push op


  help: ->
    for operation_name, operation of @operations
      console.log "  #{operation.nickname}"
      for parameter in operation.parameters
        console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @


class SwaggerModel
  constructor: (modelName, obj) ->
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

  getMockSignature: (prefix, modelToIgnore) ->
    propertiesStr = []
    for prop in @properties
      propertiesStr.push prop.toString()

    strong = '<span style="font-weight: bold; color: #000; font-size: 1.0em">';
    stronger = '<span style="font-weight: bold; color: #000; font-size: 1.1em">';
    strongClose = '</span>';
    classOpen = strong + 'class ' + @name + '(' + strongClose
    classClose = strong + ')' + strongClose
    returnVal = classOpen + '<span>' + propertiesStr.join('</span>, <span>') + '</span>' + classClose

    if prefix?
      returnVal = stronger + prefix + strongClose + '<br/>' + returnVal

    # iterate thru all properties and add models
    # which are not modelToIgnore
    # modelToIgnore is used to ensure that recursive references do not lead to endless loop
    for prop in @properties
      if(prop.refModel? and (not (prop.refModel is modelToIgnore)))
        returnVal = returnVal + ('<br>' + prop.refModel.getMockSignature(undefined, @))

    returnVal

class SwaggerModelProperty
  constructor: (@name, obj) ->
    @dataType = obj.type
    @isArray = @dataType.toLowerCase() is 'array'
    @descr = obj.description
    if obj.items?
      if obj.items.type? then @refDataType = obj.items.type
      if obj.items.$ref? then @refDataType = obj.items.$ref
    @dataTypeWithRef = if @refDataType? then (@dataType + '[' + @refDataType + ']') else @dataType
    if obj.allowableValues?
      @valueType = obj.allowableValues.valueType
      @values = obj.allowableValues.values
      if @values?
        @valuesString = "'" + @values.join("' or '") + "'"

  toString: ->
    str = @name + ': ' + @dataTypeWithRef
    if @values?
      str += " = ['" + @values.join("' or '") + "']"
    if @descr?
      str += ' {' + @descr + '}'
    str


class SwaggerOperation

  constructor: (@nickname, @path, @httpMethod, @parameters=[], @summary, @notes, @responseClass, @resource) ->
    @resource.api.fail "SwaggerOperations must have a nickname." unless @nickname?
    @resource.api.fail "SwaggerOperation #{nickname} is missing path." unless @path?
    @resource.api.fail "SwaggerOperation #{nickname} is missing httpMethod." unless @httpMethod?
    # Convert {format} to 'json'
    @path = @path.replace('{format}', 'json')
    @httpMethod = @httpMethod.toLowerCase()
    @isGetMethod = @httpMethod == "get"
    @resourceName = @resource.name

    # if void clear it
    if(@responseClass.toLowerCase() is 'void') then @responseClass = undefined
    if @responseClass?
      # set the signature of response class
      @responseClassSignature = @getSignature(@responseClass, @resource.models)

    for parameter in @parameters
      # Path params do not have a name, set the name to the path if name is n/a
      parameter.name = parameter.name || parameter.dataType

      if(parameter.dataType.toLowerCase() is 'boolean')
        parameter.allowableValues = {}
        parameter.allowableValues.values = @resource.api.booleanValues

      parameter.signature = @getSignature(parameter.dataType, @resource.models)

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

  isListType: (dataType) ->
    if(dataType.indexOf('[') >= 0) then dataType.substring(dataType.indexOf('[') + 1, dataType.indexOf(']')) else undefined

  getSignature: (dataType, models) ->
    # set listType if it exists
    listType = @isListType(dataType)

    # set flag which says if its primitive or not
    isPrimitive = if ((listType? and models[listType]) or models[dataType]?) then false else true

    if (isPrimitive) then dataType else (if listType? then models[listType].getMockSignature(dataType) else models[dataType].getMockSignature(dataType))
      
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

  pathJson: -> @path.replace "{format}", "json"

  pathXml: -> @path.replace "{format}", "xml"

  urlify: (args, includeApiKey = true) ->
    
    url = @resource.basePath + @pathJson()

    # Iterate over allowable params, interpolating the 'path' params into the url string.
    # Whatever's left over in the args object will become the query string
    for param in @parameters
      if param.paramType == 'path'
        
        if args[param.name]
          url = url.replace("{#{param.name}}", encodeURIComponent(args[param.name]))
          delete args[param.name]
        else
          throw "#{param.name} is a required path param."

    # Add API key to the params
    args[@apiKeyName] = @resource.api.api_key if includeApiKey and @resource.api.api_key? and @resource.api.api_key.length > 0 

    # Append the query string to the URL
    if @supportHeaderParams()
      queryParams = jQuery.param(@getQueryParams(args, includeApiKey))
    else
      queryParams = jQuery.param(@getQueryAndHeaderParams(args, includeApiKey))

    url += ("?" + queryParams) if queryParams? and queryParams.length > 0

    url

  supportHeaderParams: ->
    @resource.api.supportHeaderParams

  supportedSubmitMethods: ->
    @resource.api.supportedSubmitMethods

  getQueryAndHeaderParams: (args, includeApiKey = true) ->
    @getMatchingParams ['query', 'header'], args, includeApiKey

  getQueryParams: (args, includeApiKey = true) ->
    @getMatchingParams ['query'], args, includeApiKey
 
  getHeaderParams: (args, includeApiKey = true) ->
    @getMatchingParams ['header'], args, includeApiKey

  # From args extract params of paramType and return them
  getMatchingParams: (paramTypes, args, includeApiKey) ->
    matchingParams = {}
    for param in @parameters
      if (jQuery.inArray(param.paramType, paramTypes) >= 0) and args[param.name]
        matchingParams[param.name] = args[param.name]

    #machingParams API key to the params
    if includeApiKey and @resource.api.api_key? and @resource.api.api_key.length > 0
      matchingParams[@resource.api.apiKeyName] = @resource.api.api_key

    if (jQuery.inArray('header', paramTypes) >= 0)
      for name, value of @resource.api.headers
        matchingParams[name] = value

    matchingParams

  help: ->
    for parameter in @parameters
      console.log "    #{parameter.name}#{if parameter.required then ' (required)'  else ''} - #{parameter.description}"
    @


class SwaggerRequest
  
  constructor: (@type, @url, @headers, @body, @successCallback, @errorCallback, @operation) ->
    throw "SwaggerRequest type is required (get/post/put/delete)." unless @type?
    throw "SwaggerRequest url is required." unless @url?
    throw "SwaggerRequest successCallback is required." unless @successCallback?
    throw "SwaggerRequest error callback is required." unless @errorCallback?
    throw "SwaggerRequest operation is required." unless @operation?
    
    # console.log "new SwaggerRequest: %o", this
    console.log this.asCurl() if @operation.resource.api.verbose
    
    # Stick the API key into the headers, if present
    @headers or= {}
    @headers[@apiKeyName] = @operation.resource.api.api_key if @operation.resource.api.api_key?

    unless @headers.mock?
    
      obj = 
        type: @type
        url: @url
        # TODO: Figure out why the API is not accepting these
        # headers: @headers
        data: JSON.stringify(@body)
        dataType: 'json'
        error: (xhr, textStatus, error) =>
          @errorCallback(xhr, textStatus, error)
        success: (data) =>
          @successCallback(data)

      obj.contentType = "application/json" if (obj.type.toLowerCase() == "post" or obj.type.toLowerCase() == "put")
    
      jQuery.ajax(obj)

  asCurl: ->
    header_args = ("--header \"#{k}: #{v}\"" for k,v of @headers)
    "curl #{header_args.join(" ")} #{@url}"
  
# Expose these classes:
window.SwaggerApi = SwaggerApi
window.SwaggerResource = SwaggerResource
window.SwaggerOperation = SwaggerOperation
window.SwaggerRequest = SwaggerRequest