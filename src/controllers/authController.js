const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

// Define GOOGLE_CLIENT_ID directamente en el archivo
const GOOGLE_CLIENT_ID = '128144124506-hnr8v6h0tm41qb93nvhe850bnl66nts0.apps.googleusercontent.com'; // Asegúrate de reemplazar por tu ID real
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

        if (password !== user.contraseña) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

exports.googleLogin = async (req, res) => {
  const { name, email, picture } = req.body;

  try {
    const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await db.query(userQuery, [email]);

    let user;

    if (result.rows.length === 0) {
      const nameParts = name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      const insertUserQuery = `
        INSERT INTO usuarios (nombre, apellido, email, avatar_url, contraseña, rol, auth_id)
        VALUES ($1, $2, $3, $4, NULL, 'Aficionado', $5) RETURNING id
      `;
      const newUser = await db.query(insertUserQuery, [firstName, lastName, email, picture, 'google-auth-id']);

      const userId = newUser.rows[0].id;

      const insertProfileQuery = `
        INSERT INTO perfil_aficionados (usuario_id, avatar_url)
        VALUES ($1, $2)
      `;
      await db.query(insertProfileQuery, [userId, picture]);

      user = { id: userId, email: email, nombre: firstName, apellido: lastName, rol: 'Aficionado' };
    } else {
      user = result.rows[0];
      const updateUserQuery = `
        UPDATE usuarios
        SET avatar_url = $1
        WHERE id = $2
      `;
      await db.query(updateUserQuery, [picture, user.id]);
    }

    const tokenJWT = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token: tokenJWT,
      user: {
        id: user.id,
        name: name,
        email: user.email,
        picture: picture,
        rol: user.rol || 'Aficionado'
      }
    });
  } catch (error) {
    console.error('Error en el login con Google:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};