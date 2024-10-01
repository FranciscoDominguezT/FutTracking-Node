const db = require('../config/db');

// Función de prueba
exports.test = async (req, res) => {
    return res.status(200).json({ message: 'okeyy' });
};

// Obtener los datos del usuario logueado
exports.getUserData = async (req, res) => {
    const userId = req.user.id;

    try {
        // Consulta SQL para obtener datos del perfil y usuario
        const userQuery = `
            SELECT pj.id, pj.edad, pj.altura, pj.nacion_id, pj.provincia_id,
                   u.id AS usuario_id, u.email,
                   pa.avatar_url
            FROM usuarios u
            LEFT JOIN perfil_jugadores pj ON pj.usuario_id = u.id
            LEFT JOIN perfil_aficionados pa ON pa.usuario_id = u.id
            WHERE u.id = $1
        `;
        const result = await db.query(userQuery, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en getUserData:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Obtener datos de usuario por ID
exports.getUserById = async (req, res) => {
    const id = req.params.id;
    
    // Validar que el ID sea un número
    if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID del usuario debe ser un número.' });
    }

    try {
        const query = `
            SELECT u.id, u.nombre, u.apellido, pj.avatar_url
            FROM usuarios u
            LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
            WHERE u.id = $1
        `;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error en getUserById:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar los datos del usuario logueado
exports.updateUserData = async (req, res) => {
    const userId = req.user.id;
    const { edad, altura, nacion_id, provincia_id, email } = req.body;

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    // Validación de edad (debe ser número)
    if (isNaN(edad) || edad < 10 || edad > 45) {
        return res.status(400).json({ error: 'La edad debe estar entre 10 y 45 años.' });
    }

    // Validación de altura (debe ser número)
    if (isNaN(altura) || altura < 100 || altura > 220) {
        return res.status(400).json({ error: 'La altura debe estar entre 100 y 220 cm.' });
    }

    // Validación de nacion_id y provincia_id (deben ser números)
    if (isNaN(nacion_id) || isNaN(provincia_id)) {
        return res.status(400).json({ error: 'El ID de la nación y la provincia deben ser números.' });
    }

    try {
        // Actualizar perfil de jugador
        const updateProfileQuery = `
            UPDATE perfil_jugadores 
            SET edad = $1, altura = $2, nacion_id = $3, provincia_id = $4
            WHERE usuario_id = $5
        `;
        await db.query(updateProfileQuery, [edad, altura, nacion_id, provincia_id, userId]);

        // Actualizar usuario (email)
        const updateUserQuery = 'UPDATE usuarios SET email = $1 WHERE id = $2';
        await db.query(updateUserQuery, [email, userId]);

        res.status(200).json({ message: 'Datos del usuario actualizados correctamente' });
    } catch (error) {
        console.log('Error al actualizar los datos del usuario:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Obtener todas las naciones
exports.getNaciones = async (req, res) => {
    try {
        const nationsQuery = 'SELECT * FROM naciones ORDER BY nombre';
        const result = await db.query(nationsQuery);

        res.json(result.rows);
    } catch (error) {
        console.error('Error en getNaciones:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Obtener provincias por nación
exports.getProvincias = async (req, res) => {
    const { nacionId } = req.params;

    // Validar que nacionId sea un número
    if (isNaN(nacionId)) {
        return res.status(400).json({ error: 'El ID de la nación debe ser un número.' });
    }

    try {
        const provincesQuery = 'SELECT * FROM provincias WHERE nacion_id = $1 ORDER BY nombre';
        const result = await db.query(provincesQuery, [nacionId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error en getProvincias:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
      const userId = req.user.id; // Obtenido del middleware de autenticación
      const query = `
        SELECT u.id, u.nombre, u.apellido, pj.avatar_url
        FROM usuarios u
        LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
        WHERE u.id = $1
      `;
      const result = await db.query(query, [userId]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error en getCurrentUser:', error.message);
      res.status(500).json({ error: error.message });
    }
  };

  exports.getUserAvatar = async (req, res) => {
    const userId = req.user.id;  // ID del usuario logueado

    try {
        // Consulta para obtener el avatar del perfil, ya sea de un jugador o un aficionado
        const query = `
            SELECT COALESCE(pj.avatar_url, pa.avatar_url) AS avatar_url
            FROM usuarios u
            LEFT JOIN perfil_jugadores pj ON pj.usuario_id = u.id
            LEFT JOIN perfil_aficionados pa ON pa.usuario_id = u.id
            WHERE u.id = $1
        `;
        const result = await db.query(query, [userId]);

        if (result.rows.length === 0 || !result.rows[0].avatar_url) {
            return res.status(404).json({ error: 'Avatar no encontrado' });
        }

        res.json({ avatar_url: result.rows[0].avatar_url });
    } catch (error) {
        console.error('Error al obtener el avatar del usuario:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
