'use strict';

var OperationGroup = module.exports = function (tag, tagOrder, description, externalDocs, operation) {
  this.description = description;
  this.externalDocs = externalDocs;
  this.name = tag;
  this.operation = operation;
  this.operationsArray = [];
  this.path = tag;
  this.tag = tag;
  this.tagOrder = tagOrder; // remember the tag order
};

OperationGroup.prototype.sort = function () {

};
