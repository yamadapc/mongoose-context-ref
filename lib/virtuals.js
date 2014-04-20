'use strict';
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var serialization = require('./serialization');

/**
 * Adds virtuals to a schema.
 *
 * @param {mongoose.Schema} schema The target schema.
 * @param {Array.<String>} context_types An array of context_types.
 * @param {Function} normalize A function to serialize cases with.
 */

exports.add = function(schema, context_types, normalize) {
  context_types.forEach(function(context_type) {
    var path = normalize(context_type);

    if(!schema.path(path)) { // don't overwrite existing paths
      schema.virtual(path)
        .get(function() {
          var current_valid_path = normalize(this.context_type);
          // we're guarding for the case in which, the `context_type` is 'a'
          // but the `doc.b` getter is accessed.

          if(current_valid_path === path) return this.context_id;
          else return undefined;
        })
        .set(function(id) {
          this.context_type = serialization.upperCamelize(context_type);
          this.context_id = id;
        });
    }
  });
};
