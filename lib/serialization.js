'use strict';
/**
 * serialization helpers
 * --------------------------------------------------------------------------*/

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
 * @param {Boolean} [camel_case] Whether use camel case on the serialization
 * @return {Object} obj The serialized target object - this function is unpure.
 */

exports.serialize = function(obj, camel_case) {
  if(obj.context_type) {
    var path = camel_case ? uncapitalize(obj.context_type):
                               snakelize(obj.context_type);

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

var uncapitalize = exports.uncapitalize = function(str) {
  return str && (str.charAt(0).toLowerCase() + str.slice(1));
};

/**
 * Converts a string to snake case.
 *
 * @param {String} str
 * @return {String} ret
 */

var snakelize = exports.snakelize = function(str) {
  return str && (uncapitalize(str).replace(/[A-Z]/g, '_$&').toLowerCase());
};
