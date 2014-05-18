'use strict'; /* global describe, it, before */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var _        = require('lodash'),
    should   = require('should'),
    mongoose = require('mongoose'),
    context  = require('..');

var Schema = mongoose.Schema;
var makeStub = require('mocha-make-stub');

describe('mongoose-context-ref', function() {
  before(function() {
    var CommentSchema = new mongoose.Schema({
      comments: [mongoose.Schema.ObjectId]
    });
    CommentSchema.plugin(context);
    this.Comment = mongoose.model('Comment', CommentSchema);

    var PostSchema = new mongoose.Schema({
      comments: [mongoose.Schema.ObjectId]
    });
    this.Post = mongoose.model('Post', PostSchema);
  });

  it('adds the context paths to the schema', function() {
    var schema = new Schema({});
    schema.plugin(context);
    should.exist(schema.path('context_id'));
    should.exist(schema.path('context_type'));
  });

  it('validates `context_type` against the registered models', function(done) {
    var comment = new this.Comment({
      context_type: 'asdf',
      context_id: new mongoose.Types.ObjectId()
    });

    comment.validate(function(err) {
      should.exist(err);
      err.toString().should.match(/context type/);
      comment.context_type = 'Post';
      comment.validate(done);
    });
  });

  function testNotAdded(name, options) {
    var test_case = _.map(options, function(value, key) {
      return key + ' is set to ' + value;
    }, "").join(' and ');

    describe('when ' + test_case, function() {
      makeStub(name + '$add', context[name], 'add');

      it('doesn\'t add ' + name + ' to the schema', function() {
        var schema = new mongoose.Schema();
        schema.plugin(context, options);
        this[name + '$add'].called.should.not.be.ok;
      });
    });
  }

  testNotAdded('serialization', { serialize: false });
  testNotAdded('virtuals',      { virtuals: false });
  testNotAdded('updates',       { refUpdate: false });
  testNotAdded('query',         { query: false });

  describe('when options.context_types is passed', function() {
    before(function() {
      var schema = new Schema({});
      schema.plugin(context, {
        context_types: ['Post'],
        serialize: false
      });
      this.Comment2 = mongoose.model('Comment2', schema);
    });

    it('validates `context_type` against the options', function(done) {
      var comment = new this.Comment2({ context_type: 'Post' });
      comment.validate(function(err) {
        if(err) return done(err);
        comment.context_type = 'Comment';
        comment.validate(function(err) {
          should.exist(err);
          err.toString().should.match(/context type/);
          done();
        });
      });
    });

    describe('and virtuals is set to false', function() {
      it('doesn\'t mess with the schema\'s paths', function() {
        var schema = new Schema({});
        schema.plugin(context, {
          virtuals: false,
          context_types: ['Post']
        });
        should.not.exist(schema.virtualpath('post'));
      });
    });

    describe('and it\'s a function', function() {
      before(function() {
        var schema = new mongoose.Schema({});
        schema.plugin(context, {
          context_types: function(ct) { return ct && (ct.charAt(0) !== 'C'); }
        });
        this.Comment3 = mongoose.model('Comment3', schema);
      });

      it('validates `context_types` by calling it as a predicate', function(done) {
        var comment = new this.Comment3({ context_type: 'Comment' });
        comment.validate(function(err) {
          should.exist(err);
          err.toString().should.match(/context type/);
          comment.context_type = 'Post';
          comment.validate(done);
        });
      });
    });
  });
});
