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
  const { name, email, picture } = req.body;

  try {
    // Verificar si el usuario ya existe
    const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await db.query(userQuery, [email]);

    let user;

    if (result.rows.length === 0) {
      // Insertar nuevo usuario, sin la columna avatar_url
      const insertUserQuery = `
        INSERT INTO usuarios (nombre, apellido, email, contraseña, rol)
        VALUES ($1, $2, $3, NULL, 'Aficionado') RETURNING id
      `;
      const nameParts = name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      const newUser = await db.query(insertUserQuery, [firstName, lastName, email]);

      const userId = newUser.rows[0].id;

      const insertProfileQuery = `
        INSERT INTO perfil_aficionados (usuario_id, avatar_url)
        VALUES ($1, $2)
      `;
      await db.query(insertProfileQuery, [userId, picture]);

      user = newUser.rows[0];
    } else {
      user = result.rows[0];
      // Actualizar el perfil del aficionado
      const updateProfileQuery = `
        INSERT INTO perfil_aficionados (usuario_id, avatar_url)
        VALUES ($1, $2)
        ON CONFLICT (usuario_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
      `;
      await db.query(updateProfileQuery, [user.id, picture]);
    }

    const tokenJWT = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token: tokenJWT });
  } catch (error) {
    console.error('Error en el login con Google:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

exports.register = async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  try {
    // Verificar si el usuario ya existe
    const userExistsQuery = 'SELECT * FROM usuarios WHERE email = $1';
    const userExists = await db.query(userExistsQuery, [email]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Insertar nuevo usuario
    const insertUserQuery = `
      INSERT INTO usuarios (nombre, apellido, email, contraseña, rol)
      VALUES ($1, $2, $3, $4, 'Aficionado')
      RETURNING id, email
    `;
    const newUser = await db.query(insertUserQuery, [nombre, apellido, email, password]);

    const userId = newUser.rows[0].id;

    // Insertar perfil de aficionado
    const insertProfileQuery = `
      INSERT INTO perfil_aficionados (usuario_id, avatar_url)
      VALUES ($1, $2)
    `;
    const defaultAvatarUrl = "https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png";
    await db.query(insertProfileQuery, [userId, defaultAvatarUrl]);

    // Crear token JWT
    const token = jwt.sign(
      { id: userId, email: newUser.rows[0].email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente', token });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};