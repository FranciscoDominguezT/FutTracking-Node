const db = require('../config/db');

exports.test = async (req, res) => {
    return res.status(200).json({ message: 'okeyy' });
};

exports.getUserData = async (req, res) => {
    const userId = 11;

    try {
        const userQuery = `
            SELECT pj.id, pj.edad, pj.altura, pj.nacion_id, pj.provincia_id,
                   u.id AS usuario_id, u.email
            FROM perfil_jugadores pj
            JOIN usuarios u ON pj.usuario_id = u.id
            WHERE pj.usuario_id = $1
        `;
        const result = await db.query(userQuery, [userId]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en getUserData:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.updateUserData = async (req, res) => {
    const userId = 11;
    const { edad, altura, nacion_id, provincia_id, email } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    if (isNaN(edad) || edad < 10 || edad > 45) {
        return res.status(400).json({ error: 'La edad debe estar entre 10 y 45 años.' });
    }

    if (isNaN(altura) || altura < 100 || altura > 220) {
        return res.status(400).json({ error: 'La altura debe estar entre 100 y 220 cm.' });
    }

    try {
        const updateProfileQuery = `
            UPDATE perfil_jugadores 
            SET edad = $1, altura = $2, nacion_id = $3, provincia_id = $4
            WHERE usuario_id = $5
        `;
        await db.query(updateProfileQuery, [edad, altura, nacion_id, provincia_id, userId]);

        const updateUserQuery = 'UPDATE usuarios SET email = $1 WHERE id = $2';
        await db.query(updateUserQuery, [email, userId]);

        res.status(200).json({ message: 'User data updated successfully' });
    } catch (error) {
        console.log('Error al actualizar los datos del usuario:', error.message);
        res.status(500).json({ error: error.message });
    }
};

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

exports.getProvincias = async (req, res) => {
    const { nacionId } = req.params;
    try {
        const provincesQuery = 'SELECT * FROM provincias WHERE nacion_id = $1 ORDER BY nombre';
        const result = await db.query(provincesQuery, [nacionId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error en getProvincias:', error.message);
        res.status(500).json({ error: error.message });
    }
};
