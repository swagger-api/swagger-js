import eachOperation from './each-operation.js';

// Will stop iterating over the operations and return the operationObj
// as soon as predicate returns true
export default function findOperation(spec, predicate) {
  return eachOperation(spec, predicate, true) || null;
}