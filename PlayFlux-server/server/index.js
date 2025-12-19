// index.js
const express = require('express');
const dotenv = require('dotenv');

const bcrypt = require('bcrypt');
const saltRounds = 10; // Hoe vaker hij hasht, hoe veiliger (maar trager)

// CORRECTE SUPABASE IMPORT
const { createClient } = require('@supabase/supabase-js'); // let op de accolades
dotenv.config(); 

const app = express();
const PORT = 3000;

// Supabase setup
const supabaseUrl = 'https://cwvoqkkkfevludzbmayy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey); // nu werkt het

// Routes
app.get('/api', (req, res) => {
    res.json('Hello from the backend!');
});

app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('Users')
        .select('*');

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

app.use(express.json());


app.post('/users', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Maak het wachtwoord onleesbaar voordat het naar Supabase gaat
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const { data, error } = await supabase
            .from('Users')
            .insert([
                { username, email, password: hashedPassword }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'User created securely!', user: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Gebruiker verwijderen op basis van username
app.delete('/users/:username', async (req, res) => {
    const { username } = req.params;

    const { data, error } = await supabase
        .from('Users')
        .delete()
        .eq('username', username)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ message: `Gebruiker ${username} verwijderd!`, deleted: data });
});
// Server starten
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
