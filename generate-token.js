
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'dev-secret-key-change-in-production', { expiresIn: '24h' });
console.log('Test-Token:', token);

