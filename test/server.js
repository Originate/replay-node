var express = require('express');
var app = express();
var Replay = require('../lib');
var replay = new Replay('Replay', 'DistinctId', {sendAt : 2});
var port = 3000;

app.get('/', function(req, res){
  res.send('hello world');
  // replay.event('loaded /', {})
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