const supabase = require('../config/supabase');

exports.getProfileInfo = async (req, res) => {
    const userId = 11;

    try {
        const { data: profileData, error: profileError } = await supabase
            .from('perfil_jugadores')
            .select(`
            id,
            avatar_url,
            edad,
            altura,
            peso,
            usuarios (
                id,
                nombre,
                apellido,
                rol
            ),
            naciones (
                nombre
            ),
            provincias (
                nombre
            )
        `)
            .eq('usuario_id', userId)
            .single();

        if (profileError) {
            console.log('Error al obtener datos del perfil:', profileError);
        }

        const { count: followersCount, error: followersError } = await supabase
            .from('seguidores')
            .select('*', { count: 'exact' })
            .eq('usuarioid', userId);

        if (followersError) {
            console.log('Error al obtener seguidores:', followersError);
        }

        res.json({
            profile: profileData,
            followersCount: followersCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
