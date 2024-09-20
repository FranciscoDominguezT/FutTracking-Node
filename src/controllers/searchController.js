const db = require('../config/db');

exports.searchUsers = async (req, res) => {
    const { term } = req.query;
    try {
        let query = `
            SELECT 
                u.id, u.nombre, u.apellido, 
                COALESCE(pj.avatar_url, pa.avatar_url) as avatar_url,
                (SELECT COUNT(*) FROM seguidores WHERE usuarioid = u.id) as seguidores,
                (SELECT COUNT(*) FROM videos WHERE usuarioid = u.id) as videos
            FROM 
                usuarios u
            LEFT JOIN 
                perfil_jugadores pj ON u.id = pj.usuario_id
            LEFT JOIN 
                perfil_aficionados pa ON u.id = pa.usuario_id
        `;

        // Si se proporcionó un término de búsqueda, agregar la condición WHERE
        if (term) {
            query += ` WHERE u.nombre ILIKE $1 OR u.apellido ILIKE $1 LIMIT 100`;
            const result = await db.query(query, [`%${term}%`]);
            res.json(result.rows);
        } else {
            const result = await db.query(query); // Sin el WHERE, trae todos los usuarios
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};