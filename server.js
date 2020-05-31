var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

var user_count = 1;
var bet_count = 0;
var login_check = 0;
var wallet_arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var win_arr = [0, 0, 0, 0, 0];
var name_arr = ['', '', '', ''];
var item = ['', '송골매 동상', '열기구', '첵스초코', '폼폼이와 재경이', '학관 GS 평생 무료', '세스나', '활주로', '학기 재수 무료 이용권', '경중선 배차시간 단축권'];
var item_url = ['', 'https://ifh.cc/g/qKRdRt.jpg', 'https://ifh.cc/g/66oQLy.jpg', 'https://ifh.cc/g/UVCefX.jpg', 'https://ifh.cc/g/Or1eIA.jpg', 'https://ifh.cc/g/6EW2Z6.jpg', 'https://ifh.cc/g/khZh1H.jpg', 'https://ifh.cc/g/9FEcTp.jpg', 'https://ifh.cc/g/JrGblQ.jpg', 'https://ifh.cc/g/MTbfsC.jpg']
var price = [0, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000];
var counting_price = 100000;
var current_price = 0;
var item_count = 1;
var raise_count = 0;
var raise_name_list = new Array();
var finish = ['a', 'b', 'c', 'd', 'e', 'f', 'g','h', 'i'];
// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

function reset_game(){
  user_count = 1;
  login_check = 0;
  raise_name_list = [];
  wallet_arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  win_arr = [0, 0, 0, 0, 0];
  name_arr = ['', '', '', ''];
  finish = ['a', 'b', 'c', 'd', 'e', 'f', 'g','h', 'i'];
  bet_count = 0;
  item_count = 1;
  io.emit('reset', "s");
}
function start_game(){
  io.emit('bet_start', item_url[item_count], item[item_count]);
  io.emit('raise_price', price[item_count], counting_price);
  io.emit('start', item_count + "번째 경매 물품입니다.");
  io.emit('start', "경매에 응하시겠습니까?");
  current_price = price[item_count];
  counting_price = current_price / 10;
}

function next_game(){
  item_count++;
  raise_name_list = [];
  start_game();
}
function upper_cost(){
  current_price += counting_price;
  io.emit('raise_price', current_price, counting_price);
  io.emit('start', "호가 : " + counting_price);
  io.emit('start', "경매에 응하시겠습니까?");
}
function upper2_cost(){
  io.emit('start', "참여자 모두 입찰하여 호가를 2배 늘립니다.");
  current_price += counting_price;
  counting_price += counting_price;
  io.emit('raise_price', current_price, counting_price);
  io.emit('start', "호가 : " + counting_price);
  io.emit('start', "경매에 응하시겠습니까?");
}

function Is_finish(){
  //세로줄
  for(var i = 0; i<3; i++){
    if(finish[0+i] == finish[3+i] && finish[3+i] == finish[6+i]) return true;
  }
  //가로줄
  for(var i = 0; i<3; i++){
    if(finish[0+(3 * i)] == finish[1+(3 * i)] && finish[1+(3 * i)] == finish[2+(3 * i)]) return true;
  }
  //대각선
  if(finish[0] == finish[4] && finish[4] == finish[8]) return true;
  if(finish[2] == finish[4] && finish[4] == finish[6]) return true;
  //빙고 안만들어진 경우
  return false;
}


// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다
io.on('connection', function(socket) {


  // 접속한 클라이언트의 정보가 수신되면
  socket.on('login', function(data) {
    data.userid = user_count;
    user_count++;

    console.log('Client logged-in:\n name:' + data.name + '\n userid: ' + data.userid);

    // socket에 클라이언트 정보를 저장한다
    socket.name = data.name;
    socket.userid = data.userid;
    socket.wallet = data.wallet;
    // 접속된 모든 클라이언트에게 메시지를 전송한다
    wallet_arr[data.userid] = data.wallet;
    name_arr[data.userid] = data.name;
    io.emit('login', data.name );
    io.emit('info', wallet_arr[1], wallet_arr[2], wallet_arr[3]);
    io.emit('name', name_arr[1],name_arr[2],name_arr[3]);
    //3명이 다 들어왔으면 게임을 시작합니다.
    if(user_count == 4) {
      io.emit('start', "게임을 시작합니다!");
      start_game();
    }
  });
  socket.on('bet', function(data){

    console.log('bet Message from %s: %s', socket.name, data);
    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid,
        wallet: socket.wallet,
      },
      msg: data
    };
    if(socket.userid < 4){
    if(data == "no" || data == "yes"){
    //경매에 응한경우
    if(data != "no") {
      raise_name_list.push(msg);
      raise_count++;
    }
    io.emit('betting', msg);
    bet_count++;
    if(bet_count == 3){
      bet_count = 0;
      if(raise_count == 1){
        io.emit('start', raise_name_list[0].from.name + " 참여자가 낙찰받았습니다!");
        win_arr[raise_name_list[0].from.userid]++;
        io.emit('bingo', raise_name_list[0].from.userid, item_count);
        wallet_arr[raise_name_list[0].from.userid] -= current_price;
        io.emit('info', wallet_arr[1], wallet_arr[2], wallet_arr[3]);
        finish[item_count-1] = raise_name_list[0].from.name;
        if(Is_finish()) {
          io.emit('start', raise_name_list[0].from.name + " 참여자가 승리하였습니다!");
          reset_game();
        }
        else if(item_count == 9){
          io.emit('start', raise_name_list[0].from.name + " 참여자가 승리하였습니다!");
          reset_game();
        }
        else next_game();
      }
      else if(raise_count == 2){
        upper_cost();
      }
      else upper2_cost();
      raise_count = 0;
    }
  }
}
});
  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', function(data) {
    console.log('chat Message from %s: %s', socket.name, data.msg);
    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid,
        wallet: socket.wallet,
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
