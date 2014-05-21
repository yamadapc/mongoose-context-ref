'use strict';
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var utils         = require('./utils'),
    serialization = require('./serialization');

var map           = utils.map,
    filter        = utils.filter,
    compose       = utils.compose,
    partial       = utils.partial,
    getModelNames = utils.getModelNames;

/**
 * Adds helper method for querying with a context's shorthand.
 *
 * @param {mongoose.Schema} schema The target schema.
 * @param {Function} normalize A function to normalize modelNames with.
 * @param {Function} validator A function to filter modelNames with.
 */

exports.add = function add(schema, normalize, validator) {
  var normFilterNames = compose(partial(map, normalize),
                                partial(filter, validator));

  schema.statics.withContext = function(query, id) {
    return exports.withContext(normFilterNames, this, query, id);
  };
};

/**
 * Returns a reduced query which allows the context shorthand - like virtuals' -
 * to be used.
 *
 * @param {Function} normFilterNames A function to filter and normalize context
 * names with. It should take an array of UpperCamelCase model names, and return
 * an array of the valid normalized context types.
 * @param {mongoose.Model} model The mongoose model to query with.
 * @param {{Object|String}} query Either a query object or a context name.
 * @param {mongoose.ObjectId} [id] If a context name is specified as the first
 * arg, the id to be queried for needs to be provided as the second argument.
 */

exports.withContext = function withContext(normFilterNames, model, query, id) {
  if(id) {
    query = { context_type: query, context_id: id };
  }
  else {
    var connection     = model.db,
        model_names    = getModelNames(connection),
        norm_ctx_types = normFilterNames(model_names, {constructor: model});

    for(var i = 0, keys = Object.keys(query), len = keys.length; i < len; i++) {
      var key = keys[i];
      if(norm_ctx_types.indexOf(key) !== -1) {
        query.context_type = serialization.upperCamelize(key);
        query.context_id   = query[key];
        delete query[key];
        break;
      }
    }
  }

  return model.find(query);
};
