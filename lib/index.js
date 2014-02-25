'use strict';
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var _        = require('lodash'),
    mongoose = require('mongoose');

var ObjectId = mongoose.Schema.ObjectId;

/**
 * mongoose-context-ref plugin
 */

module.exports = function(schema, options) {
  options || (options = {});
  options.required || (options.required = false);

  schema.add({
    context_id:   { type: ObjectId, required: options.required },
    context_type: { type: String, required: options.required }
  });

  schema.path('context_type').validate(function(value) {
    return !!value && (_.contains(mongoose.modelNames(), value));
  }, 'The context type must be a valid model');

  schema.pre('save', function(next) {
    if(!this.isNew || !this.context_id) return next();
    else refUpdate('save', this, next);
  });

  schema.pre('remove', function(next) {
    if(!this.context_id) return next();
    else refUpdate('remove', this, next);
  });

  return schema;
};

function refUpdate(method, doc, cb) {
  var path = doc.constructor.modelName.toLowerCase() + 's',
      action = method === 'save' ? '$push' : '$pull';

  var update = {};
  update[action] = {};
  update[action][path] = doc._id;

  doc.constructor.db.model(doc.context_type)
    .findByIdAndUpdate(doc.context_id, update, function(err, doc) {
      if(err) cb(err);
      else if(!doc && method === 'save') {
        err = new Error(this.context_type + ' not found'); err.status = 400;
        cb(err);
      }
      else cb(null, doc);
    });
}
