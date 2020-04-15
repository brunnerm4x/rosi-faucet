/*
 * IOTA PAY - Wallet server for faucet
 * 
 *  
 * */
 
var http = require('http');
var wallet = require('rosi-walletserver');

let PORT = 10021;

//////////////////////   USE ENVIRONMENT VARIABLES IF AVAILABLE		////////////////////////////////
if(typeof process.env.npm_package_config_wsport != "undefined")
{
	PORT = parseInt(process.env.npm_package_config_wsport);	
	console.log("Using Environment Variable for PORT, value: " + PORT);
}

// init wallet
wallet.init_wallet();

// Main part
// Create server, allow connecting on port 11000
http.createServer(function (request, response) {
	
	console.log("Incoming connection on port", PORT);
	
	var rawbuffer = '';
	request.on('data', function(data) {
	
		rawbuffer += data;
	});

	request.on('end', function() {
	
		var recbuffer = JSON.parse(rawbuffer);
		
		if(recbuffer.request == 'getMonitoredAddress')
		{
			wallet.getMonitoredAddress().then((address)=>{
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:true, address:address}));
			}).catch(e => {
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:false}));	
			});
		}
		else if(recbuffer.request == 'checkAddressBalance')
		{
			wallet.checkAddressBalance(recbuffer.address).then((balance)=>{
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:true, balance: balance}));
			}).catch(e => {
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:false}));
			});
		}
		else if(recbuffer.request == 'checkAddressBalanceUnconfirmed')
		{
			wallet.checkAddressBalanceUnconfirmed(recbuffer.address).then((balance)=>{
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:true, balance: balance}));
			}).catch(e => {
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:false}));
			});
		}
		else if(recbuffer.request == 'sendTransfer')
		{
			wallet.sendFunds(recbuffer.address, recbuffer.amount).then((txHash)=>
			{
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted: true }));
				// watch txHash confirmation possible!
			}).catch(e => {
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:false}));
			});
		}
		else if(recbuffer.request == 'sendBundles')
		{
			wallet.sendBundles(recbuffer.bundles, recbuffer.reattach).then((txHash)=>
			{
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted: true }));
			}).catch(e => {
				response.writeHead(200, {'Content-Type': 'application/javascript'});
				response.end(JSON.stringify({accepted:false }));
			});
		}
		else if(recbuffer.request == 'getWalletBalanceStatus')
		{
			response.writeHead(200, {'Content-Type': 'application/javascript'});
			response.end(JSON.stringify({accepted: true, 
					balance: wallet.getWalletStatus().balance,
					taskQueueLength: wallet.taskQueueLength()
			}));
		}
		else
		{
			console.warn("Function",recbuffer.request,"not implemented yet!");
			
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.end('UNKNOWN_REQUEST_TYPE');
		}
		
	});
}).listen(PORT);

//////////////////////////////////   INIT 	///////////////////////////////////////////////////////

console.log("Server running, Port", PORT, "open.");























