var express = require("express");
var fs = require("fs");
var app = express();
const web3 = require('web3-utils');
const abi = require('web3-eth-abi');
var cors = require('cors');
//better_web3 = require("./js/dist/web3U.js");

app.use(cors());
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('src'));
app.use(express.static('../Tigora-contract/build/contracts'));
app.get('/', function (req, res) {
  res.render('index.html');
});

var nextTicketID = 0;
fs.readFile('./src/tickets.json', function (err, data) {
  var json = JSON.parse(data);
  nextTicketID = Object.keys(json).length;
  console.log('next ticket id = ' + nextTicketID);
});
//web3.utils.soliditySha3({ type: 'uint256', value: 1} , { type: 'bytes32', value: '0x426526'})
//console.log(web3.asciiToHex('0'));
//console.log(web3.soliditySha3({ type: 'bytes32', value: '0x4265260000000000000000000000000000000000000000000000000000000000' }, { type: 'uint', value: 0 }));
//console.log(web3.soliditySha3(426526, 1));

var password = '';
console.log(web3.sha3(password, nextTicketID.toString()));


app.post('/getJSON', function (req, res) {
  fs.readFile('./src/tickets.json', function (err, data) {
    console.log('id received = ' + req.body.id);
    var json = JSON.parse(data);
    res.send(json);
  });
});


app.post('/ticketInfo', function (req, res) {
  fs.readFile('./src/tickets.json', function (err, data) {
    console.log('id received = ' + req.body.id);
    var json = JSON.parse(data);
    for (var i = 0; i < json.length; i++) {
      if (json[i].id == req.body.id) {
        res.send({
          hash: json[i].hash,
          price: json[i].price,
          priceHash: json[i].priceHash,
          group: json[i].group,
          groupHash: json[i].groupHash,
          id : json[i].id
        });
        console.log(json[i]);

        console.log('ticket info set');
        return;
      }
    }
  });
});

app.post("/setPassword", function (req, res) {
  password = req.body.password;
  console.log('password = ' + password);
  res.send('password was successfully set');
});

app.post("/changePrimary", function (req, res) {
  fs.readFile('./src/tickets.json', function (err, data) {
    console.log('in changePrimary');
    var json = JSON.parse(data);
    console.log(json[0]);
    for (var i = 0; i < json.length; i++) {
      if (json[i].id == req.body.id) {
        if (req.body.caller == 0) {
          json[i].primary = -1;
          json[i].owner = req.body.owner;
        }
        else if (req.body.caller == 3) {
          json[i].primary = 0;
          json[i].price = req.body.offerPrice;
        }
        else if (req.body.caller == 5) json[i].primary = 5; // TOOD change
        console.log('primary set to 0');
        console.log('json.owner = ' + json[i].owner + ' req = ' + req.body.owner);
        res.send('great success');
        fs.writeFile('./src/tickets.json', JSON.stringify(json), function (err, result) {
          if (err) console.log('error', err);
        });
        return;
      }
    }
  });
});

app.post('/clearTickets', function (req, res) {
  fs.writeFile('./src/tickets.json', '[{}]', function(){
    nextTicketID = 0;
    console.log('tickets cleared');
    res.send('success');
  });
});

app.post("/makeTickets", function (req, res) {
  //console.log(req);
  //var contents = fs.readFileSync("./src/tickets.json");
  var _password = req.body.password;
  if (password === '') {
    res.send('You must set a password first');
    return;
  }
  if (_password != password) {
    res.send('Invalid Password');
    console.log('bad password');
    return;
  }
  var ticketRow = parseInt(req.body.ticketRow);
  var ticketClass = req.body.ticketClass;
  var end = parseInt(ticketRow) + nextTicketID;
  console.log('nextID: ' + nextTicketID);

  fs.readFile('./src/tickets.json', function (err, data) {
    var json = JSON.parse(data);

    var numTickets = req.body.numTickets;
    var end = parseInt(numTickets) + nextTicketID;
    //res.send({a : 1});

    //nextTicketID = Object.keys(jsonObject).length + 1;
    //console.log(nextTicketID);
    for (var i = 0; i < parseInt(req.body.ticketsPerRow); i++) {
    
      json.push({
        'id: ': nextTicketID,
        id: nextTicketID,
        group: req.body.ticketClass,
        price: parseFloat(req.body.basePrice),
        basePrice: parseFloat(req.body.basePrice),
        seat: i.toString() + '--' + ticketRow.toString(),
        internalSeat: i,
        hash: web3.soliditySha3({ type: 'uint256', value: nextTicketID }, { type: 'bytes32', value: password}),
        priceHash: web3.soliditySha3({ type: 'uint256', value: parseFloat(req.body.basePrice) }, { type: 'bytes32', value: password}),
        groupHash: web3.soliditySha3({ type: 'uint256', value: web3.fromAscii(req.body.ticketClass) }, { type: 'bytes32', value: password}),
        owner: '0', /*0,*/ //TODO Change back to 0
        primary: 1
      });
      //console.log(web3.soliditySha3({ type: 'uint256', value: nextTicketID} , { type: 'bytes32',    value: '0x426526'}));
      nextTicketID++;
    }

    fs.writeFile('./src/tickets.json', JSON.stringify(json), function (err, result) {
      if (err) console.log('error', err);
     // res.send({ 'a': 1 });
     res.send('Tickets made successfully');
      console.log("sent");
    });
  });
});

app.listen(3001, '0.0.0.0', function () {
  //console.log(Web3Utils.sha3('23'));
  console.log('Example app listening on port 3001!');
});
