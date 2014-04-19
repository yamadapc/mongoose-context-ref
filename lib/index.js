'use strict';
var serialization = require('./serialization');

/**
 * mongoose-context-ref plugin
 * --------------------------------------------------------------------------*/

module.exports = function(schema, options) {
  options || (options = {});
  options.required || (options.required = false);
  if(options.virtuals === undefined) options.virtuals = true;
  if(options.refUpdate === undefined) options.refUpdate = true;
  if(options.serialize === undefined) options.serialize = true;

  var ObjectId = schema.constructor.ObjectId;

  // add the context paths
  schema.add({
    context_id:   { type: ObjectId, required: options.required },
    context_type: { type: String, required: options.required }
  });

  // add the validator
  var validator = typeof options.context_types === 'function'?
                                        options.context_types:
                                                 dftValidator;

  schema.path('context_type').validate(validator, 'Invalid context type.');

  // add serialization support by overwriting the toJSON method, unless
  // specified.
  if(options.serialize) {
    var toJSON = schema.methods.toJSON; // try using already overwritten method.
    schema.methods.toJSON = function() {
      // get plain javascript object, with a dance.
      var obj;
      if(toJSON) obj = toJSON.apply(this, arguments);
      else obj = this.toObject.apply(this, arguments);

      // serialize the plain object
      return serialization.serialize(obj, options.camel_case);
    };
  }

  // add virtual properties, if the context_types are specified and the user
  // didn't disable this feature
  if(Array.isArray(options.context_types) && options.virtuals) {
    addVirtuals(schema, options.context_types);
  }

  // add the updating hooks
  if(options.refUpdate) {
    schema.pre('save', function(next) {
      if(!this.isNew || !this.context_id) return next();
      else refUpdate('save', this, next);
    });

    // make sure the context is cached
    schema.post('init', cacheContext);
    schema.post('save', cacheContext);
    schema.pre('save', function(next) {
      if((!this.isModified('context_id') && !this.isModified('context_type'))
         || this.isNew || !this.context_id) return next();

      var _this = this;
      var new_context = {
        context_type: this.context_type,
        context_id:   this.context_id
      };

      this.context_type = this._original.context_type;
      this.context_id   = this._original.context_id;

      return refUpdate('remove', this, function(err) {
        if(err) return next(err);

        _this.context_type = new_context.context_type;
        _this.context_id   = new_context.context_id;
        refUpdate('save', _this, next);
      });
    });

    schema.pre('remove', function(next) {
      if(!this.context_id) return next();
      else refUpdate('remove', this, next);
    });
  }

  // return the schema, for chaining
  return schema;

  // utility functions --
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
    .findByIdAndUpdate(doc.context_id, update, function(err, pdoc) {
      if(err) cb(err);
      else if(!pdoc && method === 'save') {
        err = new Error(doc.context_type + ' not found'); err.status = 400;
        cb(err);
      }
      else cb(null, pdoc);
    });
}

function addVirtuals(schema, context_types) {
  context_types.forEach(function(context_type) {
    var path = context_type.toLowerCase();

    if(!schema.path(path)) { // don't overwrite existing paths
      schema.virtual(path)
            .get(function() {
              if(this.context_type.toLowerCase() === path)
                return this.context_id;
              else return undefined;
            })
            .set(function(id) {
              this.context_type = (path.charAt(0).toUpperCase() + path.slice(1));
              this.context_id = id;
            });
    }
  });
}

function getModelNames(doc) {
  var model_names = Object.keys(doc.constructor.db.base.models);
  if(model_names.length) return model_names;
  else return doc.constructor.db.modelNames();
}

function cacheContext(doc) {
  doc._original = doc._original || { // only cache if not redundant
    context_type: doc.context_type,
    context_id:   doc.context_id
  };
}
