const supabase = require('../config/supabase');

exports.test = async (req, res) => {
    return res.status(200).json({ message: 'okeyy' });
};

exports.getUserData = async (req, res) => {
    const userId = 11; // Reemplaza con el ID correcto del usuario

    try {
        const { data, error } = await supabase
            .from('perfil_jugadores')
            .select(`
                id,
                edad,
                altura,
                nacion_id,
                provincia_id,
                usuarios (
                    id,
                    email
                )
            `)
            .eq('usuario_id', userId)
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        console.log('getUserData data:', data);
        res.json(data);
    } catch (error) {
        console.error('Error en getUserData:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.updateUserData = async (req, res) => {
    const userId = 11; // Reemplaza con el ID correcto del usuario
    const { edad, altura, nacion_id, provincia_id, email } = req.body;

    try {
        const { error: perfilError } = await supabase
            .from('perfil_jugadores')
            .update({ edad, altura, nacion_id, provincia_id })
            .eq('usuario_id', userId);

        if (perfilError) {
            console.log('Error al actualizar los datos del perfil:', perfilError);
        }

        const { error: usuarioError } = await supabase
            .from('usuarios')
            .update({ email })
            .eq('id', userId);

        if (usuarioError) {
            console.log('Error al actualizar los datos del usuario:', usuarioError);
        };

        res.status(200).json({ message: 'User data updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getNaciones = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('naciones')
            .select('*')
            .order('nombre');

        if (error) {
            console.error('Error al obtener las naciones:', error);
        };

        console.log('getNaciones data:', data);

        res.json(data);
    } catch (error) {
        console.error('Error en getNaciones:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getProvincias = async (req, res) => {
    const { nacionId } = req.params;
    try {
        const { data, error } = await supabase
            .from('provincias')
            .select('*')
            .eq('nacion_id', nacionId)
            .order('nombre');

        if (error) {
            console.error('Error al obtener las provincias:', error);
        };

        console.log('getProvincias data:', data);

        res.json(data);
    } catch (error) {
        console.error('Error en getProvincias:', error.message);
        res.status(500).json({ error: error.message });
    }
};