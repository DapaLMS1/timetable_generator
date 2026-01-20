HLT35021 DAPA Assessment Submission Timetable Generator

This single-file web application (index.html) is designed to assist DAPA trainers and students in creating a backward-scheduled timetable for the written assessments of the HLT35021 Certificate III in Dental Assisting.

The tool dynamically calculates the latest possible submission date for each task, ensuring all work is completed by the specified TPP End Date. It intelligently adjusts the required daily pace based on the time available.

✨ Features

Backward Scheduling: Calculates the latest start and submission date for every assessment item by working backward from a defined TPP End Date.

Dynamic Pace Adjustment:

Compression (Fast Track): If the time remaining is tight, the schedule is compressed (20% faster pace) to determine if the deadline is feasible.

Distribution (Flexible Pace): If ample time is available, the required working days are stretched, providing a less demanding weekly pace.

Working Days Only: Calculations exclude weekends (Saturday/Sunday) and a pre-defined list of public holidays to ensure realistic planning.

Critical Alerts: Provides warnings if the TPP End Date cannot be met, even with an accelerated schedule.

Printable Timetable: Generates a clean, professional print view (or PDF) suitable for record-keeping, including student information.

🛠️ Required Files

This application requires two files to run correctly:

index.html (The main application file, including all HTML, CSS, and JavaScript).

TIMETABLE_DATA.csv (The assessment data source).

TIMETABLE_DATA.csv Structure

This CSV file must be present in the same directory as index.html and contain the following five comma-separated columns in this exact order:

Column Name

Description

Example Data

UnitCode

The Unit of Competency code.

HLTDA001

UnitDescription

Full name of the Unit.

Assist with dental procedures

AssessmentName

Short name (e.g., Task 1).

Task 1

AssessmentDescription

Detailed name of the specific assessment.

Written Knowledge Assessment

DaysRequired

The standard working days needed for completion (integer).

10

🚀 How to Use

Ensure Data is Ready: Place the TIMETABLE_DATA.csv file alongside index.html.

Open the App: Open index.html in any modern web browser.

Enter Details: Optionally enter the Student Name and Student Number (these are used for the printed report).

Select TPP End Date: Use the date picker to select the target end date for the student's training program (TPP End Date).

Generate Timetable: Click the Generate Timetable button.

Review Results:

The application will display the Calculated Start Date required to meet the deadline.

It will display a warning message indicating if the pace is standard, fast-tracked, or distributed.

The table will populate with the Latest Submission Date for every single assessment item.

Print/Save: Click Print Timetable to generate a clean, final document (which can typically be saved as a PDF).

📅 Scheduling Logic Explained

The core of the application uses the following logic to determine the schedule:

Total Required Days (TRD): Sums the DaysRequired from the CSV to get the total number of working days needed for all assessments at the standard pace.

Total Available Days (TAD): Counts the actual working days (Mon-Fri, excluding holidays) between today and the TPP End Date.

Determine Pace:

If TAD > TRD (with a buffer): The pace is Distributed (Distribution Ratio > 1.0). The system starts the schedule today and stretches the required days for each task to fill the available time.

If TAD < TRD but compression works: The pace is Fast Track (Distribution Ratio = 0.8). The system uses the compressed schedule and issues a warning about the demanding pace.

If TAD ≈ TRD (or compression is required but fails): The pace is Standard (Distribution Ratio = 1.0).

Backward Calculation: Starting with the TPP End Date as the final submission date, the app works backward, subtracting the Adjusted Days Required for each task sequentially, ensuring the resulting commencement date for the prior task is always a valid working day.
