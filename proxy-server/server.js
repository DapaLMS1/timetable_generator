const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Use the PORT provided by Codespaces/Environment or default to 3000
const PORT = process.env.PORT || 3000;

// Ready Student API Configuration from GitHub Secrets / .env
const READY_API_URL = 'https://api.readytech.com.au/v1'; 
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
        let params = {};
        if (studentNumber) params.studentNumber = studentNumber;
        if (name) params.firstName = name; 

        const studentRes = await axios.get(`${READY_API_URL}/students`, {
            params: params,
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        const student = studentRes.data[0];
        if (student) {
            res.json({ 
                success: true, 
                studentName: `${student.firstName} ${student.lastName}`,
                studentNumber: student.studentNumber 
            });
        } else {
            res.status(404).json({ success: false, message: "Student record not found" });
        }
} catch (error) {
        // --- ADD THESE LOGS TO SEE THE REAL ERROR ---
        if (error.response) {
            console.error("ReadyTech Error Status:", error.response.status);
            console.error("ReadyTech Error Data:", JSON.stringify(error.response.data));
        } else {
            console.error("Connection Error:", error.message);
        }
        // --------------------------------------------
        res.status(500).json({ error: "Failed to connect to Ready Student API" });
    }
});

/**
 * Endpoint 2: Sync Timetable to Ready Student
 * Finds the student, their HLT35021 enrolment, and updates unit dates.
 * targetEndDate is now specific to the last task date of each unit.
 */
app.post('/api/sync-student', async (req, res) => {
    const { studentNumber, units } = req.body;

    try {
        // Step 1: GET Student Details to get the internal ID
        const studentRes = await axios.get(`${READY_API_URL}/students`, {
            params: { studentNumber: studentNumber },
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        const student = studentRes.data[0];
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Step 2: GET Enrolment for HLT35021
        const enrolRes = await axios.get(`${READY_API_URL}/enrollments`, {
            params: { studentID: student.id },
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        const enrolment = enrolRes.data.find(e => e.courseCode === 'HLT35021');
        if (!enrolment) return res.status(404).json({ error: 'HLT35021 Enrolment not found' });

        // Step 3: PUT Date updates to Units
        // The payload 'units' from frontend contains: { unitCode, startDate, targetEndDate }
        const updatePayload = {
            units: units.map(u => ({
                unitCode: u.unitCode,
                startDate: u.startDate,
                targetEndDate: u.targetEndDate // This is the date of the last task for this unit
            }))
        };

        const updateRes = await axios.put(`${READY_API_URL}/enrollments/${enrolment.id}/units`, updatePayload, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ 
            success: true, 
            message: `Updated dates for ${units.length} units for ${student.firstName} ${student.lastName}` 
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
    console.log(`API Key loaded: ${API_KEY ? 'YES' : 'NO (Check Secrets/Env)'}`);
});
