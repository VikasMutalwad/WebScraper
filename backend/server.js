import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import * as cheerio from 'cheerio'; // This is the corrected line
import axios from 'axios';

const app = express();
const PORT = 5000;

// Middleware to handle CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// --- Simulated Database (In a real app, use a database like MongoDB) ---
const users = [];

// --- User Registration Endpoint ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if the username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    try {
        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = { username, password: hashedPassword };
        users.push(newUser); // Save user to our "database"
        
        console.log(`User registered: ${username}`);
        res.status(200).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'An unexpected error occurred during registration' });
    }
});

// --- User Login Endpoint ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
        // Compare the submitted password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log(`User logged in: ${username}`);
        res.status(200).json({ username });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred during login' });
    }
});

// --- Web Scraping Endpoint ---
app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const scrapedData = {
            title: $('title').text(),
            headings: $('h1, h2, h3, h4, h5, h6').map((i, el) => $(el).text()).get(),
            images: $('img').map((i, el) => $(el).attr('src')).get(),
            links: $('a').map((i, el) => $(el).attr('href')).get(),
            meta: {
                description: $('meta[name="description"]').attr('content') || 'Not found',
                keywords: $('meta[name="keywords"]').attr('content') || 'Not found',
            },
        };

        res.status(200).json(scrapedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape the website.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});