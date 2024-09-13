const express = require('express');
const cors = require('cors');
const path = require('path');
const videoRoutes = require('./src/routes/videoRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const userRoutes = require('./src/routes/userRoutes');
const posteosRoutes = require('./src/routes/posteosRoutes');
const profileVideoRoutes = require('./src/routes/profileVideoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const filterRoutes = require('./src/routes/filterRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/user', userRoutes);
app.use('/api/posts', posteosRoutes);
app.use('/api/userProfile', profileVideoRoutes);
app.use('/api/login', authRoutes);
app.use('/api/filter', filterRoutes);

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
