'use strict';
/**
 * mongoose-context-ref plugin
 * --------------------------------------------------------------------------*/

module.exports = function(schema, options) {
  options || (options = {});
  options.required || (options.required = false);

  var ObjectId = schema.constructor.ObjectId;

  schema.add({
    context_id:   { type: ObjectId, required: options.required },
    context_type: { type: String, required: options.required }
  });

  var validator = typeof options.context_types === 'function'?
                                        options.context_types:
                                                 dftValidator;

  schema.path('context_type').validate(validator, 'Invalid context type.');

  schema.pre('save', function(next) {
    if(!this.isNew || !this.context_id) return next();
    else refUpdate('save', this, next);
  });

  schema.pre('remove', function(next) {
    if(!this.context_id) return next();
    else refUpdate('remove', this, next);
  });

  return schema;

  function dftValidator(value) {
    /* jshint validthis: true */
    var models = options.context_types || getModelNames(this);

    return !!value && (models.indexOf(value) !== -1);
  }
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

function getModelNames(doc) {
  var model_names = Object.keys(doc.constructor.db.base.models);
  if(model_names.length) return model_names;
  else return doc.constructor.db.modelNames();
}
