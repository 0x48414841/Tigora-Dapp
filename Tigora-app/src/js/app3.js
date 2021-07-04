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
    "buyTickets": { 'id': 1, 'text': "Tickets are now for sale" },
    "endEvent": { 'id': 2, 'text': "Venue is over; no more transancations can occur" },
  },
  init: function () {

    val = null;
    //if (localStorage.getItem('password')) {
    //  App.scramble = localStorage.getItem('password');
    //}
   // else App.scramble = App.randomString();
    //alert(App.scramble);
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
      web3.eth.getCoinbase(function (err, acnt) {
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
      a = [1, 2];
      $.getJSON('../tickets.json', function (data, a) {
        //sort data 
        if (data.length >= 2) data.sort(customSort('primary', 'group', 'seat'));
        var proposalsRow = $('#proposalsRow');
        var proposalTemplate1 = $('#proposalTemplate1');
        var proposalTemplate2 = $('#proposalTemplate2');



        for (i = 0; i < data.length; i++) {
          var newDiv = document.createElement('div');
          newDiv.className = 'ticket_' + i.toString();
          newDiv.setAttribute('id', 'ticket_' + data[i].id);

          if (App.currentAccount == data[i].owner/*data[i].primary == '1'*/ /*&& App.currentAccount == data[i].owner*/) {
            // color = (parseInt(data[i].id) % 2 == 0) ? '#ffdb58' : '#7CB9E8';
            color = 'coral';
            newDiv.innerHTML =
              `<div class="col-sm-8 col-md-4 ">
                <div class="panel panel-default panel-proposal">
                  <div class="panel-heading">
                    <h3 class="panel-title" style="text-align:center"> <strong> <div class=""> Class:  `
              + data[i].group.toString() + ` </div> <div class="">Seat: ` + data[i].seat + ` </div> </strong> </h3>
                  </div>
                  <div class="panel-body" style="background: ` + color + `">
                    <br />   <div class="w3-center">` + data[i].price + ` ethers </div> <br>
                    <div class="col-md-12 text-center">
                      <button class="btn btn-default btn-offer" id="` + data[i].id + ` "onclick="return App.handleOffer(this.id)" type="button" data-id="0">Offer Ticket</button>
                      <button class="btn btn-default btn-unoffer" id="` + data[i].id + ` "onclick="return App.handleUnoffer(this.id)" type="button" data-id="0"> Unoffer Ticket</button>
                      <button class="btn btn-default btn-refund" id="` + data[i].id + ` "onclick="return App.handleRefund(this.id)" type="button" data-id="0">Request Refund</button>
                      <button class="btn btn-default btn-use" id="` + data[i].id + ` "onclick="return App.handleUse(this.id)" type="button" data-id="0">Use Ticket </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
            proposalTemplate1.append(newDiv);
            App.pCount += 1;
          }
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
    // $(document).on('click', '.btn-offer', App.handleOffer);
    // $(document).on('click', '.btn-unoffer', App.handleUnoffer);
    // $(document).on('click', '.btn-refund', App.handleRefund);
    // $(document).on('click', '.btn-use', App.handleUse);
  },

  handleUse: function (id) {
    $.post('/ticketInfo',
      {
        id: id
      },
      function (data, status) {
        if (status == 'success') {
          var hash = data.hash;
          App.contracts.vote.deployed().then(function (instance) {
            return instance.useTicket(hash);
          }).then(function (result) {
            if (result.receipt.status) {
              $.post('/changePrimary',
                {
                  id: id,
                  caller: 5
                },
                function (data, status) {
                  if (status) {
                     alert('Ticket successfully used');
                  }
                })
            }
            else alert('Error try again');
          })
        }
      })
  },

  handleRefund: function (id) {
    $.post('/ticketInfo',
      {
        id: id
      },
      function (data, status) {
        if (status == 'success') {
          var hash = data.hash;
          App.contracts.vote.deployed().then(function (instance) {
            return instance.requestRefund(hash);
          }).then(function (result) {
            if (result.receipt.status) {
              alert('Refund Successful');
            }
            else alert('Error try again');
          })
        }
      })
  },

  handleUnoffer: function (id) {
    $.post('/ticketInfo',
      {
        id: id
      },
      function (data, status) {
        if (status == 'success') {
          var hash = data.hash;
          App.contracts.vote.deployed().then(function (instance) {
            return instance.unOfferTicket(hash);
          }).then(function (result) {
            if (result.receipt.status) {
              $.post('/changePrimary',
                {
                  id: id,
                  caller: 0,
                  owner: App.currentAccount,
                },
                function (data, status) {
                  alert('Ticket successfully unoffered');
                })
            }
            else alert('Error try again');
          })
        }
      })
  },


  handleOffer: function (id) {

    $.post('/ticketInfo',
      {
        id: id
      },
      function (data, status) {
        if (status == 'success') {
          group = web3.utils.fromAscii(data.group);

          //priceHash = data.priceHash;
          hash = data.hash;

          var offerPrice = prompt("Enter the ticket price in ethers", 0);
          offerPrice = web3.utils.toWei(offerPrice);
          //offerPrice = web3.utils.fromWei(offerPrice, 'ether')
          
          //alert (offerPrice);
          console.log(hash, offerPrice);

          App.contracts.vote.deployed().then(function (instance) {
            return instance.offerTicket(hash, offerPrice);
          }).then(function (result) {
            if (result.receipt.status) {
              $.post('/changePrimary',
                {
                  id: id,
                  caller: 3, // ticket goes back on market
                  offerPrice: web3.utils.fromWei(offerPrice, 'ether'),
                },
                function (data, status) {
                  alert('Ticket successfully offered');
                })
            }
            else alert('Error try again');
          })
        }
      })
  }
};


$(function () {
  $(window).load(function () {
    App.init();
  });
});

