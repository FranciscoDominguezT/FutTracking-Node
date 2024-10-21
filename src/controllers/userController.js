const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = 'futTrackingNode'; // Asegúrate de que sea el mismo secreto que usas en auth

// Función de prueba
exports.test = async (req, res) => {
    return res.status(200).json({ message: 'okeyy' });
};

// Obtener los datos del usuario logueado
exports.getUserData = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log('No se proporcionó token');
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Decodifica el token para obtener el ID
        const userId = decoded.id; // Usa decoded.id para obtener el userId

        // Consulta para obtener el rol del usuario
        const userQuery = 'SELECT rol FROM usuarios WHERE id = $1';
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const userRole = userResult.rows[0].rol;
        let profileQuery;

        // Construcción de la consulta en función del rol del usuario
        if (userRole === 'Jugador') {
            profileQuery = `
                SELECT u.id AS usuario_id, 
                       u.email,
                       pj.usuario_id AS perfil_jugador_id,
                       pj.edad, 
                       pj.altura, 
                       pj.nacion_id, 
                       pj.provincia_id,
                       COALESCE(pj.avatar_url) AS avatar_url
                FROM usuarios u
                LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
                WHERE u.id = $1
            `;
        } else if (userRole === 'Aficionado') {
            profileQuery = `
                SELECT 
                    pa.usuario_id, 
                    pa.avatar_url,
                    u.email,
                    u.nombre, 
                    u.apellido, 
                    u.rol,
                    pa.nacion_id,
                    pa.provincia_id,
                    n.nombre AS nacion_nombre,
                    p.nombre AS provincia_nombre
                    FROM usuarios u
                    LEFT JOIN perfil_aficionados pa ON u.id = pa.usuario_id
                    LEFT JOIN naciones n ON pa.nacion_id = n.id
                    LEFT JOIN provincias p ON pa.provincia_id = p.id
                    WHERE u.id = $1
            `;
        } else if (userRole === 'Reclutador') {
            profileQuery = `
                SELECT u.id AS usuario_id, 
                       u.email,
                       pr.usuario_id AS perfil_reclutador_id,
                       pr.nacion_id, 
                       pr.provincia_id,
                       COALESCE(pr.avatar_url) AS avatar_url
                FROM usuarios u
                LEFT JOIN perfil_reclutadores pr ON u.id = pr.usuario_id
                WHERE u.id = $1
            `;
        } else {
            return res.status(400).json({ message: 'Rol de usuario no válido' });
        }

        // Ejecución de la consulta correcta
        const profileResult = await db.query(profileQuery, [userId]);

        if (profileResult.rows.length === 0) {
            return res.status(404).json({ message: 'Perfil no encontrado' });
        }

        res.json(profileResult.rows[0]);
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
            SELECT u.id, u.nombre, u.apellido, pj.avatar_url,
                loc.nombre AS localidad_nombre, prov.nombre AS provincia_nombre, nac.nombre AS nacion_nombre
            FROM usuarios u
            LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
            LEFT JOIN localidades loc ON pj.localidad_id = loc.id
            LEFT JOIN provincias prov ON pj.provincia_id = prov.id
            LEFT JOIN naciones nac ON prov.nacion_id = nac.id
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
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log('No se proporcionó token');
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Decodifica el token para obtener el ID
        const userId = decoded.id; // Usa decoded.id para obtener el userId
        const { edad, altura, nacion_id, provincia_id, email, avatar_url } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'El correo electrónico no es válido.' });
        }

        const userQuery = 'SELECT rol FROM usuarios WHERE id = $1';
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const userRole = userResult.rows[0].rol;
        let updateProfileQuery;

        if (userRole === 'Jugador') {
            if (isNaN(edad) || edad < 10 || edad > 45) {
                return res.status(400).json({ error: 'La edad debe estar entre 10 y 45 años.' });
            }
            if (isNaN(altura) || altura < 100 || altura > 220) {
                return res.status(400).json({ error: 'La altura debe estar entre 100 y 220 cm.' });
            }
            if (isNaN(nacion_id) || isNaN(provincia_id)) {
                return res.status(400).json({ error: 'El ID de la nación y la provincia deben ser números.' });
            }

            updateProfileQuery = `
            UPDATE perfil_jugadores 
            SET edad = $1, altura = $2, nacion_id = $3, provincia_id = $4
            WHERE usuario_id = $5
            `;

            await db.query(updateProfileQuery, [edad, altura, nacion_id, provincia_id, userId]);
        } else if (userRole === 'Aficionado') {
            updateProfileQuery = `
                UPDATE perfil_aficionados 
                SET nacion_id = $1, provincia_id = $2
                WHERE usuario_id = $3
            `;

            await db.query(updateProfileQuery, [nacion_id, provincia_id, userId]);
        } else if (userRole === 'Reclutador') {
            updateProfileQuery = `
                UPDATE perfil_reclutadores 
                SET nacion_id = $1, provincia_id = $2
                WHERE usuario_id = $3
            `;

            await db.query(updateProfileQuery, [nacion_id, provincia_id, userId]);
        } else {
            return res.status(400).json({ message: 'Rol de usuario no válido' });
        }

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
        const nationsQuery = 'SELECT * FROM naciones';
        const result = await db.query(nationsQuery);
        res.json(result.rows);
        console.log(result.rows);
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
    const userId = req.user.id; // Asegúrate de que esto sea un número

    if (typeof userId !== 'number' || isNaN(userId)) {
        return res.status(400).json({ error: "El ID del usuario debe ser un número válido." });
    }

    try {
        const query = `
        SELECT COALESCE(pj.avatar_url, pa.avatar_url, pr.avatar_url) AS avatar_url
        FROM usuarios u
        LEFT JOIN perfil_jugadores pj ON pj.usuario_id = u.id
        LEFT JOIN perfil_aficionados pa ON pa.usuario_id = u.id
        LEFT JOIN perfil_reclutadores pr ON pr.usuario_id = u.id
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
