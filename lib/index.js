var assert  = require('assert');
var clone   = require('clone');
var request = require('request');

module.exports = Replay;

function Replay (replayKey, distinctId, options) {
  if (!(this instanceof Replay)) {
    return new Replay(replayKey, distinctId, options);
  }
  
  assert(replayKey, 'Must provide a replayKey');
  assert(typeof replayKey === 'string', 'replayKey must be a string');

  assert(distinctId, 'Must provide a valid distinctId');
  assert(typeof distinctId === 'string', 'distinctId must be a string')

  var options     = options || {};
  
  this.replayKey  = replayKey;
  this.distinctId = distinctId;
  this.sendAt     = options.sendAt || 1;
  this.sendAfter  = options.sendAfter || 12000;
  this.debug      = options.debug || false;
  this.host       = options.host || 'http://replay.io';
  this.queue      = [];
}

Replay.prototype.trait = function(eventName, properties) {
  veryifyTrait(properties);
  var data = { properties: clone(properties) };

  if (this.sendAt === 1) {
    this.send('/traits', data);
  } else {
    this.enqueue('trait', data);
  }
  
  return this;
};

Replay.prototype.event = function(eventName, properties) {
  verifyEvent(properties);
  var data = {
    event_name : eventName,
    properties: clone(properties)
  }

  if (this.sendAt === 1) {
    this.send('/events', data);
  } else {
    this.enqueue('event', data);
  }
  
  return this;
};

Replay.prototype.send = function(endPoint, data) {
  var _this = this;
  data.replay_key = this.replayKey;
  data.distinct_id = this.distinct_id;
  
  var options = {
    uri: this.host+endPoint,
    method: 'POST',
    headers: {'Content-Type': 'text/json'},
    json: data
  }

  request(options, function(error, response, body){
    if (error) throw error;
    _this.print('Send to',options.uri+':', JSON.stringify(options.json));
  });
}

Replay.prototype.enqueue = function(type, data) {
  this.queue.push({
    type      : type,
    request   : data
  });

  if (this.queue.length >= this.sendAt) this.flushQueue();
  if (this.timer) clearTimeout(this.timer);
  if (this.flushAfter) this.timer = setTimeout(this.flush, this.flushAfter);
}

Replay.prototype.flushQueue = function() {
  if (!this.queue.length) return;
  var _this = this;
  var items = this.queue.splice(0, this.sendAt);

  var options = {
    uri: this.host+'/bulk',
    method: 'POST',
    headers: {'Content-Type': 'text/json'},
    json: {
      replay_key : this.replayKey,
      distinct_id : this.distinctId,
      data : {
        requests : items
      }
    }
  }

  request(options, function(error, response, body){
    if (error) throw error;
    _this.print('Send to',options.uri+':', JSON.stringify(options.json));
  });

};

Replay.prototype.print = function() {
  if (this.debug) {
    console.log.apply(null, arguments);
  }
};

function verifyEvent(event) {
  if (!event) throw 'No event object'
};

function veryifyTrait(trait) {
  if (!trait) throw 'No trait object'
};

Replay.prototype.trackRoutes = function(app) {
  this.app   = app;
  var _this  = this;
  var routes = app.routes || app._router.stack;

  routes.get = routes.get.map(function(endPoint) {
    var callback = endPoint.callbacks[0];
    endPoint.callbacks[0] = function(req, res) {
      var end = res.end;
      var start = new Date().getTime();
      // console.log('Entered', endPoint.path);

      res.end = function() {
        var time = (new Date().getTime()) - start;
        // console.log('Left', endPoint.path, ':', time);
        _this.event('endPoint', {timeTaken: time, path: endPoint.path});
        end.apply(res, arguments);
      }
      callback(req, res);
    }
    return endPoint;
  });
};