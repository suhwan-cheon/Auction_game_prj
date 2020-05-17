var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

var user_count = 1;
var bet_count = 0;
var login_check = 0;

var item = ['', '모나리자', '페라리', '존웍의 4번째 개', '비 깡 앨범', '라모스가 쏘아올린 축구공', '아이패드', '안나의 일기', '쿠팡맨', '카트라이더 러쉬플러스'];
var price = [0, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 8000000, 90000];
var counting_price = 100;
var current_price = 0;
var item_count = 1;
var raise_count = 0;
var raise_name_list = new Array();
// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

function start_game(){
  io.emit('start', item_count + "번째 경매 물품입니다.");
  io.emit('start', "물건 : " + item[item_count]);
  io.emit('start', "시작가 : " + price[item_count]);
  io.emit('start', "호가 " + counting_price + "부터 시작합니다.");
  io.emit('start', "경매에 응하시겠습니까? (yes/no)");
  current_price = price[item_count];
  counting_price = current_price / 100;
}

function next_game(){
  item_count++;
  raise_name_list = [];
  start_game();
}
function upper_cost(){
  current_price += counting_price;
  io.emit('start', "현재가 : " + current_price);
  io.emit('start', "호가 : " + counting_price);
  io.emit('start', "경매에 응하시겠습니까? (yes/no)");
}
function upper2_cost(){
  io.emit('start', "참여자 모두 입찰하여 호가를 2배 늘립니다.");
  current_price += counting_price;
  counting_price += counting_price;
  io.emit('start', "현재가 : " + current_price);
  io.emit('start', "호가 : " + counting_price);
  io.emit('start', "경매에 응하시겠습니까? (yes/no)");
}
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
    socket.wallet = data.wallet;
    // 접속된 모든 클라이언트에게 메시지를 전송한다
    io.emit('login', data.name );

    //3명이 다 들어왔으면 게임을 시작합니다.
    if(user_count == 4) {
      io.emit('start', "게임을 시작합니다!");
      start_game();
    }
  });

  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', function(data) {
    console.log('Message from %s: %s', socket.name, data.msg);

    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid,
        wallet: socket.wallet
      },
      msg: data.msg
    };
    //경매에 응한경우
    if(data.msg != "no") {
      raise_name_list.push(msg);
      raise_count++;
    }
    io.emit('betting', msg);
    bet_count++;
    if(bet_count == 3){
      bet_count = 0;
      if(raise_count == 1){
        io.emit('start', raise_name_list[0].from.name + " 참여자가 낙찰받았습니다!");
        raise_name_list[0].from.wallet -= current_price;
        io.emit('start', "현재 잔여 금액 : " + raise_name_list[0].from.wallet);
        next_game();
      }
      else if(raise_count == 2){
        upper_cost();
      }
      else upper2_cost();
      raise_count = 0;
    }
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
