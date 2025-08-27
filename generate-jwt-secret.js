// Generate a secure JWT secret
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');

console.log('===========================================');
console.log('Generated JWT Secret (copy this):');
console.log('===========================================');
console.log(secret);
console.log('===========================================');
console.log(`Length: ${secret.length} characters`);
console.log('');
console.log('Add this to your .env file as:');
console.log(`JWT_SECRET=${secret}`);
console.log('===========================================');