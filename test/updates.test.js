'use strict'; /* global describe, it, before, after */
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var _        = require('lodash'),
    should   = require('should'),
    mongoose = require('mongoose'),
    updates  = require('..').updates;

var Schema = mongoose.Schema;
var makeStub = require('./helper').makeStub;

describe('updates', function() {
  before(function() { mongoose.connect('mongodb://localhost/test'); });
  after(function() { mongoose.disconnect(); });

  before(function() {
    var schema = new Schema({
      context_type: String,
      context_id:   Schema.ObjectId,
    });
    updates.add(schema, function(str) {
      return 'normalized-' + str.toLowerCase();
    });

    this.UpdatesChild = mongoose.model('UpdatesChild', schema);
  });

  before(function() {
    var schema = new Schema({ updates_childs: [mongoose.Schema.ObjectId] });

    this.UpdatesParent = mongoose.model('UpdatesParent', schema);
  });

  describe('.add(schema, normalize)', function() {
    describe('when saving a new document', function() {
      makeStub('refUpdate', updates, 'refUpdate',
              function(method, path, doc, cb) { cb(); });

      it('skips all hooks if there\'s no context', function(done) {
        var _this = this;
        var child = new this.UpdatesChild();

        child.save(function(err, doc) {
          if(err) return done(err);
          _this.parent_less_child = doc;

          _this.refUpdate.called.should.not.be.ok;
          done();
        });
      });

      it('calls `refUpdate` in order to push this child into its parent', function(done) {
        var _this = this;
        var id = new mongoose.Types.ObjectId();
        var child = new this.UpdatesChild({
          context_type: 'UpdatesParent',
          context_id:   id
        });

        child.save(function(err, doc) {
          if(err) return done(err);
          _this.child = doc;

          _this.refUpdate.calledOnce.should.be.ok;
          var call = _this.refUpdate.getCall(0);
          var args = call.args;
          args[0].should.equal('save');
          // note the inflection happening here
          args[1].should.equal('normalized-updateschild' + 's');
          args[2].should.equal(child);
          done();
        });
      });
    });

    describe('when changing a document with modifications to its context', function() {
      makeStub('refUpdate', updates, 'refUpdate',
              function(method, path, ct, ci, doc, cb) {
                if(!doc) cb = ci;
                cb();
              });

      before(function(done) {
        var _this = this;

        this.old_context_id = this.child.context_id;
        this.new_context_id = new mongoose.Types.ObjectId();
        this.child.context_id = this.new_context_id;

        this.child.save(function(err, doc) {
          _this.child = doc;
          done(err);
        });
      });

      it('calls `refUpdate` in order to pull this child from its old parent', function() {
        var call = _.find(this.refUpdate.getCalls(), function(call) {
          return call.args[0] === 'remove';
        });

        should.exist(call);
        var args = call.args;
        // note the inflection happening here
        args.length.should.equal(6);
        args[1].should.equal('normalized-updateschild' + 's');
        args[2].should.equal('UpdatesParent');
        args[3].should.equal(this.old_context_id);
      });

      it('calls `refUpdate` in order to pull this child from its old parent', function(done) {
        var call = _.find(this.refUpdate.getCalls(), function(call) {
          return call.args[0] === 'save';
        });

        should.exist(call);
        var args = call.args;
        // note the inflection happening here
        args[1].should.equal('normalized-updateschild' + 's');
        args[2].context_id.should.equal(this.new_context_id);
        done();
      });
    });

    describe('when removing a document', function() {
      makeStub('refUpdate', updates, 'refUpdate',
              function(method, path, doc, cb) { cb(); });

      it('skips all hooks if there\'s no context', function(done) {
        var _this = this;

        this.parent_less_child.remove(function(err) {
          if(err) return done(err);
          _this.refUpdate.called.should.not.be.ok;
          done();
        });
      });

      it('calls `refUpdate` in order to pull this child from its parent', function(done) {
        var _this = this;
        var id = new mongoose.Types.ObjectId();
        var child = new this.UpdatesChild({
          context_type: 'UpdatesParent',
          context_id:   id
        });

        child.remove(function(err) {
          if(err) return done(err);

          _this.refUpdate.calledOnce.should.be.ok;
          var call = _this.refUpdate.getCall(0);
          var args = call.args;
          args[0].should.equal('remove');
          // note the inflection happening here
          args[1].should.equal('normalized-updateschild' + 's');
          args[2].should.equal(child);
          done();
        });
      });
    });
  });

  describe('.refUpdate(method, path, doc, cb)', function() {
    describe('when the parent doesn\'t exist', function() {
      makeStub('findByIdAndUpdate', 'UpdatesParent', 'findByIdAndUpdate',
              function(id, update, cb) { cb(null/* I'm not a doc */); });

      it('passes on a `not Found` error with status of 400 if method=save', function(done) {
        var child = new this.UpdatesChild({
          context_type: 'UpdatesParent',
          context_id: new mongoose.Types.ObjectId()
        });

        updates.refUpdate('save', 'updates_childs', child, function(err) {
          should.exist(err);
          err.message.should.match(/UpdatesParent not found/);
          err.status.should.equal(400);
          done();
        });
      });

      it('ignores it if method=remove', function(done) {
        var child = new this.UpdatesChild({
          context_type: 'UpdatesParent',
          context_id: new mongoose.Types.ObjectId()
        });

        updates.refUpdate('remove', 'updates_childs', child, done);
      });
    });

    describe('when adding references - method=save', function() {
      makeStub('findByIdAndUpdate', 'UpdatesParent', 'findByIdAndUpdate',
              function(id, update, cb) { cb(null, { /* I'm a doc. */ }); });

      it('calls ContextModel.findByIdAndUpdate with a $push command', function(done) {
        var _this = this;
        var id = new mongoose.Types.ObjectId();
        var child = new this.UpdatesChild({
          context_type: 'UpdatesParent',
          context_id:   id
        });

        updates.refUpdate('save', 'updates_childs', child, function(err) {
          if(err) return done(err);
          _this.findByIdAndUpdate.calledOnce.should.be.ok;
          var call = _this.findByIdAndUpdate.getCall(0);
          var args = call.args;
          args[0].should.equal(id);
          args[1].should.eql({ $push: { updates_childs: child._id } });
          done();
        });
      });
    });

    describe('when removing references - method=remove', function() {
      makeStub('findByIdAndUpdate', 'UpdatesParent', 'findByIdAndUpdate',
              function(id, update, cb) { cb(null, { /* I'm a doc. */ }); });

      it('calls ContextModel.findByIdAndUpdate with a $pull command', function(done) {
        var _this = this;
        var id = new mongoose.Types.ObjectId();
        var child = new this.UpdatesChild({
          context_type: 'UpdatesParent',
          context_id:   id
        });

        updates.refUpdate('remove', 'updates_childs', child, function(err) {
          if(err) return done(err);
          _this.findByIdAndUpdate.calledOnce.should.be.ok;
          var call = _this.findByIdAndUpdate.getCall(0);
          var args = call.args;
          args[0].should.equal(id);
          args[1].should.eql({ $pull: { updates_childs: child._id } });
          done();
        });
      });
    });
  });

  describe('.cacheContext(doc)', function() {
    it('caches the `context_id` and `context_type`', function() {
      var doc = { context_type: 'Foo', context_id: 'bar' };
      updates.cacheContext(doc);
      doc._original.context_type.should.equal('Foo');
      doc._original.context_id.should.equal('bar');
    });

    it('doesn\'t overwrite `_original` if it exists', function() {
      var doc = {
        context_type: 'Foo',
        context_id: 'bar',
        _original: { stuff: 'here' }
      };
      updates.cacheContext(doc);
      doc._original.stuff.should.equal('here');
      doc._original.context_type.should.equal('Foo');
      doc._original.context_id.should.equal('bar');
    });
  });
});
