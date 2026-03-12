const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const READY_API_URL = 'https://api.readytech.com.au/v1'; // Use your test URL
const API_KEY = process.env.READY_API_KEY;

if (!API_KEY) {
    console.error("ERROR: READY_API_KEY is not defined!");
}

app.post('/api/sync-student', async (req, res) => {
    const { studentNumber, tppEndDate, startDate, units } = req.body;

    try {
        // Step 1: GET Student Details
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
        
// Step 3: Update Units
// The 'units' array now contains { unitCode, startDate, targetEndDate } for each unit
const updatePayload = {
    units: units.map(u => ({
        unitCode: u.unitCode,
        startDate: u.startDate,
        targetEndDate: u.targetEndDate // Now specific to the last task of this unit
    }))
};

await axios.put(`${READY_API_URL}/enrollments/${enrolment.id}/units`, updatePayload, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
});

        res.json({ success: true, message: `Updated ${units.length} units for ${student.firstName}` });

    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.listen(3000, () => console.log('Proxy running on http://localhost:3000'));
