const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Path Setup
// This finds the "timetable_generator" folder (one level up from this file)
const rootDir = path.resolve(__dirname, '..');

// 3. Diagnostic Route 
// If you visit your-url.dev/test, you should see this message.
app.get('/test', (req, res) => {
    res.send(`Server is alive! I am looking for your index.html in: ${rootDir}`);
});

// 4. Serve Static Files (CSS, JS, Images)
app.use(express.static(rootDir));

// 5. Explicit Home Route
// This forces the server to send index.html when you visit the main URL
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'), (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Server found the folder, but could not find index.html specifically.");
        }
    });
});

// 6. The API Lookup (Mirroring your Postman Success)
app.get('/api/lookup-student', async (req, res) => {
    try {
        const { studentId } = req.query;
        const API_KEY = process.env.READY_API_KEY;

        // Basic Auth: Blank Username (:) + API Key
        const authHeader = `Basic ${Buffer.from(':' + API_KEY).toString('base64')}`;

        console.log(`[API] Searching for: ${studentId}`);

        const response = await axios.get('https://dapa.readystudent.io/webservice/parties', {
            params: { 'party_identifier': studentId },
            headers: { 
                'Authorization': authHeader,
                'Accept': 'application/xml' 
            }
        });

        // Convert XML from Postman format to JSON for your Web Form
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        parser.parseString(response.data, (err, result) => {
            if (err) throw err;

            const partyData = result?.parties?.party;

            if (partyData) {
                res.json({
                    success: true,
                    firstName: partyData['first-name'],
                    surname: partyData.surname,
                    email: partyData.login,
                    studentId: partyData['party-identifier']
                });
            } else {
                res.status(404).json({ success: false, message: 'Student not found' });
            }
        });

    } catch (error) {
        console.error('Connection Error:', error.message);
        res.status(500).json({ success: false, error: 'ReadyStudent connection failed' });
    }
});

// 7. Start the Server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 PROXY SERVER ACTIVE ON PORT ${PORT}`);
    console.log(`📂 ROOT FOLDER: ${rootDir}`);
    console.log(`🔗 TEST LINK: /test`);
    console.log(`=========================================`);
});
