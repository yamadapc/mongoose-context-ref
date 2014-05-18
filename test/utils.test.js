'use strict'; /* global describe, it */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var should = require('should'),
    utils  = require('..').utils;

describe('utils', function() {
  it('gets exposed', function() { should.exist(utils); });

  describe('.map(fn, arr)', function() {
    it('maps out function over the array\'s elements', function() {
      var arr = [ 1, 2, 3 ];

      var result = utils.map(addStrIndex, arr);
      should.exist(result);
      result.should.eql([ '0:1', '1:2', '2:3' ]);

      function addStrIndex(el, i) {
        return i + ':' + el;
      }
    });
  });

  describe('.filter(fn, arr)', function() {
    it('filters arrays based on a predicate function', function() {
      var arr = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

      var result = utils.filter(even, arr);
      should.exist(result);
      result.should.eql([2, 4, 6, 8, 10]);

      function even(n) {
        return n % 2 === 0;
      }
    });
  });

  describe('.compose(f, g)', function() {
    it('composes two functions together', function() {
      var f = function(name) { return 'Hello ' + name + '!'; };
      var g = function(name) { return name.toUpperCase(); };

      var fg = utils.compose(f, g);
      should.exist(fg);
      fg.should.be.instanceof(Function);
      var result = fg('robert');
      result.should.equal('Hello ROBERT!');
    });
  });

  describe('.partial(fn, args)', function() {
    it('partially applies a function to a set of arguments', function() {
      var add1 = utils.partial(add, 1);
      should.exist(add1);
      add1.should.be.instanceof(Function);
      add1(2).should.equal(3);

      function add(x, y) {
        return x + y;
      }
    });

    it('works with spliced arguments', function() {
      var add1And2 = utils.partial(add, 1, 2);
      should.exist(add1And2);
      add1And2.should.be.instanceof(Function);
      add1And2(3).should.equal(6);
      function add(x, y, z) {
        return x + y + z;
      }
    });

    it('works with arrays of arguments', function() {
      var add1And2 = utils.partial(add, [1, 2]);
      should.exist(add1And2);
      add1And2.should.be.instanceof(Function);
      add1And2(3).should.equal(6);
      function add(x, y, z) {
        return x + y + z;
      }
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
