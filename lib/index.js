'use strict';
/**
 * mongoose-context-ref plugin
 * --------------------------------------------------------------------------*/

module.exports = function (schema, options) {
    options || (options = {});
    options.required || (options.required = false);
    if (options.virtuals === undefined) options.virtuals = true;
    if (options.refUpdate === undefined) options.refUpdate = true;

    var ObjectId = schema.constructor.ObjectId;

    // add the context paths
    schema.add({
        context_id: { type: ObjectId, required: options.required },
        context_type: { type: String, required: options.required }
    });

    // add the validator
    var validator = typeof options.context_types === 'function' ?
        options.context_types :
        dftValidator;

    schema.path('context_type').validate(validator, 'Invalid context type.');

    // add virtual properties, if the context_types are specified and the user
    // didn't disable this feature
    if (Array.isArray(options.context_types) && options.virtuals) {
        addVirtuals(schema, options.context_types);
    }

    // add the updating hooks
    if (options.refUpdate) {
        schema.pre('save', function (next) {
            if (!this.context_id)
                return next();
            else if (this.isNew)
                refUpdate('save', this, next);
            else if (this.isModified('context_id'))
                refUpdate('move', this, next);
            else return next();
        });

        schema.pre('remove', function (next) {
            if (!this.context_id) return next();
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
    var path = doc.constructor.modelName.toLowerCase() + 's';
    var doc_id=doc._id;
    var update = {modified: new Date};
    var action = method === 'save' ? '$push' : '$pull';
    update[action] = {};
    if (method != 'move') {
        update[action][path] = doc_id;
        doc.constructor.db.model(doc.context_type)
            .findByIdAndUpdate(doc.context_id, update, function (err, doc) {
                if (err) cb(err);
                else if (!doc && method === 'save') {
                    err = new Error(this.context_type + ' not found');
                    err.status = 400;
                    cb(err);
                }
                else cb(null, doc);
            });
    } else {
        doc.model(doc.constructor.modelName)
            .findById(doc_id, function (err, old_doc) {
                if (err) cb(err);
                else if (!old_doc) {
                    err = new Error(doc.constructor.modelName + ' not found');
                    err.status = 400;
                    cb(err);
                }
                else {
                    update['$push'] = {};
                    update['$push'][path] = doc_id;
                    doc.constructor.db.model(doc.context_type)
                        .findByIdAndUpdate(doc.context_id, update, function (err, doc) {
                            if (err) cb(err);
                            else if (!doc) {
                                err = new Error(this.context_type + ' not found');
                                err.status = 400;
                                cb(err);
                            }
                            else {
                                update = {modified: new Date};
                                update['$pull'] = {};
                                update['$pull'][path] = doc_id;
                                doc.constructor.db.model(old_doc.context_type)
                                    .findByIdAndUpdate(old_doc.context_id, update, function (err, doc) {
                                        if (err) cb(err);
                                        else cb(null, doc);
                                    });

                            }
                        });
                }
            });
    }
}

function addVirtuals(schema, context_types) {
    context_types.forEach(function (context_type) {
        var path = context_type.toLowerCase();

        if (!schema.path(path)) { // don't overwrite existing paths
            schema.virtual(path)
                .get(function () {
                    if (this.context_type.toLowerCase() === path)
                        return this.context_id;
                    else return undefined;
                })
                .set(function (id) {
                    this.context_type = (path.charAt(0).toUpperCase() + path.slice(1));
                    this.context_id = id;
                });
        }
    });
}

function getModelNames(doc) {
    var model_names = Object.keys(doc.constructor.db.base.models);
    if (model_names.length) return model_names;
    else return doc.constructor.db.modelNames();
}
