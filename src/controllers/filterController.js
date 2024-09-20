const db = require('../config/db');

exports.getAllPlayers = async (req, res) => {
    try {
        const query = `
          SELECT 
              u.id AS usuario_id,
              pj.*, 
              u.nombre, 
              u.apellido, 
              e.nombre AS equipo_nombre,
              n.nombre AS nacion_nombre,
              l.nombre AS liga_nombre,
              pos.nombre AS posicion_nombre
          FROM 
              usuarios u
          JOIN 
              perfil_jugadores pj ON u.id = pj.usuario_id
          JOIN 
              equipos e ON pj.equipo_id = e.id
          JOIN 
              naciones n ON pj.nacion_id = n.id
          JOIN 
              ligas l ON pj.liga_id = l.id -- Ahora se referencia a liga_id en perfil_jugadores
          JOIN 
              posiciones pos ON pj.posicion_id = pos.id

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

exports.getAllNationalities = async (req, res) => {
    try {
        const query = 'SELECT * FROM naciones';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching nationalities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllPositions = async (req, res) => {
    try {
        const query = 'SELECT * FROM posiciones';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllLeagues = async (req, res) => {
    try {
        const query = 'SELECT * FROM ligas';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leagues:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
