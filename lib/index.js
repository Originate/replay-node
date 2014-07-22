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
  this.host      = options.host || 'replay.io';
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
  data.replay_key = this.replayKey;
  this.queue.push({
    type      : type,
    api_key   : this.replayKey
    client_id : this.clientId
    request   : clone(data)
  });
  if (this.queue.length >= this.sendAt) this.send();
  if (this.timer) clearTimeout(this.timer);
  if (this.flushAfter) this.timer = setTimeout(this.flush, this.flushAfter);
}

Replay.prototype.send = function() {
  if (!this.queue.length) return;
  var items = this.queue.splice(0, this.flushAt);
  request.post({
    headers: {'content-type' : 'text/json'},
    url:     this.host+'/bulk',
    body:    items
  }, function(error, response, body){
    if (error) {
      throw error;
    }
  });
};

function verifyEvent(event) {
  if (!event) throw 'No event object'
};

function veryifyTrait(trait) {
  if (!trait) throw 'No trait object'
};

