'use strict'; /* global describe, it, before */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var mongoose      = require('mongoose'),
    should        = require('should'),
    serialization = require('..').serialization;

var Schema = mongoose.Schema;

describe('serialization', function() {
  it('gets exposed', function() { should.exist(serialization); });

  describe('.add(schema, camel_case)', function() {
    var called = false;

    before(function() {
      var schema = new Schema({
        context_type: String,
        context_id:   Schema.ObjectId
      });

      schema.methods.toJSON = function() {
        called = true; return this.toObject();
      };
      serialization.add(schema, false);

      this.SerializationChild1 = mongoose.model('SerializationChild1', schema);
    });

    before(function() {
      var schema = new mongoose.Schema({
        context_type: String,
        context_id:   Schema.ObjectId
      });

      serialization.add(schema, true);

      this.SerializationChild2 = mongoose.model('SerializationChild2', schema);
    });

    it('doesn\'t overwrite existing modifications to `.toJSON`', function() {
      var doc = new this.SerializationChild1();
      doc.toJSON();
      called.should.equal(true);
    });

    it('serializes the `context_type` and `context_id`', function() {
      var id = new mongoose.Types.ObjectId();
      var doc = new this.SerializationChild1({
        context_type: 'FunnyCased',
        context_id: id
      });

      doc.toJSON().should.eql({ funny_cased: id, _id: doc._id });
    });

    it('serializes with camel case if specified', function() {
      var id = new mongoose.Types.ObjectId();
      var doc = new this.SerializationChild2({
        context_type: 'WeirdUpperCase',
        context_id: id
      });

      doc.toJSON().should.eql({ weirdUpperCase: id, _id: doc._id });
    });
  });

  describe('.serialize(obj, camel_case)', function() {
    it('gets exposed', function() {
      should.exist(serialization.serialize);
      serialization.serialize.should.be.instanceof(Function);
    });

    it('merges the `context_id` and `context_type` paths into one', function() {
      serialization
        .serialize({ context_type: 'Post', context_id: '1234' })
        .should.eql({ post: '1234' });
    });

    it('converts the `context_type` to snake case by default', function() {
      serialization
        .serialize({ context_type: 'AdminUser', context_id: '1234' })
        .should.eql({ admin_user: '1234' });
    });

    it('converts the `context_type` to camel case if specified', function() {
      serialization
        .serialize({ context_type: 'AdminUser', context_id: '1234' }, true)
        .should.eql({ adminUser: '1234' });
    });
  });

  describe('.uncapitalize(str)', function() {
    it('uncapitalizes strings', function() {
      serialization.uncapitalize('Asdf').should.equal('asdf');
      serialization.uncapitalize('BleH').should.equal('bleH');
      serialization.uncapitalize('UpperCamelCase').should.equal('upperCamelCase');
    });
  });

  describe('.snakelize(str)', function() {
    it('converts strings to snake case', function() {
      serialization.snakelize('losdfL').should.equal('losdf_l');
      serialization.snakelize('UpperCamelCase').should.equal('upper_camel_case');
      serialization.snakelize('upperCamelCase').should.equal('upper_camel_case');
      serialization.snakelize('SomethingBlehasdf').should.equal('something_blehasdf');
    });
  });

  describe('.snakeToUpper(str)', function() {
    it('converts snake \'char breaks\' into uppercase', function() {
      serialization.snakeToUpper('_c').should.equal('C');
      serialization.snakeToUpper('_s').should.equal('S');
      serialization.snakeToUpper('_F').should.equal('F');
    });
  });
});
