exports.creds = {
    clientID: 'e3f2e949-5689-47d4-be07-e710a2ca8504',
    clientSecret: 'qqknyZ0ISKq5gAVnUTO0xaH/lK+rx8idb781aeWNauU=',
    audience: 'https://chadraylab.onmicrosoft.com/node-aad',    
    redirectUrl: 'https://localhost/auth/openid/return',
    // you cannot have users from multiple tenants sign in to your server unless you use the common endpoint
    // example: https://login.microsoftonline.com/common/.well-known/openid-configuration
    identityMetadata: 'https://login.microsoftonline.com/chadraylab.onmicrosoft.com/.well-known/openid-configuration',
    validateIssuer: true, // if you have validation on, you cannot have users from multiple tenants sign in to your server
    passReqToCallback: false,
    responseType: 'id_token', // for login only flows use id_token. For accessing resources use `id_token code
    responseMode: 'query', // For login only flows we should have token passed back to us in a POST
    loggingLevel: 'info', // valid are 'info', 'warn', 'error'. Error always goes to stderr in Unix.
    scope: ['email', 'profile'] // additional scopes you may wish to pass
};