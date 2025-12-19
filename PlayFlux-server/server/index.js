const express = require('express');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = 3000;

// BELANGRIJK: Middleware ALTIJD bovenaan zetten
app.use(express.json());

const supabaseUrl = 'https://cwvoqkkkfevludzbmayy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- AUTH ROUTES ---

// Registreren
app.post('/auth/signup', async (req, res) => {
    const { email, password, username } = req.body;
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        const { error: dbError } = await supabase
            .from('Users')
            .insert([{ user_id: authData.user.id, username, email }]);
        if (dbError) throw dbError;

        res.status(201).json({ message: "Account aangemaakt!", user: authData.user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Inloggen
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        res.json({ message: "Ingelogd!", session: data.session });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// --- REDDIT CONTENT ROUTES ---

// Nieuwe post plaatsen
app.post('/api/posts', async (req, res) => {
    const authHeader = req.headers.authorization;
    // Check of body wel bestaat om de TypeError te voorkomen
    if (!req.body || !req.body.title) {
        return res.status(400).json({ error: "Titel is verplicht" });
    }

    const { title, content } = req.body;
    if (!authHeader) return res.status(401).json({ error: "Log eerst in" });

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    try {
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) throw new Error("Sessie ongeldig");

        const { data, error } = await userClient
            .from('Posts')
            .insert([{ title, content, author_id: user.id }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Post geplaatst!", post: data[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Alle posts ophalen (De "Feed")
app.get('/api/posts', async (req, res) => {
    const { data, error } = await supabase
        .from('Posts')
        .select('*, Users(username)'); // Haalt ook direct de naam van de auteur op!
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`PlayFlux server draait op http://localhost:${PORT}`);
});