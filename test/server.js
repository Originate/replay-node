var express = require('express');
var app = express();
var port = 3003;


app.use(express.bodyParser())

app.post('/events', function(req, res){
  res.send(200);
});

app.post('/traits', function(req, res){
  res.send(200);
});

app.post('/bulk', function(req, res){
  res.send(200);
});

app.listen(port);

console.log('Demo server on port', port);