mongoose-context-ref
====================

[![Build Status](https://secure.travis-ci.org/yamadapc/mongoose-context-ref.png?branch=master)](http://travis-ci.org/yamadapc/mongoose-context-ref)
[![Dependency Status](https://david-dm.org/yamadapc/mongoose-context-ref.png)](https://david-dm.org/yamadapc/mongoose-context-ref)
[![devDependency Status](https://david-dm.org/yamadapc/mongoose-context-ref/dev-status.png)](https://david-dm.org/yamadapc/mongoose-context-ref#info=devDependencies)

---

*Mongoose context ref* is a [mongoose](https://github.com/learnboost/mongoose)
plugin, which adds a simple `context` or `parent` like relation between a
model's document and variable model parent document.

It adds the fields:
```javascript
{
  context_id: ObjectId,
  context_type: String
}
```

It also adds pre 'save' and 'remove' hooks, updating the context's reference to
the child document (currently at the child document's pluralized lowercase model
name) and validating the context_id for existence.

## Examples

### Install with

`npm install mongoose-context-ref`

### Comments to multiple types of models

```javascript
var mongoose = require('mongoose'),
    context  = require('mongoose-context-ref');

var PostSchema = new mongoose.Schema({
  comments: [mongoose.Schema.ObjectId] // A post may be a comment thread
});

var Post = mongoose.model('Post', PostSchema);

var CommentSchema = new mongoose.Schema({
  text: String,
  comments: [mongoose.Schema.ObjectId] // A comment may be a comment thread
});

CommentSchema.plugin(context);

var Comment = mongoose.model('Comment', CommentSchema);
```

This way, when a comment is created, it may reference to either a post or
another comment.

When it's saved, this reference will be validated, and the
referenced document will have the newly created comment's id pushed into its
`comments` Array.

Also, when its context is modified (either the `context_type` or `context_id`),
the references will be updated. In this case, the old context's reference will be
removed, and a new reference will be added to the new parent.

Analogously, when it's removed, its reference will be removed from its context's
`comments` Array.

## Virtuals

By default, if a `context_types` array is passed, *mongoose-context-ref* adds
virtuals for all contexts, which update the context fields and work as one would
expect:

```javascript
var mongoose = require('mongoose'),
    context  = require('mongoose-context-ref');

var CommentSchema = new mongoose.Schema({
  text: String,
  comments: [mongoose.Schema.ObjectId]
});

CommentSchema.plugin(context, { context_types: ['Post', 'Comment'] })

var Comment = mongoose.model('Comment', CommentSchema);

var comment = new Comment();
comment.post = new mongoose.Types.ObjectId(); // => ObjectId("532280b6fed4c6f00d0dce60")
// this sets:
comment.context_type // => 'Post'
comment.context_id   // => ObjectId("532280b6fed4c6f00d0dce60")

comment.comment = new mongoose.Types.ObjectId(); // => ObjectId("532280fcfed4c6f00d0dce61");
// this sets
comment.context_type // => 'Comment'
comment.context_id   // => ObjectId("532280fcfed4c6f00d0dce61")

// .... you get the point
// ----------------------------------------------------------------------------
// also:
var comment2 = new Comment({
  context_type: 'Post',
  context_id: '532280fcfed4c6f00d0dce63'
});

comment2.post    // => ObjectId("532280fcfed4c6f00d0dce63")
comment2.comment // => undefined
```

## Options

As per mongoose plugins' convention, the plugin is added to a Model with:
```javascript
// [...]
var context = require('../lib/mongoose-context-ref');
ModelSchema.plugin(context, options)
// [...]
```

Where `options` may have the fields:

- `required` - whether `/context_(id|type)/` are required fields (defaults to
  `false`)
- `context_types` - either an `Array` of the valid `context_type` values
  (defaulting to all existing modelNames) or a validator `Function`, which
  will be passed directly as the `context_type` path's [mongoose validator](http://mongoosejs.com/docs/api.html#schematype_SchemaType-validate).
- `virtuals` - if set to false disables the [virtuals](#virtuals) feature
  (defaults to true)
- `refUpdate` - if set to false disables the [reference updating](#comments-to-multiple-types-of-models)
  feature. (defaults to true)

## Testing
Tests may be run with: `grunt test`.

## License
Copyright (c) 2014 Pedro Tacla Yamada. Licensed under the MIT license.
Please refer to the [LICENSE](LICENSE) file for more info.
