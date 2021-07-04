App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'https://ropsten.infura.io/v3/', //include your own endpoint
  chairPerson: null,
  currentAccount: null,
  scramble: "",
  stages: {
    "makeTickets": { 'id': 0, 'text': "Making Tickets" },
    "buyTickets": { 'id': 1, 'text':  "Tickets are now for sale" },
    "endEvent": { 'id': 2, 'text': "Venue is over; no more transancations can occur" },
    "cancelVenue": { 'id': 3, 'text': "Venue has been canceled; refund your tickets" }
  },
  init: function () {

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

  initContract: function () {
    $.getJSON('Tigora.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var voteArtifact = data;
      App.contracts.vote = TruffleContract(voteArtifact);
      //App.contracts.vote = new web3.eth.Contract(voteArtifact);
      App.contracts.mycontract = data;
      // Set the provider for our contract
      App.contracts.vote.setProvider(App.web3Provider);
      //App.currentAccount = web3.eth.coinbase;
      web3.eth.getCoinbase(function(err, acnt) {
        App.currentAccount = acnt;
        console.log(acnt);
      });
      jQuery('#current_account').text(App.currentAccount);
      App.getCurrentPhase();
      App.getChairperson();

    });
    return App.bindEvents();
  },
  getCurrentPhase: function () {
    App.contracts.vote.deployed().then(function (instance) {
      return instance.state(); // instance is the smart contract
    }).then(function (result) {
      App.currentPhase = result.c[0];
      var notificationText = App.stages[App.currentPhase];
      console.log(App.currentPhase);
      console.log(notificationText);
      $('#phase-notification-text').text(notificationText);
      console.log("Phase set");
    })
  },
  getChairperson: function () {
    App.contracts.vote.deployed().then(function (instance) {
      return instance.eventDirector(); //beneficiary is the public variable
    }).then(function (result) {
      App.chairPerson = result;
      console.log(App.currentAccount, App.chairPerson);
      if (App.currentAccount == App.chairPerson) {
        console.log('owner2');
        // $(".chairperson").css("display", "inline");
        //$(".img-chairperson").css("width", "100%");
        $(".normalUser").remove();
      } else {
        $(".director").remove();
      }
    })
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

  bindEvents: function () {
    $(document).on('click', '.btn-makeTickets', App.handleMakeTickets);
    $(document).on('click', '.btn-setPassword', App.handleSetPassword);
    $(document).on('click', '.btn-maxPrice', App.handleSetPrice);
    $(document).on('click', '.btn-maxChangePhase', App.handleChangeState);
    $(document).on('click', '.btn-cancelVenue', App.handleCancelVenue);
    $(document).on('click', '.btn-maxNumTickets', App.handleSetLimit);
    $(document).on('click', '.btn-clear', App.handleClear);
  },

  handleClear: function() {
    $.post(
      "/clearTickets",
      { },
      function (data, status) {
        if (status == "success") {
          alert ('Tickets were cleared');
        }
      }
    );
  },

  handleSetLimit: function() {
    var limit = document.getElementById('maxNumTickets').value;

  App.contracts.vote.deployed().then(function (instance) { //TODO check in remix
      return instance.setMaxTicketLimit(limit);
    }).then(function (result) {
      if (result.receipt.status) {
        alert ('Ticket limit successfully set');
      }
      else alert('Error try again');
    })
  },

  handleCancelVenue: function() {
    if (App.currentPhase >= 2) {
      alert("Event has ended; can't cancel venue");
      return;
    }
    App.contracts.vote.deployed().then(function (instance) {
      return instance.cancelVenue();
    }).then(function (result) {
      console.log(result);
      if (result) {
        if (parseInt(result.receipt.status) == 1) {
          if (result.logs.length > 0) {
            App.currentPhase = 3; 
            alert('New Phase: ' + result.logs[0].event +'\n'   + App.stages['cancelVenue'].text);
          }
        }
      }
    })
    .catch(function (err) {
      //alert(err);
    });
  },

  handleChangeState: function() {
    if (App.currentPhase >= 2) {
      alert('Event has ended; please start a new contract');
      return;
    }
    App.contracts.vote.deployed().then(function (instance) {
      return instance.changePhase();
    }).then(function (result) {
      console.log(result);
      if (result) {
        if (parseInt(result.receipt.status) == 1) {
          if (result.logs.length > 0) {
            App.currentPhase ++;
            if (App.currentPhase == 1) {
              alert('New Phase: ' + result.logs[0].event +'\n'   + App.stages['buyTickets'].text);
            }
            else if (App.currentPhase == 2) {
              alert('New Phase: ' + result.logs[0].event +'\n'  + App.stages['endEvent'].text);
            }
            
          }
          else {
            alert("AuctionEnded");
          }
        }
      }
    })
    .catch(function (err) {
      alert(err);
    });
  },

  

  handleSetPrice: function() {
    var group = document.getElementById('ticketGroup').value;
    var basePrice = document.getElementById('basePrice2').value;
    var maxPrice = document.getElementById('maxPrice2').value;

   // group = web3.eth.abi.encodeParameter('uint256', web3.utils.fromAscii(group));
    //maxPrice = web3.eth.abi.encodeParameter('uint256', web3.utils.toWei(maxPrice, 'ether'));
    group = web3.utils.fromAscii(group);
    //maxPrice = web3.utils.toWei(maxPrice, 'ether');
    console.log(group);
    console.log(maxPrice);

    basePrice = web3.utils.toWei(basePrice);
    maxPrice = web3.utils.toWei(maxPrice);

    App.contracts.vote.deployed().then(function (instance) {
      return instance.setPrices(group, basePrice, maxPrice);
    }).then(function (result) {
      if (result.receipt.status) {
        alert ('Max price successfully set');
      }
      else alert('Error try again');
    })
  },

  handleSetPassword: function () {
    var password = document.getElementById('pass2').value;

    //password = web3.eth.abi.encodeParameter('bytes32', password);
    password = web3.utils.fromAscii(password);
    $.post(
      "/setPassword",
      {
        password: password
      },
      function (data, status) {
        if (status == "success") {
          //Reduces the seats value in the table

          if (App.currentPhase == 0) {
    
            App.contracts.vote.deployed().then(function (instance) {
              return instance.setPassword(password)
            }).then(function (result) {
              if (result.receipt.status) {
                alert ('password successfully set');
              }
            })
          } else {
            alert (data);
          }
          //alert(data);
        }
        else alert('nop');
      }
    );
  },

  handleMakeTickets: function () {
    var ticketClass = document.getElementById('ticketClass').value;
    var ticketRow = document.getElementById('ticketRow').value;
    var ticketsPerRow = document.getElementById('ticketsPerRow').value;
    var basePrice = document.getElementById('basePrice').value;
    var password = document.getElementById('pass').value;
    //var maxPrice = document.getElementById('maxPrice').value;

    ticketClass = ticketClass[0]
    if (! ticketClass.match(/[A-Z]/))  {
      alert('Enter a group from [A-Z]');
      return;
    }
    
    $.post(
      "/makeTickets",
      {
        ticketClass: ticketClass,
        basePrice: basePrice,
        ticketRow: ticketRow,
        ticketsPerRow: ticketsPerRow,
        //password: web3.eth.abi.encodeParameter('uint256', password)
        password: web3.utils.fromAscii(password)
      },
      function (data, status) {
        if (status == "success") {
         /* App.contracts.vote.deployed().then(function (instance) {
            basePrice = web3.utils.toWei(basePrice);
            maxPrice = web3.utils.toWei(maxPrice);

            return instance.setPrices(web3.utils.fromAscii(ticketClass), basePrice, maxPrice);
          }).then(function (result) {
            if (result.receipt.status) {
              alert(data);
            }
          }) */
          alert(data);
        }
        else alert('Failed, please try again');
      }
    );
  },

};


$(function () {
  $(window).load(function () {
    App.init();
  });
});

