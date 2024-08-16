const supabase = require('../config/supabase');

exports.getUserVideos = async (req, res) => {
    try{
        const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('usuarioid', 11);

        if (error) {
            console.log('Error fetching videos:', error);
        }

        res.status(200).json(data);
    } catch (error) {
        console.log('Error fetching videos:', error);
        res.status(500).json({ error: error.message });
    }
    
}