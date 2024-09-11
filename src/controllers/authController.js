const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = 'futTrackingNode';

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
        const result = await db.query(userQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        // Verificar la contraseña en texto plano
        if (password !== user.contraseña) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear un token JWT
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const { name, email, picture } = ticket.getPayload();
  
      // Verificar si el usuario ya existe
      const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
      const result = await db.query(userQuery, [email]);
  
      if (result.rows.length === 0) {
        // Insertar nuevo usuario
        const insertUserQuery = `
          INSERT INTO usuarios (nombre, apellido, email, avatar_url, contraseña, rol)
          VALUES ($1, $2, $3, $4, NULL, 'Jugador') RETURNING id
        `;
        const newUser = await db.query(insertUserQuery, [name.split(" ")[0], name.split(" ")[1], email, picture]);

        const userId = newUser.rows[0].id;
        const insertProfileQuery = `
          INSERT INTO perfil_jugadores (usuario_id, avatar_url)
          VALUES ($1, $2)
        `;
        await db.query(insertProfileQuery, [userId, picture]);
      }
  
      const user = result.rows.length ? result.rows[0] : newUser.rows[0];
      const tokenJWT = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  
      res.status(200).json({ token: tokenJWT });
    } catch (error) {
      console.error('Error en el login con Google:', error.message);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  };