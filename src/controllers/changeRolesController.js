const db = require('../config/db');

exports.verifyAficionado = async (req, res) => {
    const { email, contraseña } = req.body;
  
    try {
      // Consulta para encontrar al usuario por email y contraseña
      const query = 'SELECT * FROM usuarios WHERE email = $1 AND contraseña = $2';
      const values = [email, contraseña];
  
      const result = await db.query(query, values);
  
      if (result.rows.length === 0) {
        // Usuario no encontrado
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
  
      const user = result.rows[0];
  
      // Verificar si el usuario tiene rol de "Aficionado"
      if (user.rol === 'Aficionado') {
        // Si el usuario es "Aficionado", redirigir
        return res.status(200).json({ message: 'Acceso permitido', rol: 'Aficionado' });
      } else {
        // Si no es "Aficionado", no permitir avanzar
        return res.status(403).json({ error: 'Acceso denegado. Solo los aficionados pueden avanzar.' });
      }
    } catch (error) {
      console.error('Error en la verificación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  exports.changeToPlayer = async (req, res) => {
    const { email, edad, altura, peso, liga, equipo, posicion } = req.body;

    try {
        // 1. Obtener el usuario por email
        const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
        const userResult = await db.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = userResult.rows[0];
        console.log('Usuario encontrado:', usuario);


        // 2. Verificar que el usuario sea "Aficionado"
        if (usuario.rol !== 'Aficionado') {
            return res.status(403).json({ error: 'Solo los aficionados pueden convertirse en jugadores' });
        }

        // 3. Obtener datos del perfil_aficionados
        const aficionadoQuery = 'SELECT * FROM perfil_aficionados WHERE usuario_id = $1';
        const aficionadoResult = await db.query(aficionadoQuery, [usuario.id]);

        if (aficionadoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Perfil de aficionado no encontrado' });
        }

        const aficionado = aficionadoResult.rows[0];

        const existingPlayerQuery = 'SELECT * FROM perfil_jugadores WHERE usuario_id = $1';
        const existingPlayerResult = await db.query(existingPlayerQuery, [usuario.id]);

        if (existingPlayerResult.rows.length > 0) {
            return res.status(400).json({ error: 'El jugador ya existe' });
        }

        // 4. Insertar nuevo registro en perfil_jugadores
        const jugadorInsertQuery = `
            INSERT INTO perfil_jugadores 
            (avatar_url, edad, altura, peso, usuario_id, equipo_id, nacion_id, localidad_id, provincia_id, posicion_id, liga_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;

        const jugadorValues = [
            aficionado.avatar_url,   // Mantiene el avatar del aficionado
            edad,                    // Edad del formulario
            altura,                  // Altura del formulario
            peso,                    // Peso del formulario
            usuario.id,              // ID del usuario
            equipo,                  // Equipo del formulario
            aficionado.nacion_id,     // Nación del aficionado
            aficionado.localidad_id,  // Localidad del aficionado
            aficionado.provincia_id,  // Provincia del aficionado
            posicion,                // Posición del formulario
            liga                     // Liga del formulario
        ];

        const jugadorResult = await db.query(jugadorInsertQuery, jugadorValues);
        console.log('Jugador insertado:', jugadorResult.rows[0]);
        const nuevoJugador = jugadorResult.rows[0];

        // 5. Eliminar el registro de perfil_aficionados
        const deleteAficionadoQuery = 'DELETE FROM perfil_aficionados WHERE usuario_id = $1';
        await db.query(deleteAficionadoQuery, [usuario.id]);

        // 6. Actualizar el rol del usuario a "Jugador"
        const updateUserQuery = 'UPDATE usuarios SET rol = $1 WHERE id = $2';
        await db.query(updateUserQuery, ['Jugador', usuario.id]);

        return res.status(200).json({ message: 'Cambio a jugador exitoso', jugador: nuevoJugador });

    } catch (error) {
        console.error('Error cambiando a jugador:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.changeToRecruiter = async (req, res) => {
    const { email, nacion, provincia } = req.body;

    try {
        // 1. Obtener el usuario por email
        const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
        const userResult = await db.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = userResult.rows[0];
        console.log('Usuario encontrado:', usuario);


        // 2. Verificar que el usuario sea "Aficionado"
        if (usuario.rol !== 'Aficionado') {
            return res.status(403).json({ error: 'Solo los aficionados pueden convertirse en reclutadores' });
        }

        // 3. Obtener datos del perfil_aficionados
        const aficionadoQuery = 'SELECT * FROM perfil_aficionados WHERE usuario_id = $1';
        const aficionadoResult = await db.query(aficionadoQuery, [usuario.id]);

        if (aficionadoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Perfil de aficionado no encontrado' });
        }

        const aficionado = aficionadoResult.rows[0];

        const existingPlayerQuery = 'SELECT * FROM perfil_reclutadores WHERE usuario_id = $1';
        const existingPlayerResult = await db.query(existingPlayerQuery, [usuario.id]);

        if (existingPlayerResult.rows.length > 0) {
            return res.status(400).json({ error: 'El reclutador ya existe' });
        }

        // 4. Insertar nuevo registro en perfil_jugadores
        const jugadorInsertQuery = `
            INSERT INTO perfil_reclutadores
            (avatar_url, usuario_id, nacion_id, provincia_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const jugadorValues = [
            aficionado.avatar_url,   // Mantiene el avatar del aficionado                // Peso del formulario
            usuario.id,              // ID del usuario
            nacion,     // Nación del aficionado
            provincia,  // Provincia del aficionado
        ];

        const jugadorResult = await db.query(jugadorInsertQuery, jugadorValues);
        console.log('Reclutador insertado:', jugadorResult.rows[0]);
        const nuevoJugador = jugadorResult.rows[0];

        // 5. Eliminar el registro de perfil_aficionados
        const deleteAficionadoQuery = 'DELETE FROM perfil_aficionados WHERE usuario_id = $1';
        await db.query(deleteAficionadoQuery, [usuario.id]);

        // 6. Actualizar el rol del usuario a "Jugador"
        const updateUserQuery = 'UPDATE usuarios SET rol = $1 WHERE id = $2';
        await db.query(updateUserQuery, ['Reclutador', usuario.id]);

        return res.status(200).json({ message: 'Cambio a reclutador exitoso', jugador: nuevoJugador });

    } catch (error) {
        console.error('Error cambiando a reclutador:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};



exports.getLigas = async (req, res) => {
    try {
        const query = 'SELECT * FROM ligas';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ligas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

exports.getEquipos = async (req, res) => {
    try {
        const query = 'SELECT * FROM equipos';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener equipos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

exports.getPosiciones = async (req, res) => {
    try {
        const query = 'SELECT * FROM posiciones';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener posiciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

exports.getNaciones = async (req, res) => {
    try {
        const query = 'SELECT * FROM naciones';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener naciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

exports.getProvincias = async (req, res) => {
    const { nacionId } = req.params; 
    try {
        const query = 'SELECT * FROM provincias WHERE nacion_id = $1';
        const result = await db.query(query, [nacionId]);
        res.json(result.rows);
    } catch (error) {    
        console.error('Error al obtener provincias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}; 