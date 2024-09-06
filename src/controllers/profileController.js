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

exports.getPerfil = async (req, res) => {
    const userId = 11; 

  try {
    const result = await db.query(`
      SELECT 
        perfil_jugadores.id, 
        perfil_jugadores.avatar_url, 
        usuarios.nombre, 
        usuarios.apellido,
        localidades.nombre AS localidad_nombre,
        provincias.nombre AS provincia_nombre,
        naciones.nombre AS nacion_nombre
      FROM perfil_jugadores
      JOIN usuarios ON usuarios.id = perfil_jugadores.usuario_id
      JOIN localidades ON localidades.id = perfil_jugadores.localidad_id
      JOIN provincias ON provincias.id = localidades.provincia_id
      JOIN naciones ON naciones.id = provincias.nacion_id
      WHERE perfil_jugadores.usuario_id = $1
    `, [userId]);

    if (result.rows.length > 0) {
      // Enviar la información del perfil al frontend
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Perfil no encontrado" });
    }
  } catch (error) {
    console.error("Error fetching profile from database:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

