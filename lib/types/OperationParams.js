'use strict';
var TYPES = [ 'query', 'header', 'path', 'formData', 'body' ];
function OperationParams(){
  this.types = {};
  for( var i=0; i<TYPES.length; i++ ){
    this.types[ TYPES[ i ] ] = {};
  }
}

OperationParams.prototype.set = function( type, name, value ){
  if( !this.types.hasOwnProperty( type ) ){
    throw new Error( 'Parameter type' + name + 'is not supported' );
  }

  this.types[ type ][ name ] = value;
};

OperationParams.prototype.get = function( type, name ){
  if( !this.types.hasOwnProperty( type ) ){
    throw new Error( 'Parameter type' + name + 'is not supported' );
  }

  return this.types[ type ][ name ];
};

OperationParams.prototype.exists = function( type, name ){
  if( Array.isArray( type ) ){
    for( var i = 0; i<type.length; i++ ){
      if( this.get( type[ i ], name )!== undefined ){
        return true;
      }
    }
    return false;
  }
  return this.get( type, name ) !== undefined;
};

module.exports = OperationParams;
