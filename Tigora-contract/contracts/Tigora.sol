pragma solidity >=0.4.22 <=0.6.2;
//pragma experimental ABIEncoderV2;

    contract Tigora {
        
        address public eventDirector;
        enum Phase { makeTickets, sellTickets, endVenue }
        Phase public state;
        uint maxTicketPerOwner;
        uint public isCanceled;    
        bytes32 scramble;
        
        struct Ticket {
            address payable ticketOwner;
            uint price;         
            //bitVectorOfDetails stores the status and ticket group in one 256-bit variable
            uint bitVectorOfDetails;
        }
        
        struct ticketOwnerDetails {
            uint numTicketsOwned;
        }
        
        struct TicketPrices {
            uint basePrice;
            uint maxPrice;
        }
       
        event BuyTickets();
        event EndVenue();
        event CancelVenue();
        
        /* 
            -Will store the base price and max price of a ticket per group
            -The length of the map will be very small in practice
        */
        mapping (uint => TicketPrices) ticketPrices;
        
        /* 
            -Maps ticket id to ticket metadata
        */
        mapping (bytes32 => Ticket) tickets;
        
        /*  stores information about each ticket-owner  */
        mapping (address => ticketOwnerDetails) details;
        
        
        modifier onlyDirector {
            require (msg.sender == eventDirector);
            _;
        }
        
        modifier onlyTicketHolder(bytes32 ticketID) {
            require (tickets[ticketID].ticketOwner == msg.sender);
            _;
        }
        modifier validPhase (Phase reqPhase) {
            require (state == reqPhase);
            _;
        }
        
        modifier validPrice(bytes32 ticketID, uint askingPrice) {
            uint group = extractGroup(tickets[ticketID].bitVectorOfDetails);
            uint maxPrice = ticketPrices[group].maxPrice;
            require (askingPrice <= maxPrice);
            _;
        }
        
        modifier notMajorityTicketHolder() {
            require (details[msg.sender].numTicketsOwned + 1 <= maxTicketPerOwner);
            _;
        }
        
        constructor () public   { 
            eventDirector = msg.sender;
            state = Phase.makeTickets;
            isCanceled = 0;
            maxTicketPerOwner = 10;
            scramble = 0x4265260000000000000000000000000000000000000000000000000000000000;
        }

        function setPassword(bytes32 _scramble) public onlyDirector validPhase(Phase.makeTickets) {
            scramble = _scramble;
        }
        
        function setMaxTicketLimit(uint ticketLimit) onlyDirector public {
            maxTicketPerOwner = ticketLimit;
        }

        function setPrices(uint256 ticketGroup, uint basePrice, uint maxPrice) public onlyDirector {
            ticketPrices[ticketGroup].basePrice = basePrice;
            ticketPrices[ticketGroup].maxPrice = maxPrice;
        }
        
        function changePhase () public onlyDirector {
            require (uint(state) + 1 <= uint(Phase.endVenue));
            uint nextPhase = uint(state) + 1;
            state = Phase(nextPhase);
       
            if (uint(state) == 1) emit BuyTickets();
            if (uint(state) == 2) emit EndVenue();
        }
        
        function cancelVenue() public onlyDirector {
            state = Phase.endVenue;
            isCanceled = 1;
            emit CancelVenue();
        }
        
        function requestRefund(bytes32 ticketID) public onlyTicketHolder(ticketID) {
            require (isCanceled == 1);
            require (extractStatus(tickets[ticketID].bitVectorOfDetails) != 3);
            uint group = extractGroup(tickets[ticketID].bitVectorOfDetails);
            uint amount = ticketPrices[group].basePrice;
            msg.sender.transfer(amount);
            tickets[ticketID].bitVectorOfDetails |= 3;
        }
        
       
        function buyTicketPrimary(uint id, bytes32 ticketHash, uint ticketGroup, bytes32 ticketGroupHash) 
            public validPhase(Phase.sellTickets) notMajorityTicketHolder payable {
            require (tickets[ticketHash].ticketOwner == address(0));
            require (ticketHash == keccak256(abi.encodePacked(id, scramble))); // verify ticket
            require (ticketGroupHash == keccak256(abi.encodePacked(ticketGroup, scramble))); //verify ticket's group
            
            uint ticketPrice = ticketPrices[ticketGroup].basePrice;
            if (msg.value < ticketPrice) {
                 revert ();
            }
            if (msg.value != ticketPrice) {
               uint diff = msg.value - ticketPrice;
               msg.sender.transfer(diff); 
            }
            
            //register Ticket
            Ticket memory newTicket  = Ticket({
                    ticketOwner:   msg.sender,
                    price:         ticketPrice,
                    bitVectorOfDetails: (ticketGroup << 2) + 1 
            }); 
            
            tickets[ticketHash] = newTicket;
            details[msg.sender].numTicketsOwned += 1;
        }
        
        function buyTicketSecondary(bytes32 ticketID) public validPhase(Phase.sellTickets) notMajorityTicketHolder payable {
            require (msg.sender != tickets[ticketID].ticketOwner);
            require (tickets[ticketID].ticketOwner != address(0));
            require (extractStatus(tickets[ticketID].bitVectorOfDetails) == 0); 
            
            
            uint ticketPrice = tickets[ticketID].price;
            if (msg.value < ticketPrice) {
                 revert ();
            }
            
            if (msg.value != ticketPrice) {
               uint diff = msg.value - ticketPrice;
               msg.sender.transfer(diff); 
            }
             
             address payable prev = tickets[ticketID].ticketOwner;
             prev.transfer(ticketPrice);
             
             tickets[ticketID].ticketOwner = msg.sender;
             tickets[ticketID].bitVectorOfDetails ^= 1;
             
             details[prev].numTicketsOwned -= 1;
             assert (details[prev].numTicketsOwned >= 0);
             
             details[msg.sender].numTicketsOwned += 1;
        }
        
        function offerTicket (bytes32 ticketID, uint askingPrice) public validPhase(Phase.sellTickets) validPrice(ticketID, askingPrice) onlyTicketHolder(ticketID) {
           require (extractStatus(tickets[ticketID].bitVectorOfDetails) == 1);
           tickets[ticketID].bitVectorOfDetails ^= 1;
           tickets[ticketID].price = askingPrice;
        } 
        
        function unOfferTicket (bytes32 ticketID) public validPhase(Phase.sellTickets) onlyTicketHolder(ticketID)  {
           require (extractStatus(tickets[ticketID].bitVectorOfDetails) == 0);
           tickets[ticketID].bitVectorOfDetails ^= 1; 
        } 
        
        function useTicket (bytes32 ticketID) onlyTicketHolder(ticketID) public {
            require (extractStatus(tickets[ticketID].bitVectorOfDetails) != 3);
            tickets[ticketID].bitVectorOfDetails |= 3;
        }
        
        function extractStatus(uint bitVector) pure internal returns(uint) {
            //staus will be in the first 2 two bits 
            uint result = 0;
            for (int i = 0; i < 2; i ++) {
                result += (bitVector & 1) << i;
                bitVector = bitVector >> 1;
            }
            return result;
        }
        function extractGroup(uint bitVector) pure internal returns (uint){
            //group will be in bits [2,10]
            uint result = 0;
            bitVector = bitVector >> 2;
            for (int i = 0; i <= 12; i ++) {
                result += (bitVector & 1) << i;
                bitVector = bitVector >> 1;
            }
            return result;
        }
    }