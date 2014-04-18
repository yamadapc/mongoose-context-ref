'use strict'; /* global describe, it, before */
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var _        = require('lodash'),
    should   = require('should'),
    mongoose = require('mongoose'),
    context  = require('..');

var info = {};

describe('mongoose-context-ref', function() {
  before(function() {
    mongoose.connect('mongodb://localhost/test');
  });

  before(function() {
    var CommentSchema = new mongoose.Schema({
      comments: [mongoose.Schema.ObjectId]
    });
    CommentSchema.plugin(context);
    info.Comment = mongoose.model('Comment', CommentSchema);

    var PostSchema = new mongoose.Schema({
      comments: [mongoose.Schema.ObjectId]
    });
    info.Post = mongoose.model('Post', PostSchema);

    var Comment2Schema = new mongoose.Schema({});
    Comment2Schema.plugin(context, {
      context_types: ['Post']
    });
    info.Comment2 = mongoose.model('Comment2', Comment2Schema);

    var Comment3Schema = new mongoose.Schema({});
    Comment3Schema.plugin(context, {
      context_types: function(ct) { return ct && (ct.charAt(0) !== 'C'); }
    });
    info.Comment3 = mongoose.model('Comment3', Comment3Schema);
  });

  it('adds the context paths to the schema', function() {
    should.exist(info.Comment.schema.path('context_id'));
    should.exist(info.Comment.schema.path('context_type'));
  });

  describe('when options.refUpdate (as false) is passed', function() {
    it('shouldn\'t add the ref-update hooks', function() {
      var schema = new mongoose.Schema({});
      schema.plugin(context, { refUpdate: false });
      schema.callQueue.forEach(function(q) {
        q.should.not.include('pre');
        q.should.not.include('post');
      });
    });
  });

  describe('when options.context_types is passed', function() {
    it('validates `context_type` against the options', function(done) {
      var comment = new info.Comment2({ context_type: 'Post' });
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

    it('adds getters for the expected context_types\' paths', function() {
      var comment = new info.Comment2({
        context_type: 'Post',
        context_id: new mongoose.Types.ObjectId()
      });
      comment.should.have.property('post');
      comment.post.should.equal(comment.context_id);
    });

    it('adds setters for the expected context_types\' paths', function() {
      var comment = new info.Comment2();
      var id = new mongoose.Types.ObjectId();
      comment.post = id;
      comment.context_type.should.equal('Post');
      comment.context_id.should.equal(id);
    });

    describe('and virtuals is set to false', function() {
      it('doesn\'t mess with the schema\'s paths', function() {
        var TestSchema = new mongoose.Schema({});
        TestSchema.plugin(context, {
          virtuals: false,
          context_types: ['Post']
        });

        should.not.exist(TestSchema.virtualpath('post'));
      });
    });

    describe('and some of the `context_types`\' corresponding paths exist', function() {
      it('ignores them', function() {
        var TestSchema = new mongoose.Schema({
          banana: mongoose.Schema.ObjectId,
          post: mongoose.Schema.ObjectId
        });
        TestSchema.plugin(context, {
          context_types: ['Post', 'Banana', 'Something']
        });

        should.not.exist(TestSchema.virtualpath('banana'));
        should.not.exist(TestSchema.virtualpath('post'));
        should.exist(TestSchema.virtualpath('something'));
      });
    });

    describe('and it\'s a function', function() {
      it('validates `context_types` by calling it as a predicate', function(done) {
        var comment = new info.Comment3({ context_type: 'Comment' });
        comment.validate(function(err) {
          should.exist(err);
          err.toString().should.match(/context type/);
          comment.context_type = 'Post';
          comment.validate(done);
        });
      });
    });
  });

  describe('when a child is created', function() {
    before(function(done) {
      (new info.Post()).save(function(err, post) {
        info.post = post;
        done(err);
      });
    });

    it('validates `context_type` against existing models', function(done) {
      var comment = new info.Comment({ context_type: 'asdf' });
      comment.validate(function(err) {
        should.exist(err);
        err.toString().should.match(/context type/);
        done();
      });
    });

    it('updates its parent\'s child references', function(done) {
      var comment = new info.Comment({
        context_id: info.post._id,
        context_type: 'Post'
      });

      comment.save(function(err, comment) {
        if(err) return done(err);
        info.comment = comment;

        info.Post.findById(info.post._id, function(err, post) {
          if(err) return done(err);
          should.exist(post);
          post.should.have.property('comments');
          post.comments.should.have.length(1);
          _.invoke(post.comments, 'toString').should.include(comment.id);
          done();
        });
      });
    });
  });

  describe('when a child is removed', function() {
    it('updates its parent\'s child references', function(done) {
      info.comment.remove(function(err) {
        if(err) return done(err);
        info.Post.findById(info.post._id, function(err, post) {
          if(err) return done(err);
          post.should.have.property('comments');
          post.comments.should.have.length(0);
          done();
        });
      });
    });
  });
});
