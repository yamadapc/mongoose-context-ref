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

Analogously, when it's removed, its reference will be removed from its context's
`comments` Array.

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
- `context_types` - the valid `context_type` values (defaults to all existing
  modelNames)

## Testing
Tests may be run with: `grunt test`.

## License
Copyright (c) 2014 Pedro Tacla Yamada. Licensed under the MIT license.
Please refer to the [LICENSE](LICENSE) file for more info.
