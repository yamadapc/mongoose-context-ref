'use strict';
/**
 * Returns the available model names for a mongoose Connection.
 *
 * @param {mongoose.Connection} connection
 * @return {Array.<String>} model_names.
 */

exports.getModelNames = function getModelNames(connection) {
  var model_names = Object.keys(connection.base.models);
  if(model_names.length) return model_names;
  else return connection.modelNames();
};

/**
 * Maps a function over an object's properties, returning an object with the
 * same keys, but the function's return values.
 *
 * @param {Function} fn The mapping function.
 * @param {Object} obj The object to map over.
 * @return {Object} ret The mapping result.
 */

exports.mapValues = function mapValues(fn, obj) {
  var ret  = {},
      keys = Object.keys(obj),
      len  = keys.length;

  for(var i = 0; i < len; i++) {
    var key   = keys[i],
        value = obj[key];

    ret[key] = fn(value, key, obj);
  }

  return ret;
};

/**
 * Takes a function which acts on a context object, and returns a function which
 * takes the context as its first arguments. Though we can't generate functions
 * with arbitrary arity's - the `.length` property, the `method`'s length is
 * stored at `fn`'s `._length` property. This makes this function compatible
 * with, for example, lodash's curry function, or other functional utils.
 *
 * @param {Function} method The method to "deOOP-fy".
 * @return {Function} fn The generated function.
 *
 * @example
 *   var slice = deoopfy(Array.prototype.slice);
 *   slice([1, 2, 3], 1) // => [2, 3]
 */

exports.deoopfy = function(method) {
  var fn = function(obj, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return method.apply(obj, args);
  };
  fn._length = method.length;

  return fn;
};
