// Importa le dipendenze
const express = require('express');
const path = require('path');
const { Pool } = require('pg');  // Importa il modulo per PostgreSQL

const app = express();

// Configura il database PostgreSQL
const pool = new Pool({
    user: 'postgres', // Sostituisci con il tuo utente PostgreSQL
    host: 'localhost',
    database: 'terminale', // Sostituisci con il nome del tuo database
    password: 'Zucchetti01', // Sostituisci con la tua password
    port: 5432,
});

// Middleware per il parsing del corpo JSON (Express integrato)
app.use(express.json());

// Servire i file statici dalla cartella principale (modifica se hai una cartella specifica per i file)
app.use(express.static(path.join(__dirname)));

// Root route per servire il file index.html (se hai bisogno di una homepage statica)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Modifica della route GET per includere una formattazione della data
app.get('/api/posts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');

        // Formattiamo la data per essere più leggibile (ad esempio: "2024-12-19 15:30")
        const posts = result.rows.map(post => {
            post.createdAt = new Date(post.created_at).toLocaleString();
            return post;
        });

        res.json(posts); // Ritorna i dati dei post come JSON con la data formattata
    } catch (err) {
        console.error('Errore durante il recupero dei post:', err);
        res.status(500).send('Errore nel recupero dei post');
    }
});


// Route per gestire la richiesta POST per aggiungere un nuovo post
app.post('/api/posts', async (req, res) => {
    const { content } = req.body;  // Ottieni il contenuto del post dalla richiesta

    // Se il contenuto del post è vuoto, ritorna un errore
    if (!content || content.trim() === '') {
        return res.status(400).send('Il contenuto del post non può essere vuoto');
    }

    try {
        // Inserisci il nuovo post nel database
        const result = await pool.query(
            'INSERT INTO posts (content, created_at) VALUES ($1, NOW()) RETURNING *',
            [content]
        );

        const newPost = result.rows[0];  // Prendi il post appena inserito

        // Formattiamo la data per essere più leggibile (ad esempio: "2024-12-19 15:30")
        newPost.createdAt = new Date(newPost.created_at).toLocaleString();

        // Restituisci il nuovo post come risposta JSON, includendo la data formattata
        res.status(201).json(newPost);
    } catch (err) {
        console.error('Errore nell\'aggiungere il post:', err);
        res.status(500).send('Errore nell\'aggiungere il post');
    }
});


// Route per gestire la richiesta PUT per aggiornare un post
app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;  // Ottieni l'ID del post dalla URL
    const { content } = req.body;  // Ottieni il contenuto aggiornato dalla richiesta

    // Se il contenuto del post è vuoto, ritorna un errore
    if (!content || content.trim() === '') {
        return res.status(400).send('Il contenuto del post non può essere vuoto');
    }

    try {
        // Aggiorna il post nel database
        const result = await pool.query(
            'UPDATE posts SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Post non trovato');
        }

        const updatedPost = result.rows[0];  // Prendi il post appena aggiornato
        res.json(updatedPost);  // Restituisci il post aggiornato come risposta JSON
    } catch (err) {
        console.error('Errore durante l\'aggiornamento del post:', err);
        res.status(500).send('Errore nell\'aggiornamento del post');
    }
});

// **Aggiungi la rotta DELETE per eliminare un post**
// Route per gestire la richiesta DELETE per eliminare un post
app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;  // Ottieni l'ID del post dai parametri della URL

    try {
        // Elimina il post dal database
        const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

        // Se il post con l'ID specificato non esiste, ritorna un errore
        if (result.rowCount === 0) {
            return res.status(404).send('Post non trovato');
        }

        // Restituisci il post eliminato come risposta JSON (opzionale)
        res.json({ message: 'Post eliminato con successo', postId: id });
    } catch (err) {
        console.error('Errore nell\'eliminazione del post:', err);
        res.status(500).send('Errore nell\'eliminazione del post');
    }
});

// Avvia il server sulla porta 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
