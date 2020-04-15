/*
 * 	Audio streaming server
 *
 * 	07.01.2020
 *
 * */


const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const IOTA = require('iota.lib.js');

const wc = require('./wallet_comm.js');

let  PORT = 10020;
let TX_AMOUNT = 5000;		// amount of iotas to be sent to every client
const MIN_T_BETWEEN_REQUESTS = 24*60*60*1000;

const MAX_SUB_DIRS = 2;
const DEFAULT_URL = '/html/index.htm';
const REQMIMETYPES = {
    img: 'image/svg+xml',
    img_lossy: 'image/jpeg',
    css: 'text/css',
    js: 'application/javascript',
    html: 'text/html',
    dl: 'application/zip'
};

var iota = new IOTA();
let pastRequestIPs = [];	// [{ip, timestamp}]


//////////////////////   USE ENVIRONMENT VARIABLES IF AVAILABLE		////////////////////////////////
if(typeof process.env.npm_package_config_port != "undefined")
{
	PORT = parseInt(process.env.npm_package_config_port);	
	console.log("Using Environment Variable for PORT, value: " + PORT);
}
if(typeof process.env.npm_package_config_txAmount != "undefined")
{
	TX_AMOUNT = parseInt(process.env.npm_package_config_txAmount);	
	console.log("Using Environment Variable for TX_AMOUNT, value: " + TX_AMOUNT);
}



let sanitizeStringArray = function(arr) {
    try {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr[i].replace(/[^A-Za-z0-9-_]/g, '');
        }

        return arr;
    } catch (e) {
        console.error("Error sanitizing string array: ", e);
        return [];
    }
};

http.createServer(function(req, res) {

    console.log("Requesting url:", req.url);

    if (req.url === '/') {
        req.url = DEFAULT_URL;
        console.log('--> Defaulting to ' + DEFAULT_URL);
    }

    // Request page
    // FILENAMES: only one dot is allowed - to set fileextention
    // NO OTHER DOTS IN FILENAME ALLOWED - Sanitizer will kill it!
    if (req.url.split('/', 3).length == 3) {
        let rawbuffer = '';
        req.on('data', function(data) {
            rawbuffer += data;
        });

        req.on('end', function() 
        {
            try {
				let dispFilename = false;
                let spliturl = req.url.split('/', MAX_SUB_DIRS + 2);
                let levels = spliturl.length;
                let file = sanitizeStringArray(spliturl[levels - 1].split('.')).filter(s => s != '');
                let type = sanitizeStringArray(spliturl.slice(1, 2))[0];
                spliturl = sanitizeStringArray(spliturl.slice(2, levels - 1)).filter(s => s != '');
                
                if(typeof REQMIMETYPES[type] == "undefined")
					throw Error("Invalid Request.");
         

                res.writeHead(200, {
                    'Content-Type': REQMIMETYPES[type]
                });
                res.end(fs.readFileSync('www' + '/' + spliturl.join('/') + '/' + file.join('.')));

            } catch (e) {
                console.error("Error serving slice request:", e);
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.end("An fatal error occurred.");
                return;
            }
        });
    }
    else if(req.url == "/request")
    {
		try {
				let ip = (req.headers['x-forwarded-for']  || req.connection.remoteAddress).split(',')[0];
				console.log("IP Of Client: ", ip);
				
				if(pastRequestIPs.find(addr => addr.ip == ip && addr.timestamp > 
														(Date.now() - MIN_T_BETWEEN_REQUESTS)))
				{
					res.writeHead(403, {
						'Content-Type': 'text/html'
					});
					res.end("This IP has already requested in the last 24 hours.");
					return;
				}
				
				let form = new formidable.IncomingForm();
				form.parse(req, function(err, fields, files) {

					let address = fields['address'];
					console.log("Requested donation to " + address);
					
					if(!iota.valid.isAddress(address))
					{
						res.writeHead(400, {
							'Content-Type': 'text/html'
						});
						res.end("Provided Address Is Invalid.");
						return;
					}
				
					/// GET QUEUE/WALLET TASKS STATUS
					wc._sendRequest({
						request:'getWalletBalanceStatus' 
					}, (r)=> 
					{
						if(typeof r == "undefined" || r.accepted !== true)
						{
							res.writeHead(500, {
								'Content-Type': 'text/html'
							});
							res.end("An internal Error occurred. Please try again later.");
							return;
						}
						if(r.balance < r.taskQueueLength * TX_AMOUNT || r.balance == 0)
						{
							// not enough balance
							res.writeHead(200, {
								'Content-Type': 'text/html'
							});
							res.end("Faucet wallet has insufficient balance. Please try again" + 
								" later when wallet has been refilled. Thanks four your " + 
								"understanding."
							);
							return;
						}
						
						/// REQUEST PAYMENT FROM WALLETSERVER
						wc.sendFunds(address, TX_AMOUNT);
						
						console.log("Requested Funds, QueueLengh:", (r.taskQueueLength + 1));
					
						res.writeHead(200, {
							'Content-Type': 'text/html'
						});
						res.end("Requested deposit. You are No. " + (r.taskQueueLength + 1) + 
							" in Queue.<br><br>\n" + 
							"In the meantime you can inform yourself about ROSI on " + 
							"<a href='http://rosipay.net'>www.rosipay.net</a>.<br><br>\n" + 
							"Thank you for your Interest in this technology!<br><br>\n" +
							"Please file bug-reports and ideas for features on the ROSI " + 
							"Github page!"
						);
						pastRequestIPs.push({ ip: ip, timestamp: Date.now() });
					});
				});
		} catch (e) {
			console.error("Error serving request:", e);
			res.writeHead(200, {
				'Content-Type': 'text/html'
			});
			res.end("An fatal error occurred.");
			return;
		}
    }
    else if(req.url == "/fund")
    {
		try {
						
			/// REQUEST PAYMENT FROM WALLETSERVER
			wc.getNewMonitoredAddress((address) => {
				
				res.writeHead(200, {
					'Content-Type': 'text/html'
				});
				res.end("New Input Address: " + address);
			});
			
		} catch (e) {
			console.error("Error serving request:", e);
			res.writeHead(200, {
				'Content-Type': 'text/html'
			});
			res.end("An fatal error occurred.");
			return;
		}
    }
    else 
    {
        res.writeHead(404, {
            'Content-Type': 'text/html'
        });
        res.end("ERROR 404: Page not found.");
    }

}).listen(PORT);

console.log("Faucet hosting on http://127.0.0.1:" + PORT);
console.log("Input hosting on http://127.0.0.1:" + PORT + "/fund");
