const jwt = require('jsonwebtoken');
const JWT_SECRET = 'futTrackingNode';

const authenticateToken = (req, res, next) => {
  console.log('authenticateToken llamado');
  console.log('Headers:', req.headers);

  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    console.log('No se proporcionó token');
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(403).json({ message: 'Token inválido' });
  }
};

module.exports = authenticateToken;
