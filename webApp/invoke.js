'use strict';
const serviceConfig = require('./services.json');

async function queryChaincodeStatus(username) {
  console.log('Querying Chaincode status with user: ', username);
  var fabricClient = require('./FabricClient');
  var connection = fabricClient;
  var fabricCAClient;
  await connection.initCredentialStores();
  fabricCAClient = connection.getCertificateAuthority();
  let user = await connection.getUserContext(username, true);
  if(user){
    return true;
  } else {
    return false;
  }
}

/*
Method: 
   queryChaincode
Description: 
   A method to query a chaincode for a given enrollment 
Params:
  - client: A successfully enrolled client
  - fcn: A function in the chaincode to be executed
  - args: Arguments associated with a function
Return: {
   success: <true | false>,
   payload: {
	    registrantID: registrant identity in string,
		registrantSecret: registrate password generated by CA
   },
   message: <string>
}
*/
module.exports.queryChaincode = async (client, fcn, args) => {

	console.log('Successfully got the fabric client for the organization "%s"', serviceConfig.blockchain.org);
	const channel = client.getChannel(serviceConfig.blockchain.channelName);
	if (!channel) {
		const message = util.format('Channel %s was not defined in the connection profile', serviceConfig.blockchain.channelName);
		return 	{
			success: false,
			payload: null,
			message: `Failed: ${message}`
		}
	}

	// send query
	const request = {
		targets: serviceConfig.blockchain.targets, //queryByChaincode allows for multiple targets
		chaincodeId: serviceConfig.blockchain.chaincodeName,
		fcn: fcn,
		args: args
	};

	try {
		let responsePayloads = await channel.queryByChaincode(request);
		if (responsePayloads) {

			let responseMessages = [];
			responsePayloads.forEach((payload)=>{
				const message = `query: ${args}
				 result: ${payload.toString('utf8')}`
				responseMessages.push(message);
			});

			console.log('-------->', responseMessages);

			return{
				success: true,
				payload: {
					responses: responseMessages
				},
				message: `Return Payload {
					responses: ${responseMessages}
				}`
			}
		} else {
			let message = 'Unable to fulfil query';
			console.log(message);
			return {
				success: false,
				payload: null,
				message: `Failed: ${message}`
			}
		}
	} catch (error) {
		const message = 'Failed to query due to error: ' + error.stack ? error.stack : error
		console.log(message);
		return {
			success: false,
			payload: null,
			message: `Failed: ${message}`
		};
	}
}