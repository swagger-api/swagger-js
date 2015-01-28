var ArrayModel = function(definition) {
  this.name = "name";
  this.definition = definition || {};
  this.properties = [];
  this.type;
  this.ref;

  var requiredFields = definition.enum || [];
  var items = definition.items;
  if(items) {
    var type = items.type;
    if(items.type) {
      this.type = typeFromJsonSchema(type.type, type.format);
    }
    else {
      this.ref = items['$ref'];
    }
  }
};

ArrayModel.prototype.createJSONSample = function(modelsToIgnore) {
  var result;
  modelsToIgnore = (modelsToIgnore||{});
  if(this.type) {
    result = type;
  }
  else if (this.ref) {
    var name = simpleRef(this.ref);
    result = models[name].createJSONSample();
  }
  return [ result ];
};

ArrayModel.prototype.getSampleValue = function(modelsToIgnore) {
  var result;
  modelsToIgnore = (modelsToIgnore || {});
  if(this.type) {
    result = type;
  }
  else if (this.ref) {
    var name = simpleRef(this.ref);
    result = models[name].getSampleValue(modelsToIgnore);
  }
  return [ result ];
};

ArrayModel.prototype.getMockSignature = function(modelsToIgnore) {
  var propertiesStr = [];

  if(this.ref) {
    return models[simpleRef(this.ref)].getMockSignature();
  }
};
