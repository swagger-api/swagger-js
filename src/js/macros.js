/**
 * allows override of the default value based on the parameter being
 * supplied
 **/
var applyParameterMacro = function (model, parameter) {
  var e = (typeof window !== 'undefined' ? window : exports);
  if(e.parameterMacro)
    return e.parameterMacro(model, parameter);
  else
    return parameter.defaultValue;
};

/**
 * allows overriding the default value of an operation
 **/
var applyModelPropertyMacro = function (operation, property) {
  var e = (typeof window !== 'undefined' ? window : exports);
  if(e.modelPropertyMacro)
    return e.modelPropertyMacro(operation, property);
  else
    return property.defaultValue;
};
