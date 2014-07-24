var express = require('express');
var app = express();
var reOptions = {sendAt : 2, debug: true};
var replay = require('../lib')('Replay', 'DistinctId', reOptions);
var port = 3000;

app.get('/', function(req, res){
  res.send('hello world');
  replay.event('loaded /', {})
});

app.get('/bar', function(req, res){
	setTimeout(function(){
		res.send('bar');	
	}, 100);
});

app.get('/foo', function(req, res){
	setTimeout(function(){
		res.send('Foo');	
	}, 200);
});

app.listen(port);

//works for all res types (end, send, json, render)
replay.trackRoutes(app);

console.log('Started on port', port);