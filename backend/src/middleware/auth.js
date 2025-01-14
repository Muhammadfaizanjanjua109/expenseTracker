const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'your-secret-key');
        req.userId = decoded.userId; 
        next();
    } catch (err) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

module.exports = auth;