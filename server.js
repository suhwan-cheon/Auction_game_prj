var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);
var user_count = 1;
// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다
io.on('connection', function(socket) {

  // 접속한 클라이언트의 정보가 수신되면
  socket.on('login', function(data) {
    data.name += user_count;
    data.userid += user_count;
    user_count++;
    console.log('Client logged-in:\n name:' + data.name + '\n userid: ' + data.userid);

    // socket에 클라이언트 정보를 저장한다
    socket.name = data.name;
    socket.userid = data.userid;

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    io.emit('login', data.name );

    //3명이 다 들어왔으면 게임을 시작합니다.
    if(user_count == 4){

      io.emit('start', "게임이 시작되었습니다!\n");

      var item = ['', '모나리자', '페라리', '존웍의 4번째 개', '비 깡 앨범', '라모스가 쏘아올린 축구공', '아이패드', '차봉의 성경책', '쿠팡맨', '카트라이더 러쉬플러스'];
      var price = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      var counting_price = 100;
      var item_count = 1;
      var cnt = 1;

      io.emit('start', item_count+"번째경매가 시작되었습니다.\n\n");
      io.emit('start', "경매 물품 : " + item[item_count]);
      io.emit('start', "시작가 : " + price[item_count]);
      io.emit('start', "입찰에 응하시겠습니까? (yes/no)\n");

      socket.on('chat', function(data) {
        console.log('Message from %s: %s', socket.name, data.msg);

        var msg = {
          from: {
            name: socket.name,
            userid: socket.userid
          },
          msg: data.msg
          };
        io.emit('betting', msg);
      });
      /*
      for(var i = 1; i<=9; i++){
        io.emit('start', i+"번째경매가 시작되었습니다.\n\n");
        io.emit('start', "경매 물품 : " + item[i]);
        io.emit('start', "시작가 : " + price[i]);
        var cnt = 0;
        setTimeout(function timeout(){
        // 클라이언트로부터의 메시지가 수신되면
        socket.on('chat', function(data) {
          cnt++;
          console.log('Message from %s: %s', socket.name, data.msg);

          var msg = {
            from: {
              name: socket.name,
              userid: socket.userid
            },
            msg: data.msg
          };
          io.emit('chat', msg);
        });
      }, 15000);


      }
      */
    }
  });

  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', function(data) {
    console.log('Message from %s: %s', socket.name, data.msg);

    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid
      },
      msg: data.msg
    };
    io.emit('chat', msg);

  });

  // force client disconnect from server
  socket.on('forceDisconnect', function() {
    socket.disconnect();
  })

  socket.on('disconnect', function() {
    console.log('user disconnected: ' + socket.name);
  });
});

server.listen(3000, function() {
  console.log('Socket IO server listening on port 3000');
});
