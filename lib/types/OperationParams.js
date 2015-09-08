'use strict';
var TYPES = [ 'query', 'header', 'path', 'formData', 'body' ];
function findFirstParam( name, parameters ){
    for( var i=0; i<parameters.length; i++ ){
      if( parameters[ i ].name === name ){
        return parameters[ i ];
      }
    }
    return null;
}

function OperationParams( args ){
  this.types = {};
  for( var i=0; i<TYPES.length; i++ ){
    this.types[ TYPES[ i ] ] = {};
  }

  args = args || {};
  this.parameters = args.parameters || [];
  for( var p in args ){
    var parameter = findFirstParam( p, this.parameters );
    if( parameter ){
      this.set( parameter.in, parameter.name, args[ p ] );
    }
    else{
      this[ p ] = args[ p ];
    }
  }
}

OperationParams.prototype.set = function( type, name, value ){
  if( TYPES.indexOf( type )<0 ){
    throw new Error( 'Parameter type' + name + 'is not supported' );
  }

  this.types[ type ][ name ] = value;
};

OperationParams.prototype.get = function( type, name ){
  if( TYPES.indexOf( type )<0 ){
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
