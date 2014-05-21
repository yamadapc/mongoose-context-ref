'use strict'; /* global describe, it, before */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var mongoose      = require('mongoose'),
    should        = require('should'),
    makeStub      = require('mocha-make-stub'),
    serialization = require('..').serialization,
    query         = require('..').query;

var Schema = mongoose.Schema;

describe('query', function() {
  it('gets exposed', function() { should.exist(query); });

  describe('.add(schema, normalize, validator)', function() {
    it('adds a `withContext` static method to the `schema`', function() {
      var mock_schema = { statics: {} };
      query.add(mock_schema, function() {}, function() {});

      should.exist(mock_schema.statics.withContext);
      mock_schema.statics.withContext.should.be.instanceof(Function);
    });

    before(function() {
      var QueryChildSchema = new Schema({});
      query.add(QueryChildSchema, serialization.snakelize, function(model) {
        return model === 'QueryChild';
      });

      this.QueryChild = mongoose.model('QueryChild', QueryChildSchema);
      this.QueryChildOther = mongoose.model('QueryChildOther', new Schema({}));
    });

    makeStub('find', 'QueryChild', 'find');

    it('adds a function which queries for seriliazed contexts', function() {
      this.QueryChild.withContext({
        query_child: 'something'
      });

      this.find.calledOnce.should.be.ok;
      this.find.getCall(0).args[0].should.eql({
        context_type: 'QueryChild',
        context_id: 'something'
      });
    });

    it('ignores model names which don\'t validate', function() {
      this.QueryChild.withContext({
        query_child_other: 'something'
      });

      this.find.calledTwice.should.be.ok;
      this.find.getCall(1).args[0].should.eql({
        query_child_other: 'something'
      });
    });
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
          var mockFilter = function() { return ['query_parent']; };

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

      describe('when the `filter` function uses the context', function() {
        function validator(value) {
          /* jshint validthis: true */
          var connection = this.constructor.db;
          var models = require('..').utils.getModelNames(connection);

          return !!value && (models.indexOf(value) !== -1);
        }

        mockModel();

        it('calls `model.find` with a serialized query', function() {
          var _this = this;

          var filter = function(names, ctx) {
            ctx.should.have.property('constructor');
            ctx.constructor.should.equal(_this.mock_model);
            return names
              .filter(validator.bind(ctx))
              .map(serialization.snakelize);
          };

          query.withContext(filter, this.mock_model, {
            'query_parent': 'something'
          });

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
