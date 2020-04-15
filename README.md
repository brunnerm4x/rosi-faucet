# ROSI Faucet

## Simple IOTA Faucet

### Hosted on http://faucet.rosipay.net

### General Information on ROSI:
* https://rosipay.net (General User Information, Links)
* https://github.com/brunnerm4x/rosi (Main Github Repository)

### Faucet Project Description
Simple Faucet intended to simplify trying the ROSI Software for people without IOTA Coins.

This software contains two parts - the wallet-server (same as rosi-walletserver) with slightly changed interface, and the main faucet server. Both servers must be started to make the faucet work. It is strongly advised to CLOSE the port of the wallet-server to the outside with a firewall. Only the faucet port has to bee free from the internet to enable users access the service.


### Dependencies 
* NodeJs (https://nodejs.org) 

### Installation
1. `git clone https://github.com/brunnerm4x/rosi-faucet.git`
2. `cd rosi-faucet/`
3. `npm i`

### Configuration
Main config can be done using npm (examples, see package.json):
* `npm config set rosi-faucet:port 10020`	 (Port of Faucet Webserver)
* `npm config set rosi-faucet:txAmount 5000` (Amount to be sent to each requester)
* `npm config set rosi-faucet:usewalletserver http://localhost:10021`	(Wallet server to be used by faucet-server, theoretically it is possible to use another physical machine for wallet and faucet)
* `npm config set rosi-faucet:wsport 10021` (Setting for walletserver: use given port)

Note: it is possible to start the server with a temporary port with `npm run start --rosi-faucet:port=XXXX`, this also works for other npm configs.

### Run the Servers
* `npm run start-faucet` to start webserver
* `npm run start-wallet` to start wallet-server


