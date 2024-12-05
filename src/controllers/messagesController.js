const db = require('../config/db');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  "https://cryvkjhhbrsdmffgqmbj.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeXZramhoYnJzZG1mZmdxbWJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODQ3MDY4NywiZXhwIjoyMDM0MDQ2Njg3fQ.EaeDZltaiywmzl4YNV37swFsu92cHSyfbxyyOevHaWc", 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

console.log('Storage Config:', supabase.storage);


exports.getMessagesBetweenUsers = async (req, res) => {
    const { usuarioId, receptorId } = req.params;
    
    try {
      const query = `
        SELECT 
          m.*,
          u.nombre, 
          u.apellido, 
          COALESCE(
            pp.avatar_url, 
            pa.avatar_url, 
            pr.avatar_url, 
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
          ) as avatar_url
        FROM mensajes m
        JOIN usuarios u ON m.usuarioid = u.id
        LEFT JOIN perfil_jugadores pp ON u.id = pp.usuario_id
        LEFT JOIN perfil_aficionados pa ON u.id = pa.usuario_id
        LEFT JOIN perfil_reclutadores pr ON u.id = pr.usuario_id
        WHERE 
          (m.usuarioid = $1 AND m.receptorid = $2) OR 
          (m.usuarioid = $2 AND m.receptorid = $1)
        ORDER BY m.fechaenvio ASC
      `;
      
      const result = await db.query(query, [usuarioId, receptorId]);
      
      console.log('Mensajes encontrados:', result.rows);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: error.message });
    }
  };

  exports.sendMessage = async (req, res) => {
    const { usuarioId, receptorId, contenido} = req.body;
  
    try {
      // Validate input
      if (!usuarioId || !receptorId || !contenido) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }
  
      // Insert message into database
      const query = `
        INSERT INTO mensajes (usuarioid, receptorid, contenido, fechaenvio)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
  
      const result = await db.query(query, [
        usuarioId, 
        receptorId, 
        contenido, 
      ]);
  
      // Fetch the full message details with user information
      const messageDetailQuery = `
        SELECT 
          m.*,
          u.nombre, 
          u.apellido, 
          COALESCE(
            pp.avatar_url, 
            pa.avatar_url, 
            pr.avatar_url, 
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
          ) as avatar_url
        FROM mensajes m
        JOIN usuarios u ON m.usuarioid = u.id
        LEFT JOIN perfil_jugadores pp ON u.id = pp.usuario_id
        LEFT JOIN perfil_aficionados pa ON u.id = pa.usuario_id
        LEFT JOIN perfil_reclutadores pr ON u.id = pr.usuario_id
        WHERE m.id = $1
      `;
  
      const messageDetailResult = await db.query(messageDetailQuery, [result.rows[0].id]);
  
      console.log('Mensaje enviado:', messageDetailResult.rows[0]);
      res.status(201).json(messageDetailResult.rows[0]);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: error.message });
    }
  };

  exports.sendAudioMessage = async (req, res) => {
    const { usuarioId, receptorId } = req.body;
    const audioFile = req.file;
    console.log('Audio File:', audioFile);
      console.log('Audio File Buffer:', audioFile.buffer);
  
    try {

      // Validar datos de entrada
      if (!usuarioId || !receptorId || !audioFile) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }
      

      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Buckets:', buckets);
  
      if (bucketsError) {
        console.error('Error listando buckets:', bucketsError);
        return res.status(500).json({ error: 'Error configurando Storage' });
      }

      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('audio-messages');

      if (bucketError) {
        console.error('Bucket Error:', bucketError);
        console.log('Bucket Data:', bucketData);
        return res.status(500).json({ error: 'Error de configuración de Storage' });
      }
  
      // Generar un nombre de archivo único
      const audioFileName = `audio_${Date.now()}.m4a`;
      console.log('Audio File Name:', audioFileName);
      console.log('Audio File:', audioFile);
      console.log('Audio File Buffer:', audioFile.buffer);
  
      // Subir a Supabase Storage directamente desde el buffer
      const { data: storageData, error: storageError } = await supabase.storage
      .from('audio-messages')
      .upload(audioFileName, audioFile.buffer, {
        cacheControl: '3600',
        contentType: 'audio/x-m4a',
      });

        console.log('Storage Data:', storageData);
  
        if (storageError) {
          console.error('Error de Storage detallado:', storageError);
          return res.status(500).json({ error: 'Error subiendo audio', details: storageError });
        }
  
      // Obtener URL pública del archivo
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('audio-messages')
        .getPublicUrl(audioFileName);
  
      if (urlError) {
        console.error('URL Error:', urlError);
        throw urlError;
      }
  
      // Insertar mensaje en la base de datos
      const query = `
        INSERT INTO mensajes (usuarioid, receptorid, contenido, archivourl, tipo_mensaje)
        VALUES ($1, $2, 'Mensaje de Audio', $3, 'audio')
        RETURNING *
      `;
  
      const result = await db.query(query, [
        usuarioId, 
        receptorId, 
        publicUrl
      ]);
  
      console.log('Mensaje de audio enviado:', result.rows[0]);
      res.status(201).json(result.rows[0]);
  
    } catch (error) {
      console.error('Error enviando mensaje de audio:', error);
      res.status(500).json({ error: error.message });
    }
  };

  exports.sendMediaMessage = async (req, res) => {
    const { usuarioId, receptorId } = req.body;
    const mediaFile = req.file;
    
    try {
      const mediaFileName = `media_${Date.now()}.${mediaFile.originalname.split('.').pop()}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('chat-media')
        .upload(mediaFileName, mediaFile.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: mediaFile.mimetype
        });

      if (storageError) {
        console.error('Error de Storage:', storageError);
        return res.status(500).json({ error: 'Error subiendo archivo multimedia' });
      }

      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('chat-media')
        .getPublicUrl(mediaFileName);

      if (urlError) {
        console.error('URL Error:', urlError);
        throw urlError;
      }

      const tipoMensaje = mediaFile.mimetype.startsWith('image/') ? 'imagen' : 
                          mediaFile.mimetype.startsWith('video/') ? 'video' : 'archivo';

      const query = `
        INSERT INTO mensajes (usuarioid, receptorid, contenido, archivourl, tipo_mensaje)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await db.query(query, [
        usuarioId, 
        receptorId, 
        `Mensaje de ${tipoMensaje}`, 
        publicUrl,
        tipoMensaje
      ]);

      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error('Error enviando mensaje multimedia:', error);
      res.status(500).json({ error: error.message });
    }
};

  