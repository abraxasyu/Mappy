var express = require("express");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var aws = require('aws-sdk');
//var pg = require('pg');
app.use('/static', express.static('assets'));


aws.config.update({
  region:"us-east-2",
  endpoint:"dynamodb.us-east-2.amazonaws.com"
});
var docClient = new aws.DynamoDB.DocumentClient();





app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});

io.on('connection', function(socket){
  socket.on('connect',function(msg){
    console.log('user connected');
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });


  //http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
  socket.on('requesttable',function(msg){


    //to return full table:
    var params={
      TableName:msg,
    };
    docClient.scan(params,function(err,data){
      if(err){console.log('aws dynamodb fetch error:'+err);}
      else{socket.emit('receivetable',data);}
    });


    /*
    filter basd on date
    aggregeate based on room
    */
  });




});



http.listen(33333, function(){
  console.log('listening on *:33333');
});
