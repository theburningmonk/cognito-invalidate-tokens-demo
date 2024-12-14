const { invalidateToken } = require('../lib/momento');
const { 
  CognitoIdentityProviderClient, 
  AdminUserGlobalSignOutCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const CognitoClient = new CognitoIdentityProviderClient();

/**
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 */
module.exports.handler = async (event) => {
  const authTokenHeader = event.headers['Authorization'];
  const token = authTokenHeader.split(" ")[1];

  const payloadBase64 = token.split('.')[1];

  // base64 decode the payload
  const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
  const payload = JSON.parse(decodedPayload);
  
  // an access token would have "username" attribute
  // an id token would have "cognito:username" attribute
  const userId = payload.username || payload['cognito:username'];

  console.log('Signing out user', userId);

  CognitoClient.send(new AdminUserGlobalSignOutCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: userId,
  }));

  console.log('User has been signed out globally');

  await invalidateToken(token);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Signed out successfully',
    }),
  }
};