App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'https://ropsten.infura.io/v3/', //include your own endpoint
  chairPerson: null,
  currentAccount: null,
  currentPhase: null,
  pCount:0,
  sCount:0,
  init: function () {
    a = [1,2];
    $.getJSON('../tickets.json', function (data, a) {
      //sort data 
      if (data.length >= 2) data.sort(customSort('primary', 'group', 'seat'));
      var proposalsRow = $('#proposalsRow');
      var proposalTemplate1 = $('#proposalTemplate1');
      var proposalTemplate2 = $('#proposalTemplate2');
     
     
      var set = 0;
      for (i = 0; i < data.length; i++) {
        //proposalTemplate.find('.panel-title').text(data[i].id);
        // if (parseInt(data[i].id) % 2 == 0)
        // proposalTemplate.find('.panel-title').css('backgroundColor', 'red');
        // proposalTemplate.find('._group').text(data[i].group);
        // var a = document.getElementById("_group");
        //a.innerHTML += data[i].group;
        //proposalTemplate.find('.btn-vote').attr('data-id', data[i].Seat);
        //https://stackoverflow.com/questions/584751/inserting-html-into-a-div
        var newDiv = document.createElement('div');
        newDiv.className = 'ticket_' + i.toString();
        newDiv.setAttribute('id', 'ticket_' + data[i].id);

        if (data[i].primary == '1') {
          // color = (parseInt(data[i].id) % 2 == 0) ? '#ffdb58' : '#7CB9E8';
          color = 'palegreen';
          newDiv.innerHTML =
            `<div class="col-sm-8 col-md-2 ">
                <div class="panel panel-default panel-proposal">
                  <div class="panel-heading">
                    <h3 class="panel-title" style="text-align:center"> <strong> <div class=""> Class:  `
            + data[i].group.toString() + ` </div> <div class="">Seat: ` + data[i].seat + ` </div> </strong> </h3>
                  </div>
                  <div class="panel-body" style="background: ` + color + `">
                    <br />   <div class="w3-center">` + data[i].price + `  ethers </div> <br>
                    <div class="col-md-12 text-center">
                      <button class="btn btn-default btn-buy" id="` + data[i].id + `"onclick="return App.handleBuy(this.id)" type="button" data-id="0">buy</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
          proposalTemplate1.append(newDiv);
          App.pCount += 1;
        }
        else if (data[i].primary == '0') {
          // color = (parseInt(data[i].id) % 2 == 0) ? '#ffdb58' : '#7CB9E8';
          color = 'coral';
          newDiv.innerHTML = 
            `<div class="col-sm-8 col-md-2">
               <div class="panel panel-default panel-proposal">
                 <div class="panel-heading">
                   <h3 class="panel-title" style="text-align:center"> <strong> <div class=""> Class:  `
            + data[i].group.toString() + ` </div> <div class="">Seat: ` + data[i].seat + ` </div> </strong> </h3>
                 </div>
                 <div class="panel-body" style="background: ` + color + `">
                   <br />   <div class="w3-center">` + data[i].price + ` ethers </div> <br>
                   <div class="col-md-12 text-center">
                   <button class="btn btn-default btn-buy" id="` + data[i].id + `"onclick="return App.handleBuySecondary(this.id)" type="button" data-id="0">buy</button>
                   </div>
                 </div>
               </div>
             </div>
           </div>`;
          proposalTemplate2.append(newDiv);
          App.sCount += 1;
        }
        //document.getElementById('proposalTemplate').innerHTML += '<a> hi </a>';
        //proposalsRow.append(proposalTemplate.html());
        // /App.names.push(data[i].name);
      }

     

      function customSort(prop1, prop2, prop3) {
        return function (a, b) {
          if (a[prop1] == b[prop1]) {
            if (a[prop2] == b[prop2]) {
              return a[prop3] < b[prop3] ? -1 : 1;
            } else return a[prop2] < b[prop2] ? -1 : 1;
          } else return a[prop1] > b[prop1] ? -1 : 1;
        }
      }

    });
    /*if (App.pCount == 0) {
      var newDiv = document.createElement('div');
      newDiv.innerHTML = `<h1 class="w3-center"> No tickets are currently available </h1> <br>`;
      $('#proposalTemplate1').append(newDiv);
    }
    if (App.sCount == 0) {
      var newDiv = document.createElement('div');
      newDiv.innerHTML = `<h1 class="w3-center"> No tickets are currently available </h1> <br>`;
      $('#proposalTemplate2').append(newDiv);

    } */
    return App.initWeb3(); 
  },



  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.populateAddress();
    return App.initContract();
  },
  getCurrentPhase: function () {
    App.contracts.vote.deployed().then(function (instance) {
      return instance.state(); // instance is the smart contract
    }).then(function (result) {
      App.currentPhase = result.c[0];
      //var notificationText = App.stages[App.currentPhase];
      //console.log(App.currentPhase);
     // console.log(notificationText);
      //$('#phase-notification-text').text(notificationText);
      console.log("Phase set");
    })
  },

  initContract: function () {
    $.getJSON('Tigora.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var voteArtifact = data;
      App.contracts.vote = TruffleContract(voteArtifact);

      // Set the provider for our contract
      App.contracts.vote.setProvider(App.web3Provider);

      App.getChairperson();
    App.getCurrentPhase();

      return App.bindEvents();
    });
  },

  bindEvents: function () {
    $(document).on('click', '.btn-vote', App.handleVote);
    $(document).on('click', '.btn-vote', App.testFunc);
    $(document).on('click', '#win-count', App.handleWinner);
    $(document).on('click', '.administer', App.handleVote);
    $(document).on('click', '#register', function () { var ad = $('#enter_address').val(); App.handleRegister(ad); });
    $(document).on('click', '.btn-vote', App.handleBuy);
    $(document).on('click', '.btn-vote', App.handleBuySecondary);
  },

  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts, function (i) {
        if (web3.eth.coinbase != accounts[i]) {
          var optionElement = '<option value="' + accounts[i] + '">' + accounts[i] + '</option';
          jQuery('#enter_address').append(optionElement);
        }
      });
    });
  },

  getChairperson: function () {
    App.contracts.vote.deployed().then(function (instance) {
      return instance;
    }).then(function (result) {
      App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
      //App.currentAccount = web3.eth.coinbase; //TODO change statement here
      web3.eth.getCoinbase(function(err, acnt) {
        App.currentAccount = acnt;
      });
      if (App.chairPerson != App.currentAccount) {
        jQuery('#address_div').css('display', 'none');
        jQuery('#register_div').css('display', 'none');
      } else {
        jQuery('#address_div').css('display', 'block');
        jQuery('#register_div').css('display', 'block');
      }
    })
  },

  handleBuySecondary: function (id)  {
    //alert(id);
    //console.log(id);
    //get ticket data
    var group;
    var groupHash;
    var price;
    var priceHash;
    var id;
    var hash;
    
    if (App.currentPhase == 0) {
      alert ('Director is still making tickets; wait until phase advances');
      return;
    }

    $.post('/ticketInfo',  
    {  
      id : id
    }, 
    function (data, status) {
      if (status == 'success') {
      
        hash = data.hash;
        price =  web3.utils.toWei(data.price.toString(), 'ether');
        App.contracts.vote.deployed().then(function (instance) {
          return instance.buyTicketSecondary(hash, { value: price });
        }).then(function (result) {
          if (result.receipt.status) {
            $.post('/changePrimary',  //TODO test
            {  
              id : id,
              owner: App.currentAccount,
              caller: 0
            }, 
            function (data, status) {
              if (status == "success") {
                alert('Ticket Successfully purchased');
              }
            })
          }
          else alert('Error buying ticket');
        })
      }
      else alert("Error in getting ticket info");
    });
},

  handleBuy: function (id)  {
      //alert(id);
      //console.log(id);
      //get ticket data
      var group;
      var groupHash;
      var price;
      var priceHash;
      var id;
      var hash;
      if (App.currentPhase == 0) {
        alert ('Director is still making tickets; wait until phase advances');
        return;
      }

      $.post('/ticketInfo',  
      {  
        id : id
      }, 
      function (data, status) {
        if (status == 'success') {
         // group = web3.eth.abi.encodeParameter('uint256', web3.utils.fromAscii(data.group));
         // price = web3.eth.abi.encodeParameter('uint256', web3.utils.toWei(data.price, 'ether'));
           //TODO remove encoded params
          group = web3.utils.fromAscii(data.group);
          price =  web3.utils.toWei(data.price.toString(), 'ether');
          groupHash = data.groupHash;
          priceHash = data.priceHash;
          hash = data.hash;
          console.log(group, price, hash, data.groupHash, data.priceHash);

          App.contracts.vote.deployed().then(function (instance) {
            return instance.buyTicketPrimary(id, hash, group, groupHash, { value: price });
          }).then(function (result) {
            if (result.receipt.status) {
              $.post('/changePrimary',  //TODO test
              {  
                id : id,
                owner: App.currentAccount,
                caller: 0
              }, 
              function (data, status) {
                if (status == "success") {
                  alert('Ticket Successfully purchased');
                }
              })
            }
            else alert('Error buying ticket');
          })
        }
        else alert("Error in getting ticket info");
      });
  },

  handleRegister: function (addr) {

    var voteInstance;
    App.contracts.vote.deployed().then(function (instance) {
      voteInstance = instance;
      return voteInstance.register(addr);
    }).then(function (result, err) {
      if (result) {
        if (parseInt(result.receipt.status) == 1)
          alert(addr + " registration done successfully")
        else
          alert(addr + " registration not done successfully due to revert")
      } else {
        alert(addr + " registration failed")
      }
    });
  },

  handleVote: function (event) {
    event.preventDefault();
    var proposalId = parseInt($(event.target).data('id'));
    var voteInstance;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function (instance) {
        voteInstance = instance;

        return voteInstance.vote(proposalId, { from: account });
      }).then(function (result, err) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            alert(account + " voting done successfully")
          else
            alert(account + " voting not done successfully due to revert")
        } else {
          alert(account + " voting failed")
        }
      });
    });
  },


  testFunc: function () {
    alert('the whistle is screaming');
  },

  handleWinner: function () {
    console.log("To get winner");
    var voteInstance;
    App.contracts.vote.deployed().then(function (instance) {
      voteInstance = instance;
      return voteInstance.reqWinner();
    }).then(function (res) {
      console.log(res);
      alert(App.names[res] + "  is the winner ! :)");
    }).catch(function (err) {
      console.log(err.message);
    })
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
