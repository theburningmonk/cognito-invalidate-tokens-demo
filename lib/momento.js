const { 
  CacheClient, 
  Configurations, 
  CredentialProvider,
  CacheSetResponse,
  CacheGetResponse,
} = require('@gomomento/sdk');

let cacheClient;

/**
 * @returns {Promise<CacheClient>}
 */
async function initClient() {
  if (!cacheClient) {
    console.log('Initializing Momento cache client');
    
    cacheClient = await CacheClient.create({
      configuration: Configurations.Lambda.latest(),
      credentialProvider: CredentialProvider.fromString(process.env.MOMENTO_API_KEY),
      defaultTtlSeconds: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('Initialized Momento cache client');
  }

  return cacheClient;
}

async function isTokenInvalidated(token) {
  console.log('Checking if token is invalidated');

  const cacheClient = await initClient();
  const response = await cacheClient.get(
    process.env.MOMENTO_CACHE_NAME,
    `invalidated#${token}`
  );

  switch (response.type) {
    case CacheGetResponse.Miss:
      console.log('Token is not invalidated');
      return false;
    case CacheGetResponse.Hit:
      console.log(`Token was invalidated at ${response.valueString()}`);
      return true;
    case CacheGetResponse.Error:
      console.error('Error checking if token is invalidated', response.innerException());
      throw new Error('Error checking if token is invalidated');
  }
}

async function invalidateToken(token) {
  console.log('Invalidating token');

  const cacheClient = await initClient();
  const response = await cacheClient.set(
    process.env.MOMENTO_CACHE_NAME, 
    `invalidated#${token}`,
    new Date().toJSON(),
    { 
      ttl: 7 * 24 * 60 * 60, // 7 days, must be greater than the validity of the token
    }
  );

  switch (response.type) {
    case CacheSetResponse.Success:
      console.log('Token invalidated');
      return;
    case CacheSetResponse.Error:
      console.error('Error invalidating token', response.innerException());
      throw new Error('Error invalidating token');
  }
}

module.exports = {
  isTokenInvalidated,
  invalidateToken,
}