const jwt = require('jsonwebtoken');
const JWT_SECRET = 'futTrackingNode';

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Acceso denegado. No hay token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token no válido' });
    req.user = user; // Guardar la información del usuario en la request
    console.log('req.user', req.user);
    next();
  });
};

module.exports = authenticateToken;
