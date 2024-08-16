const supabase = require('../config/supabase');

exports.getAllPosts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('posteos')
            .select(`
                *,
                usuarios (
                    id,
                    nombre,
                    apellido,
                    perfil_jugadores (
                        avatar_url
                    )
                ),
                respuestas_posteos (count)
            `)
            .order('fechapublicacion', { ascending: false });

        if (error) {
            console.error('Error al obtener los posteos:', error);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error en getAllPosts:', error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.createPost = async (req, res) => {
    const { usuarioid, contenido, videourl } = req.body;

    try {
        const { data, error } = await supabase
            .from('posteos')
            .insert([{ usuarioid, contenido, videourl }])
            .select();
        
        if (error) {
            console.error('Error al crear el posteo:', error);
        }

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error en createPost:', error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.updatePost = async (req, res) => {
    const { id } = req.params;
    const { likes } = req.body;

    try {
        const { data, error } = await supabase
            .from('posteos')
            .update({ likes })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error al crear el posteo:', error);
        }

        res.status(200).json(data[0]);
    } catch (error) {
        console.error('Error en createPost:', error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.deletePost = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('posteos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar el posteo:', error);
        }

        res.status(200).json({ message: 'Posteo eliminado correctamente' });
    } catch (error) {
        console.error('Error en deletePost:', error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.getComments = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('respuestas_posteos')
            .select(`
                *,
                usuarios (
                    id,
                    nombre,
                    apellido,
                    perfil_jugadores (
                        avatar_url
                    )
                ),
                respuestas:respuestas_posteos(count)
            `)
            .eq('posteoid', id)
            .order('fechapublicacion', { ascending: true });

        if (error) {
            console.error('Error al obtener los comentarios:', error);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error en getComments:', error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.createComment = async (req, res) => {
    const { id } = req.params;
    const { usuarioid, contenido, parentid } = req.body;

    try {
        const { data, error } = await supabase
            .from('respuestas_posteos')
            .insert([{ posteoid: id, usuarioid, contenido, parentid }])
            .select();

        if (error) {
            console.error('Error al crear el comentario:', error);
        }

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error en createComment:', error.message);
        res.status(500).json({ error: error.message });
    }
}
