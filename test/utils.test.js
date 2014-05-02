'use strict'; /* global describe, it */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var should = require('should'),
    utils  = require('..').utils;

describe('utils', function() {
  it('gets exposed', function() { should.exist(utils); });

  describe('.deoopfy(method)', function() {
    it('returns a new function, binding the first argument as input\'s context', function() {
      var fn = utils.deoopfy(function() {
        this.yey = true;
      });

      var obj = { yey: false };
      fn(obj);
      obj.yey.should.be.ok;
    });

    it('passes on the remaining arguments into the function', function() {
      var args;
      var fn = utils.deoopfy(function() {
        args = Array.prototype.slice.call(arguments);
      });

      fn({}, 1, 2, 3);
      args.should.eql([1, 2, 3]);
    });
  });

  describe('.mapValues(fn, obj)', function() {
    it('maps our function over the object\'s keys', function() {
      var obj = {
        a: 10,
        b: 20
      };

      var result = utils.mapValues(add1, obj);
      should.exist(result);
      result.a.should.equal(11);
      result.b.should.equal(21);

      function add1(x) {
        return x + 1;
      }
    });
  });
});
