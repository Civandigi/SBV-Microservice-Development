
require('dotenv').config();
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, role: 'admin', email: 'admin@sbv.ch' }, process.env.JWT_SECRET, { expiresIn: '24h' });
console.log(token);

