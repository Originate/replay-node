var Mocha = require('mocha');
var assert = require('assert');
var sinon = require('sinon');
var expect = require('chai').expect;
var mocha = new Mocha({ reporter: 'spec' });

var Replay = require('../lib')

require('./server')

describe('node-replay', function(){

  context('validates bad input', function(){
    it('checks replayKey', function(){
      assert.throws(Replay, Error)
    });
    it('checks clientId', function(){
    	var noClientId = function(){
      	Replay('replayKey')
      }
      assert.throws(noClientId, Error)
    });
  });

  context('with good input', function(){
    it('sets the host', function(){
      var replay = Replay('Replay', 'DistinctId');
      expect(replay.replayKey).to.equal('Replay');
      expect(replay.distinctId).to.equal('DistinctId');
    });

    it('sets the options', function(){
    	var options = {
    		debug: true,
    		sendAt: 42,
  			sendAfter: 12000,
  			debug: false,
  			host: 'http://myhost.io'
    	}
    	var replay = Replay('Replay', 'DistinctId', options);
    	for (var key in options) {
    		expect(replay[key] = options[key])
    	}
    });
  });

  context('tracking', function(){
  	beforeEach(function() {
  		var options = {host: 'http://localhost:3003'};
  		this.replay = Replay('Replay','DistinctId', options);
    });

  	it('queues events', function(){
			var props = {foo : 42};
  		this.replay.sendAt = 3;
  		this.replay.event('eventA', props);
  		console.log(this.replay.queue[0]);
  		expect(this.replay.queue[0]).to.deep.equal({
  			type: 'event',
  			request: { event_name: 'eventA', properties: props }
  		});
  	});

  	it('queues traits', function(){
			var props = {foo : 42};
  		this.replay.sendAt = 3;
  		this.replay.trait('traitA', props);
  		expect(this.replay.queue[0]).to.deep.equal({
  			type: 'trait',
  			request: { properties: props }
  		});
  	});

  	it('does not queue events with sendAt=1', function(){
			var myEvent = {foo : 42};
  		this.replay.sendAt = 1;
  		this.replay.event('eventA',myEvent);
  		expect(this.replay.queue.length).to.equal(0);
  	});

  	it('queues the appropriate number', function(){
  		var myEvent = {foo : 42};
  		this.replay.sendAt = 3;
  		this.replay.event('eventA',myEvent);
  		this.replay.event('eventB',myEvent);
  		expect(this.replay.queue.length).to.equal(2);
  		this.replay.event('eventC',myEvent);
  		expect(this.replay.queue.length).to.equal(0);
  	});

    it('sets the options', function(){
    	var options = {
    		debug: true,
    		sendAt: 42,
  			sendAfter: 12000,
  			debug: false,
  			host: 'http://myhost.io'
    	}
    	var replay = Replay('Replay', 'DistinctId', options);
    	for (var key in options) {
    		expect(replay[key] = options[key])
    	}
    });
  });



});