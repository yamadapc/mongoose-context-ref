'use strict'; /* global describe, it */
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var should        = require('should'),
    serialization = require('../lib/serialization');

describe('serialization', function() {
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
});
