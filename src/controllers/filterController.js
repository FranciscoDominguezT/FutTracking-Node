const db = require('../config/db');

exports.getAllPlayers = async (req, res) => {
    try {
      const query = `
        SELECT 
          u.id AS usuario_id,
          pj.*, 
          u.nombre, 
          u.apellido, 
          e.nombre as equipo_nombre,
          n.nombre as nacion_nombre
        FROM 
          usuarios u
        JOIN 
          perfil_jugadores pj ON u.id = pj.usuario_id
        JOIN 
          equipos e ON pj.equipo_id = e.id
        JOIN 
          naciones n ON pj.nacion_id = n.id
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  exports.getAllClubs = async (req, res) => {
    try {
      const query = 'SELECT * FROM equipos';
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };