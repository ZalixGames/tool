const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ytdl = require('ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// YouTube Video Downloader
app.get('/api/youtube/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const info = await ytdl.getInfo(url);
        const formats = info.formats.map(format => ({
            quality: format.qualityLabel || format.quality,
            url: format.url,
            mimeType: format.mimeType,
            hasAudio: format.hasAudio,
            hasVideo: format.hasVideo
        }));

        res.json({ formats });
    } catch (error) {
        console.error('YouTube download error:', error);
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

// TikTok Video Downloader
app.get('/api/tiktok/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Note: You'll need to implement TikTok video downloading logic here
        // This might require using a third-party service or API
        res.json({ message: 'TikTok download functionality coming soon' });
    } catch (error) {
        console.error('TikTok download error:', error);
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

// USDT to PKR Converter
app.get('/api/currency/convert', async (req, res) => {
    try {
        const { amount } = req.query;
        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        // Fetch current USDT to PKR rate from a reliable API
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USDT');
        const rate = response.data.rates.PKR;
        const convertedAmount = amount * rate;

        res.json({
            amount: parseFloat(amount),
            rate: rate,
            convertedAmount: convertedAmount,
            currency: 'PKR'
        });
    } catch (error) {
        console.error('Currency conversion error:', error);
        res.status(500).json({ error: 'Failed to convert currency' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 