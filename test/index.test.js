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
      text:     String,
      comments: [mongoose.Schema.ObjectId]
    });
    CommentSchema.plugin(context);
    info.Comment = mongoose.model('Comment', CommentSchema);

    var PostSchema = new mongoose.Schema({
      comments: [mongoose.Schema.ObjectId]
    });
    info.Post = mongoose.model('Post', PostSchema);
  });

  it('adds the context paths to the schema', function() {
    should.exist(info.Comment.schema.path('context_id'));
    should.exist(info.Comment.schema.path('context_type'));
  });

  describe('when a child is created', function() {
    before(function(done) {
      (new info.Post()).save(function(err, post) {
        info.post = post;
        done(err);
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
