const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ready Student Configuration
const READY_API_URL = 'https://dapa.readystudent.io/webservice';
const API_KEY = process.env.READY_API_KEY;

// This encodes ":YOUR_API_KEY" into Base64 (Blank username + Key as password)
const authHeader = `Basic ${Buffer.from(':' + API_KEY).toString('base64')}`;

app.use(cors());
app.use(express.json());

app.get('/api/lookup-student', async (req, res) => {
    const { studentNumber, name } = req.query;
    
    try {
        let params = { type: 'student' }; 
        if (studentNumber) params.student_number = studentNumber;
        if (name) params.first_name = name; 

        console.log(`Searching: ${READY_API_URL}/parties using Basic Auth`);

        const studentRes = await axios.get(`${READY_API_URL}/parties`, {
            params: params,
            headers: { 
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        const parties = studentRes.data.parties || [];
        const student = parties[0];

        if (student) {
            res.json({ 
                success: true, 
                studentName: `${student['first-name']} ${student['last-name']}`,
                studentNumber: student['student-number'],
                id: student.id
            });
        } else {
            res.status(404).json({ success: false, message: "Student record not found" });
        }
    } catch (error) {
        console.error("Ready Student Error Status:", error.response?.status);
        console.error("Ready Student Error Data:", JSON.stringify(error.response?.data));
        res.status(500).json({ error: "Failed to connect to API" });
    }
});

// Sync logic
app.post('/api/sync-student', async (req, res) => {
    const { studentNumber, units } = req.body;
    try {
        const studentRes = await axios.get(`${READY_API_URL}/parties`, {
            params: { student_number: studentNumber, type: 'student' },
            headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
        });
        
        const student = (studentRes.data.parties || [])[0];
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const enrolRes = await axios.get(`${READY_API_URL}/enrolments`, {
            params: { party_id: student.id },
            headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
        });

        const enrolment = (enrolRes.data.enrolments || []).find(e => e['course-code'] === 'HLT35021');
        if (!enrolment) return res.status(404).json({ error: 'HLT35021 Enrolment not found' });

        const updatePayload = {
            units: units.map(u => ({
                'unit-code': u.unitCode,
                'start-date': u.startDate,
                'target-end-date': u.targetEndDate 
            }))
        };

        await axios.put(`${READY_API_URL}/enrolments/${enrolment.id}/units`, updatePayload, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });

        res.json({ success: true, message: `Updated ${units.length} units` });
    } catch (error) {
        console.error("Sync Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Sync failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
    console.log(`Ready Student URL: ${READY_API_URL}`);
});
