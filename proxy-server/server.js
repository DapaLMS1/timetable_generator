const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// This serves your index.html and CSS from the folder above 'proxy-server'
app.use(express.static(path.join(__dirname, '../')));

// 2. The Lookup Route (Mirrors your Postman Request)
app.get('/api/lookup-student', async (req, res) => {
    try {
        const { studentId } = req.query;
        const API_KEY = process.env.READY_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Server missing API Key' });
        }

        // MIRROR POSTMAN: Blank Username (:) + API Key as Password
        const authHeader = `Basic ${Buffer.from(':' + API_KEY).toString('base64')}`;

        console.log(`[Proxy] Searching for Student Identifier: ${studentId}`);

        const response = await axios.get('https://dapa.readystudent.io/webservice/parties', {
            params: { 
                'party_identifier': studentId 
            },
            headers: { 
                'Authorization': authHeader,
                'Accept': 'application/xml'
            }
        });

        // 3. Convert XML Packet to JSON
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        
        parser.parseString(response.data, (err, result) => {
            if (err) {
                console.error('XML Parse Error:', err);
                return res.status(500).json({ error: 'Failed to parse student data' });
            }

            // Access the <party> tag inside <parties>
            const partyData = result.parties && result.parties.party;

            if (partyData) {
                console.log(`[Success] Found: ${partyData['first-name']} ${partyData.surname}`);
                
                // Send clean data back to your web form
                res.json({
                    success: true,
                    firstName: partyData['first-name'],
                    surname: partyData.surname,
                    email: partyData.login,
                    studentId: partyData['party-identifier']
                });
            } else {
                res.status(404).json({ success: false, message: 'Student ID not found in ReadyStudent' });
            }
        });

    } catch (error) {
        console.error('API Connection Error:', error.response?.status, error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: 'Connection to ReadyStudent failed' 
        });
    }
});

// 4. Start Server
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 Proxy Server running on port ${PORT}`);
    console.log(`📂 Serving static files from: ${path.join(__dirname, '../')}`);
    console.log(`-----------------------------------------`);
});
