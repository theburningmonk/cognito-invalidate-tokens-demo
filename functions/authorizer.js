const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { isTokenInvalidated } = require('../lib/momento');

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID,
});

/**
 * @param {import('aws-lambda').APIGatewayTokenAuthorizerEvent} event 
 */
module.exports.handler = async (event) => {
  const token = event.authorizationToken.split(" ")[1];

  try {
    await verifier.verify(token);

    console.log("Token is valid");

    const isInvalidated = await isTokenInvalidated(token);
    if (isInvalidated) {
      throw new Error("Token is invalidated");
    }
    
    return {    
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*" // make sure you change this for your actual API!
          }
        ]
      }
    };
  } catch (error) {
    console.error("Token is not valid.", error);

    return {
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*"
          }
        ]
      }
    };
  }
};