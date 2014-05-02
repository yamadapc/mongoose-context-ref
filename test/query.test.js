'use strict'; /* global describe, it, before */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var should   = require('should'),
    query    = require('..').query;

describe('query', function() {
  it('gets exposed', function() { should.exist(query); });

  describe('.add(schema)', function() {
  });

  describe('.withContext(model, query, id)', function() {
    describe('using a mock model', function() {
      function mockModel() {
        before(function() {
          var _this = this;
          this.mock_model = {
            find: function(/*query, cb*/) {
              _this.called = true;
              _this.calledArgs = arguments;
              return;
            },
            db: {
              modelNames: function() {
                return ['QueryParent'];
              },
              base: { models: { QueryParent: {} } }
            }
          };
        });
      }

      describe('when passing a query object', function() {
        mockModel();

        it('calls `model.find` with a serialized query', function() {
          var mockFilter = function(names) { return names; };

          query.withContext(mockFilter, this.mock_model, {
            query_parent: 'something'
          });

          this.called.should.be.ok;
          this.calledArgs[0].should.eql({
            context_type: 'QueryParent',
            context_id: 'something'
          });
        });
      });

      describe('when passing a context_type and a context_id', function() {
        mockModel();

        it('calls `model.find` with a serialized query', function() {
          var mockFilter = function(names) { return names; };

          query.withContext(mockFilter, this.mock_model, 'QueryParent', 'something');

          this.called.should.be.ok;
          this.calledArgs[0].should.eql({
            context_type: 'QueryParent',
            context_id: 'something'
          });
        });
      });
    });
  });
});
