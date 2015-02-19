var ArrayModel = function(definition) {
  this.name = "arrayModel";
  this.definition = definition || {};
  this.properties = [];
  
  var requiredFields = definition.enum || [];
  var innerType = definition.items;
  if(innerType) {
    if(innerType.type) {
      this.type = typeFromJsonSchema(innerType.type, innerType.format);
    }
    else {
      this.ref = innerType.$ref;
    }
  }
  return this;
};

ArrayModel.prototype.createJSONSample = function(modelsToIgnore) {
  var result;
  modelsToIgnore = (modelsToIgnore||{});
  if(this.type) {
    result = this.type;
  }
  else if (this.ref) {
    var name = simpleRef(this.ref);
    if(typeof modelsToIgnore[name] === 'undefined') {
      modelsToIgnore[name] = this;
      result = models[name].createJSONSample(modelsToIgnore);
    }
    else {
      return name;
    }
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
  var i, prop;
  for (i = 0; i < this.properties.length; i++) {
    prop = this.properties[i];
    propertiesStr.push(prop.toString());
  }

  var strong = '<span class="strong">';
  var stronger = '<span class="stronger">';
  var strongClose = '</span>';
  var classOpen = strong + 'array' + ' {' + strongClose;
  var classClose = strong + '}' + strongClose;
  var returnVal = classOpen + '<div>' + propertiesStr.join(',</div><div>') + '</div>' + classClose;

  if (!modelsToIgnore)
    modelsToIgnore = {};
  modelsToIgnore[this.name] = this;
  for (i = 0; i < this.properties.length; i++) {
    prop = this.properties[i];
    var ref = prop.$ref;
    var model = models[ref];
    if (model && typeof modelsToIgnore[ref] === 'undefined') {
      returnVal = returnVal + ('<br>' + model.getMockSignature(modelsToIgnore));
    }
  }
  return returnVal;
};
