const db = require('../config/db');


exports.getVideoData = async (req, res) => {
    const { videoId } = req.params;
    const userId = 11;


    try {
        const videoQuery = 'SELECT * FROM videos WHERE id = $1';
        const videoResult = await db.query(videoQuery, [videoId]);
        const videoData = videoResult.rows[0];


        const likeQuery = 'SELECT * FROM video_likes WHERE video_id = $1 AND user_id = $2';
        const likeResult = await db.query(likeQuery, [videoId, userId]);
        const liked = likeResult.rowCount > 0;


        res.json({ ...videoData, liked });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




exports.checkFollowStatus = async (req, res) => {
    const { id_seguidor, usuarioid } = req.params; // Suponiendo que recibes estos valores como parámetros


    if (!id_seguidor || !usuarioid) {
        return res.status(400).json({ error: 'Missing parameters' });
    }


    try {
        // Consulta para verificar si el usuario está siguiendo al otro usuario
        const followQuery = `
            SELECT 1
            FROM seguidores
            WHERE id_seguidor = $1
            AND usuarioid = $2
            LIMIT 1
        `;


        const result = await db.query(followQuery, [id_seguidor, usuarioid]);


        // Verifica si el usuario está siguiendo o no
        const isFollowing = result.rowCount > 0;


        res.json({ isFollowing });
    } catch (error) {
        console.error("Error checking follow status:", error);
        res.status(500).json({ error: error.message });
    }
};






exports.handleFollowToggle = async (req, res) => {
    const { id_seguidor, usuarioid } = req.params;


    if (!id_seguidor || !usuarioid) {
        return res.status(400).json({ error: 'Missing parameters' });
    }


    try {
        // Verificar si el usuario está siguiendo o no
        const followQuery = `
            SELECT 1 FROM seguidores
            WHERE id_seguidor = $1 AND usuarioid = $2
            LIMIT 1
        `;
        const followResult = await db.query(followQuery, [id_seguidor, usuarioid]);


        if (followResult.rowCount > 0) {
            // Eliminar el seguimiento
            const { error } = await db.query(`
                DELETE FROM seguidores
                WHERE id_seguidor = $1 AND usuarioid = $2
            `, [id_seguidor, usuarioid]);


            if (error) throw error;


            return res.json({ isFollowing: false });
        } else {
            // Agregar el seguimiento
            const { error } = await db.query(`
                INSERT INTO seguidores (id_seguidor, usuarioid, fechaseguido)
                VALUES ($1, $2, NOW())
            `, [id_seguidor, usuarioid]);


            if (error) throw error;


            return res.json({ isFollowing: true });
        }
    } catch (error) {
        console.error("Error toggling follow status:", error);
        res.status(500).json({ error: error.message });
    }
};




exports.getVideoLikes = async (req, res) => {
    const { videoId } = req.params;
    try {
        const likesQuery = 'SELECT likes FROM videos WHERE id = $1';
        const result = await db.query(likesQuery, [videoId]);
        console.log("los likes son de ",result )
        res.json({ likes: result.rows[0].likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.likeVideo = async (req, res) => {
    const { videoId } = req.params;
    const userId = 11;


    try {
        const likeCheckQuery = 'SELECT * FROM video_likes WHERE video_id = $1 AND user_id = $2';
        const likeCheckResult = await db.query(likeCheckQuery, [videoId, userId]);


        let updatedLikes;
        if (likeCheckResult.rowCount > 0) {
            await db.query('DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2', [videoId, userId]);


            const likeCountQuery = 'SELECT likes FROM videos WHERE id = $1';
            const likeCountResult = await db.query(likeCountQuery, [videoId]);
            updatedLikes = likeCountResult.rows[0].likes - 1;


            await db.query('UPDATE videos SET likes = $1 WHERE id = $2', [updatedLikes, videoId]);
        } else {
            await db.query('INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2)', [videoId, userId]);


            const likeCountQuery = 'SELECT likes FROM videos WHERE id = $1';
            const likeCountResult = await db.query(likeCountQuery, [videoId]);
            updatedLikes = likeCountResult.rows[0].likes + 1;


            await db.query('UPDATE videos SET likes = $1 WHERE id = $2', [updatedLikes, videoId]);
        }


        res.json({ likes: updatedLikes, liked: likeCheckResult.rowCount === 0 });
    } catch (error) {
        console.log('Error handling like:', error.message);
        res.status(500).json({ error: error.message });
    }
};
