'use strict';
/**
 * Adds serialization to a schema.
 *
 * @param {mongoose.Schema} schema The target schema.
 * @param {Boolean} [camel_case] Whether to use camel case.
 */

exports.add = function add(schema, camel_case) {
  var toJSON = schema.methods.toJSON; // try using already overwritten method.
  schema.methods.toJSON = function() {
    // get plain javascript object, with a dance.
    var obj;
    if(toJSON) obj = toJSON.apply(this, arguments);
    else obj = this.toObject.apply(this, arguments);

    // serialize the plain object
    return exports.serialize(obj, camel_case);
  };
};

/**
 * Serializes an object, merging its `context_type` and `context_id` paths into
 * one path, obtained through converting its `context_type` to snake_case or, if
 * specified, camelCase.
 *
 * It is expected that the object is a plain javascript object, so calling this
 * function on `mongoose.Document`s will fail. To use it with them, it's ideal
 * that either `.toJSON` or `.toObject` is called.
 *
 * @param {Object} obj The target object
 * @param {Boolean} [camel_case] Whether to use camel case on the serialization.
 * @return {Object} obj The serialized target object - this function is unpure.
 */

exports.serialize = function serialize(obj, camel_case) {
  if(obj.context_type) {
    var path = camel_case ? exports.uncapitalize(obj.context_type):
                               exports.snakelize(obj.context_type);

    obj[path] = obj.context_id;
    delete obj.context_id;
    delete obj.context_type;
  }

  return obj;
};

/**
 * Uncapitalizes a string.
 *
 * @param {String} str
 * @return {String} ret
 */

exports.uncapitalize = function uncapitalize(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Converts a string to snake case.
 *
 * @param {String} str
 * @return {String} ret
 */

exports.snakelize = function snakelize(str) {
  return exports.uncapitalize(str).replace(REGEXPS.upper, '_$&').toLowerCase();
};

/**
 * Converts a camel or snake case string to upper camel case.
 *
 * @param {String} str
 * @return {String} ret
 */

exports.upperCamelize = function upperCamelize(str) {
  return str.charAt(0).toUpperCase() +
         str.slice(1).replace(REGEXPS.snake, exports.snakeToUpper);
};

// snakeToUpper('_s') => 'S'
exports.snakeToUpper = function snakeToUpper(str) {
  return str[1].toUpperCase();
};

var REGEXPS = {
  upper: /[A-Z]/g,
  snake: /_[a-z]/g
};
