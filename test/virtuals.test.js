'use strict'; /* global describe, it, before */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var mongoose = require('mongoose'),
    should   = require('should'),
    virtuals = require('..').virtuals;

var Schema = mongoose.Schema;

describe('virtuals', function() {
  it('gets exposed', function() { should.exist(virtuals); });

  describe('.add(schema, context_types, normalize)', function() {
    before(function() {
      var schema = new mongoose.Schema({
        context_type: String,
        context_id:   Schema.ObjectId,
        banana: Boolean
      });

      virtuals.add(
        schema,
        ['Post', 'Banana', 'Something'],
        function(str) {
          return str.toLowerCase();
        }
      );

      this.VirtualsChild = mongoose.model('VirtualsChild', schema);
    });

    it('adds necessary virtuals, ignoring existent paths', function() {
      should.exist(this.VirtualsChild.schema.virtualpath('something'));
      should.exist(this.VirtualsChild.schema.virtualpath('post'));
      should.not.exist(this.VirtualsChild.schema.virtualpath('banana'));
    });

    it('adds getters for the expected context_types\' paths', function() {
      var comment = new this.VirtualsChild({
        context_type: 'Post',
        context_id: new mongoose.Types.ObjectId()
      });
      comment.should.have.property('post');
      comment.post.should.equal(comment.context_id);
    });

    it('adds setters for the expected context_types\' paths', function() {
      var comment = new this.VirtualsChild();
      var id = new mongoose.Types.ObjectId();
      comment.post = id;
      comment.context_type.should.equal('Post');
      comment.context_id.should.equal(id);
    });
  });
});
