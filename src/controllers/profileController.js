const db = require('../config/db');

exports.getProfileInfo = async (req, res) => {
    const userId = 11;

    try {
        const profileQuery = `
            SELECT pj.id, pj.avatar_url, pj.edad, pj.altura, pj.peso,
                   u.id AS usuario_id, u.nombre, u.apellido, u.rol,
                   n.nombre AS nacion_nombre, p.nombre AS provincia_nombre
            FROM perfil_jugadores pj
            JOIN usuarios u ON pj.usuario_id = u.id
            JOIN naciones n ON pj.nacion_id = n.id
            JOIN provincias p ON pj.provincia_id = p.id
            WHERE pj.usuario_id = $1
        `;
        const profileResult = await db.query(profileQuery, [userId]);
        const profileData = profileResult.rows[0];

        const followersQuery = 'SELECT COUNT(*) FROM seguidores WHERE usuarioid = $1';
        const followersResult = await db.query(followersQuery, [userId]);
        const followersCount = parseInt(followersResult.rows[0].count, 10);

        res.json({
            profile: profileData,
            followersCount: followersCount
        });
    } catch (error) {
        console.log('Error al obtener datos del perfil:', error.message);
        res.status(500).json({ error: error.message });
    }
};
