export default function createErrorType(name, init) {
  function E(...args) {
    if (!Error.captureStackTrace) {
      this.stack = new Error().stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
    [this.message] = args;

    if (init) {
      init.apply(this, args);
    }
  }

  E.prototype = new Error();
  E.prototype.name = name;
  E.prototype.constructor = E;

  return E;
}
