'use strict';
var deoopfy = require('deoopfy');
/**
 * Returns the available model names for a mongoose Connection.
 *
 * @param {mongoose.Connection} connection
 * @return {Array.<String>} model_names.
 */

exports.getModelNames = function getModelNames(connection) {
  if(connection === connection.base.connection) {
    return connection.modelNames().concat(connection.base.modelNames());
  }
  else {
    return connection.modelNames();
  }
};

/**
 * Maps a function over an array.
 *
 * @param {Function} fn The mapping function
 * @param {Array} arr The array to map over.
 * @param {Mixed} [ctx] The context object
 * @return {Array} ret The mapping result.
 */

exports.map = function(fn, arr, ctx) {
  var ret = [],
      len = arr.length,
      cb = ctx && ('prototype' in fn) ? fn.bind(ctx) : fn;

  for(var i = 0; i < len; i++) {
    var value = arr[i];

    ret.push(cb(value, i, arr));
  }

  return ret;
};

/**
 * Maps a function over an object's properties, returning an object with the
 * same keys, but the function's return values.
 *
 * @param {Function} fn The mapping function.
 * @param {Object} obj The object to map over.
 * @param {Mixed} [ctx] The context object
 * @return {Object} ret The mapping result.
 */

exports.mapValues = function mapValues(fn, obj, ctx) {
  var ret  = {},
      keys = Object.keys(obj),
      len  = keys.length,
      cb = ctx && ('prototype' in fn) ? fn.bind(ctx) : fn;

  for(var i = 0; i < len; i++) {
    var key   = keys[i],
        value = obj[key];

    ret[key] = cb(value, key, obj);
  }

  return ret;
};

/**
 * Filters an array, based on a predicate function, which should take value,
 * index and array as its arguments, and return a Boolean. If the predicate
 * returns true, the item is kept, else, it's discarted from the return array.
 *
 * @param {Function} fn A predicate function.
 * @param {Array} arr The array to filter.
 * @param {Mixed} [ctx] The context object
 * @return {Array} ret The filtered array.
 */

exports.filter = function(fn, arr, ctx) {
  var ret = [],
      len = arr.length,
      cb = ctx && ('prototype' in fn) ? fn.bind(ctx) : fn;

  for(var i = 0; i < len; i++) {
    var value = arr[i];
    if(cb(value, i, arr)) ret.push(value);
  }

  return ret;
};

var sliceF = deoopfy(Array.prototype.slice);

/**
 * Composes two functions into one.
 *
 * @param {Function} f The outer function in the composition.
 * @param {Function} g The inner function in the composition.
 * @return {Function} fog The composed function f over g.
 *
 * @example
 *   function f(x) { return x + 10; } // f(x) = x + 10
 *   function g(x) { return x / 2;  } // g(x) = x / 2
 *
 *   var fog = compose(f, g);         // fog(x) = f(g(x)) = (x/2) + 10
 *   fog(8) // => 14
 */

exports.compose = function(f, g) {
  return function() {
    var y = g.apply(this, arguments);
    return f.call(this, y);
  };
};

/**
 * Partially applies a function to a set of arguments.
 *
 * @param {Function} fn The function to bind args to.
 * @param {..Mixed} args A set of arguments.
 * @return {Function} ret The partially applied function.
 */

exports.partial = function(fn, args) {
  if(!Array.isArray(args)) args = sliceF(arguments, 1);

  var len = args.length;

  return function() {
    var allargs = sliceF(arguments);
    for(var i = 0; i < len; i++) allargs.unshift(args[i]);

    return fn.apply(this, allargs);
  };
};
