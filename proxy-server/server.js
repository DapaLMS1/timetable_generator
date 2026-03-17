const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Use the PORT provided by Codespaces/Environment or default to 3000
const PORT = process.env.PORT || 3000;

// Ready Student API Configuration
// Updated to use the /webservice path identified in documentation
const READY_API_URL = 'https://dapa.readystudent.io/webservice';
const API_KEY = process.env.READY_API_KEY;

app.use(cors());
app.use(express.json());

/**
 * Endpoint 1: Student/Number Lookup
 * Swaps student name for number or vice versa based on input.
 */
app.get('/api/lookup-student', async (req, res) => {
    const { studentNumber, name } = req.query;
    
    try {
        // Build params using underscores as per documentation
        let params = { type: 'student' }; 
        if (studentNumber) params.student_number = studentNumber;
        if (name) params.first_name = name; 

        console.log(`Searching for student at: ${READY_API_URL}/parties`);

        const studentRes = await axios.get(`${READY_API_URL}/parties`, {
            params: params,
headers: { 
    'ApiKey': API_KEY, // Many Ready Student instances prefer this
    'Accept': 'application/json'
}
        });

        // Documentation indicates response contains a 'parties' array
        const parties = studentRes.data.parties || [];
        const student = parties[0];

        if (student) {
            // Note: API returns data with hyphenated keys
            res.json({ 
                success: true, 
                studentName: `${student['first-name']} ${student['last-name']}`,
                studentNumber: student['student-number'],
                internalID: student.id
            });
        } else {
            res.status(404).json({ success: false, message: "Student record not found" });
        }
    } catch (error) {
        if (error.response) {
            console.error("Ready Student Error Status:", error.response.status);
            console.error("Ready Student Error Data:", JSON.stringify(error.response.data));
        } else {
            console.error("Connection Error:", error.message);
        }
        res.status(500).json({ error: "Failed to connect to Ready Student API" });
    }
});

/**
 * Endpoint 2: Sync Timetable to Ready Student
 */
app.post('/api/sync-student', async (req, res) => {
    const { studentNumber, units } = req.body;

    try {
        // Step 1: GET Student ID using student_number
        const studentRes = await axios.get(`${READY_API_URL}/parties`, {
            params: { student_number: studentNumber, type: 'student' },
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
        });
        
        const parties = studentRes.data.parties || [];
        const student = parties[0];
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Step 2: GET Enrolments for this party
        // Using /enrolments endpoint from documentation
        const enrolRes = await axios.get(`${READY_API_URL}/enrolments`, {
            params: { party_id: student.id },
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
        });

        const enrolments = enrolRes.data.enrolments || [];
        const enrolment = enrolments.find(e => e['course-code'] === 'HLT35021');
        
        if (!enrolment) return res.status(404).json({ error: 'HLT35021 Enrolment not found' });

        // Step 3: Update Units (logic remains same, adjusted for API path)
        const updatePayload = {
            units: units.map(u => ({
                'unit-code': u.unitCode,
                'start-date': u.startDate,
                'target-end-date': u.targetEndDate 
            }))
        };

        await axios.put(`${READY_API_URL}/enrolments/${enrolment.id}/units`, updatePayload, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ 
            success: true, 
            message: `Updated dates for ${units.length} units for ${student['first-name']}` 
        });

    } catch (error) {
        console.error("Sync Error:", error.response?.data || error.message);
        res.status(500).json({ 
            error: error.response?.data || "Internal server error during sync" 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
    console.log(`API Target: ${READY_API_URL}`);
    console.log(`API Key loaded: ${API_KEY ? 'YES' : 'NO'}`);
});
