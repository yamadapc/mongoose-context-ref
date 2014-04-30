'use strict';
/**
 * Adds automatic reference updating to a schema.
 *
 * @param {mongoose.Schema} schema The target schema.
 * @param {Function} normalize A function to normalize cases with.
 */

exports.add = function add(schema, normalize) {
  // reference pushing on creation
  schema.pre('save', function(next) {
    if(!this.isNew || !this.context_id) return next();

    var path = getPath(this);
    exports.refUpdate('save', path, this, next);
  });

  // reference pulling on removal
  schema.pre('remove', function(next) {
    if(!this.context_id) return next();

    var path = getPath(this);
    exports.refUpdate('remove', path, this, next);
  });

  // make sure the context is cached
  schema.post('init', exports.cacheContext);
  schema.post('save', exports.cacheContext);

  // reference pushing/pulling on modifications
  schema.pre('save', function(next) {
    if((!this.isModified('context_id') && !this.isModified('context_type'))
      || this.isNew || !this.context_id) return next();

    var _this = this;
    var new_context = {
      context_type: this.context_type,
      context_id:   this.context_id
    };

    var ct = this._original.context_type;
    var ci = this._original.context_id;

    var path = getPath(this);
    return exports.refUpdate('remove', path, ct, ci, this, function(err) {
      if(err) return next(err);

      _this.context_type = new_context.context_type;
      _this.context_id   = new_context.context_id;
      exports.refUpdate('save', path, _this, next);
    });
  });

  function getPath(doc) {
    var model_name = doc.constructor.modelName;
    return normalize(model_name) + 's';
  }
};

/**
 * Adds/removes a `doc`'s reference to/from its context `path`. If the
 * `context_type` and `context_id` arguments are not specified, they will be
 * extracted from the document.
 *
 * @param {String} method Either 'save' to add a ref or 'remove' to remove it.
 * @param {String} path The target reference path.
 * @param {String} [context_type] The context document's modelName.
 * @param {mongoose.Types.ObjectId} [context_id] The context document's id.
 * @param {mongoose.Document} doc The child document.
 * @param {Function} cb A callback function.
 */

exports.refUpdate = function refUpdate(method, path, context_type, context_id, doc, cb) {
  // optional arguments magic dance
  if(!doc) {
    doc = context_type;
    cb  = context_id;
    context_type = doc.context_type;
    context_id   = doc.context_id;
  }

  if(!context_id) return cb(); // ignore not present context_ids

  var action = method === 'save' ? '$push' : '$pull';

  var update = {};
  update[action] = {};
  update[action][path] = doc._id;

  doc.constructor.db.model(context_type)
    .findByIdAndUpdate(context_id, update, function(err, pdoc) {
      if(err) cb(err);
      else if(!pdoc && method === 'save') {
        err = new Error(doc.context_type + ' not found'); err.status = 400;
        cb(err);
      }
      else cb(null, pdoc);
    });
};

/**
 * Caches the context fields from a child document under its `_original` key.
 *
 * @param {mongoose.Document} doc The target document.
 */

exports.cacheContext = function cacheContext(doc) {
  doc._original = doc._original || {};
  doc._original.context_type = doc.context_type;
  doc._original.context_id   = doc.context_id;
};
