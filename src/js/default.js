var __bind = function(fn, me){
  return function(){
    return fn.apply(me, arguments);
  };
};

fail = function(message) {
  log(message);
};

log = function(){
  log.history = log.history || [];
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments)[0] );
  }
};

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i++) {
      if (this[i] === obj) { return i; }
    }
    return -1;
  };
}

if (!('filter' in Array.prototype)) {
  Array.prototype.filter= function(filter, that /*opt*/) {
    var other= [], v;
    for (var i=0, n= this.length; i<n; i++)
      if (i in this && filter.call(that, v= this[i], i, this))
        other.push(v);
    return other;
  };
}

if (!('map' in Array.prototype)) {
  Array.prototype.map= function(mapper, that /*opt*/) {
    var other= new Array(this.length);
    for (var i= 0, n= this.length; i<n; i++)
      if (i in this)
        other[i]= mapper.call(that, this[i], i, this);
    return other;
  };
}

Object.keys = Object.keys || (function () {
  var hasOwnProperty = Object.prototype.hasOwnProperty,
    hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
    DontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ],
  DontEnumsLength = DontEnums.length;

  return function (o) {
    if (typeof o != "object" && typeof o != "function" || o === null)
      throw new TypeError("Object.keys called on a non-object");

    var result = [];
    for (var name in o) {
      if (hasOwnProperty.call(o, name))
        result.push(name);
    }

    if (hasDontEnumBug) {
      for (var i = 0; i < DontEnumsLength; i++) {
        if (hasOwnProperty.call(o, DontEnums[i]))
          result.push(DontEnums[i]);
      }
    }

    return result;
  };
})();
