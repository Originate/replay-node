var assert  = require('assert');
var clone   = require('clone');
var request = require('request');

module.exports = Replay;

function Replay (replayKey, clientId, options) {
  var options    = options || {};
  this.queue     = [];
  this.replayKey = replayKey;
  this.clientId  = clientId;
  this.sendAt    = options.sendAt || 100;
  this.sendAfter = options.sendAfter || 12000;
  this.host      = options.host || 'http://replay.io';
}

Replay.prototype.trait = function(properties) {
  verifyEvent(properties);
  this.enqueue('trait', {
    properties : clone(properties)
  });
  return this;
};

Replay.prototype.event = function(eventName, properties) {
  verifyEvent(properties);
  this.enqueue('event', {
    event_name : eventName,
    properties : clone(properties)
  });
  return this;
};

Replay.prototype.enqueue = function(type, data) {
  this.queue.push({
    type      : type,
    request   : data
  });

  if (this.queue.length >= this.sendAt) this.send();
  if (this.timer) clearTimeout(this.timer);
  if (this.flushAfter) this.timer = setTimeout(this.flush, this.flushAfter);
}

Replay.prototype.send = function() {
  if (!this.queue.length) return;
  var items = this.queue.splice(0, this.sendAt);
  // console.log('this.queue', this.queue);

  var options = {
    uri: this.host+'/bulk',
    method: 'POST',
    headers: {'Content-Type': 'text/json'},
    json: {foo:3}
  }

  request(options, function(error, response, body){
    if (error) throw error;
    console.log('Send to',options.uri+':', JSON.stringify(items));
  });

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
      console.log('Entered', endPoint.path);

      res.end = function() {
        var time = (new Date().getTime()) - start;
        console.log('Left', endPoint.path, ':', time);
        _this.event('endPoint', {timeTaken: time, path: endPoint.path});
        end.apply(res, arguments);
      }
      
      callback(req, res);
    }
    return endPoint;
  });
};