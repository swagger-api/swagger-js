'use strict';

var OperationGroup = module.exports = function (tag, description, externalDocs, operation) {
  this.tag = tag;
  this.path = tag;
  this.description = description;
  this.externalDocs = externalDocs;
  this.name = tag;
  this.operation = operation;
  this.operationsArray = [];
};

OperationGroup.prototype.sort = function () {

};

