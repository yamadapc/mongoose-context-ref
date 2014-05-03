'use strict';
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var updates       = require('./updates'),
    virtuals      = require('./virtuals'),
    serialization = require('./serialization'),
    query         = require('./query'),
    utils         = require('./utils');

// exporting magic dance
exports = module.exports = context;
exports.updates       = updates;
exports.virtuals      = virtuals;
exports.serialization = serialization;
exports.query         = query;
exports.utils         = utils;

/*!
 * mongoose-context-ref plugin
 * --------------------------------------------------------------------------*/

function context(schema, options) {
  options || (options = {});
  options.required || (options.required = false);
  if(options.virtuals === undefined) options.virtuals = true;
  if(options.refUpdate === undefined) options.refUpdate = true;
  if(options.serialize === undefined) options.serialize = true;
  if(options.query === undefined) options.query = true;

  var ObjectId = schema.constructor.ObjectId;

  // define the case convertion function
  var normalizeCase = options.camel_case ? serialization.uncapitalize:
                                              serialization.snakelize;

  // add the context fields
  schema.add({
    context_id:   { type: ObjectId, required: options.required },
    context_type: { type: String, required: options.required }
  });

  // add validation
  var validator = typeof options.context_types === 'function'?
                                        options.context_types:
                                                 dftValidator;

  schema.path('context_type').validate(validator, 'Invalid context type.');

  // add serialized query support
  if(options.query) {
    query.add(schema, normalizeCase, validator);
  }

  // add serialization
  if(options.serialize) {
    serialization.add(schema, options.camel_case);
  }

  // add virtuals
  if(Array.isArray(options.context_types) && options.virtuals) {
    virtuals.add(schema, options.context_types, normalizeCase);
  }

  // add reference updating
  if(options.refUpdate) {
    updates.add(schema, normalizeCase);
  }

  // return the schema, for chaining
  return schema;

  // utility functions --
  function dftValidator(value) {
    /* jshint validthis: true */
    var connection = this.constructor.db;
    var models = options.context_types || utils.getModelNames(connection);

    return !!value && (models.indexOf(value) !== -1);
  }
}
