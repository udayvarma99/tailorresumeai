document.addEventListener('DOMContentLoaded', () => {
    const tailorForm = document.getElementById('tailorForm');
    const jobDescriptionEl = document.getElementById('jobDescription');
    const resumeFileEl = document.getElementById('resumeFile');
    const fileInfoDisplayEl = document.getElementById('fileInfoDisplay');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    const statusAreaEl = document.getElementById('statusArea');
    const errorAreaEl = document.getElementById('errorArea');
    const resultAreaEl = document.getElementById('resultArea');

    if (!tailorForm || !jobDescriptionEl || !resumeFileEl || !submitBtn || !btnText || !btnLoader || !statusAreaEl || !errorAreaEl || !resultAreaEl) {
        console.error("One or more critical UI elements are missing from the HTML. Check IDs in index.html and script.js");
        if (errorAreaEl) { // Attempt to show error in UI if errorAreaEl exists
            errorAreaEl.textContent = "Page initialization error: Essential UI elements are missing. Please check the HTML structure.";
            errorAreaEl.style.display = 'block';
        } else { // Fallback to alert if even errorAreaEl is missing
            alert("Page initialization error: Essential UI elements are missing. Please check the HTML structure.");
        }
        return; // Stop execution if critical elements are not found
    }


    if (resumeFileEl && fileInfoDisplayEl) {
        resumeFileEl.addEventListener('change', () => {
            if (resumeFileEl.files.length > 0) {
                fileInfoDisplayEl.textContent = `Selected: ${resumeFileEl.files[0].name}`;
            } else {
                fileInfoDisplayEl.textContent = ''; // Clear if no file selected
            }
        });
    }

    tailorForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        const jobDescription = jobDescriptionEl.value.trim();
        const resumeFile = resumeFileEl.files[0];

        // Clear previous states
        errorAreaEl.style.display = 'none';
        errorAreaEl.textContent = '';
        statusAreaEl.style.display = 'none';
        statusAreaEl.textContent = '';
        resultAreaEl.innerHTML = ''; // Clear previous download links

        // --- Input Validations ---
        if (!jobDescription) {
            showError("Please paste the Job Description.");
            jobDescriptionEl.focus(); // Focus on the problematic field
            return;
        }
        if (!resumeFile) {
            showError("Please upload your resume file.");
            resumeFileEl.focus();
            return;
        }
        // Example: Validate file type more strictly on client-side (optional, backend also validates)
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(resumeFile.type)) {
            showError('Invalid file type. Please upload a PDF or DOCX file.');
            return;
        }
        if (resumeFile.size > 10 * 1024 * 1024) { // 10 MB limit
            showError("File is too large. Maximum size is 10MB.");
            return;
        }
        // --- End Input Validations ---


        const formData = new FormData();
        formData.append('job_description', jobDescription); // Key expected by backend
        formData.append('resume', resumeFile);             // Key expected by backend

        // --- UI updates for loading state ---
        submitBtn.disabled = true;
        btnText.textContent = 'Processing...'; // Change button text
        btnLoader.style.display = 'inline-block'; // Show spinner in button
        showStatus('Uploading and parsing resume...'); // Show status message
        // --- End UI updates ---

        try {
            // Ensure this URL matches your Flask backend endpoint exactly
            const response = await fetch('http://127.0.0.1:5000/tailor_resume', {
                method: 'POST',
                body: formData,
                // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
            });

            showStatus('AI is tailoring your resume... this can take a moment.');

            if (!response.ok) {
                // Attempt to parse error message from backend
                let errorMsg = `Server Error ${response.status}`;
                try {
                    const errorData = await response.json(); // Backend should send JSON for errors
                    errorMsg = `${errorMsg}: ${errorData.error || 'Unknown server error. Check backend logs.'}`;
                } catch (jsonParseError) {
                    // If backend didn't send JSON, or it was another type of error
                    const textError = await response.text(); // Get raw text
                    errorMsg = `${errorMsg}: ${textError || 'Could not retrieve detailed error. Check backend logs.'}`;
                }
                throw new Error(errorMsg); // Trigger the catch block
            }

            // --- Handle successful response (file download) ---
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.className = 'download-link'; // For styling if needed

            // Extract filename from Content-Disposition header if available
            let filename = "tailored_resume.docx"; // Sensible default
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.includes('attachment')) {
                const filenameRegex = /filename[^;=\n]*=(?:(['"])(.*?)\1|([^;\n]*))/i; // Regex to find filename
                const matches = filenameRegex.exec(disposition);
                if (matches != null && (matches[2] || matches[3])) {
                    filename = (matches[2] || matches[3]).replace(/^["']|["']$/g, ""); // Use captured group and strip quotes
                }
            }

            a.download = filename; // Set the download attribute with the filename
            a.textContent = `Download Tailored Resume (${filename.split('.').pop().toUpperCase()})`;
            resultAreaEl.appendChild(a); // Add download link to the result area
            showStatus('Resume tailored successfully! Click the link above to download.');
            // a.click(); // Optional: auto-click to initiate download. Can be disruptive.

            window.URL.revokeObjectURL(downloadUrl); // Clean up the object URL to free resources
            // --- End file download handling ---

        } catch (error) {
            console.error('Operation failed:', error); // Log full error to console for debugging
            // Display user-friendly error message. Include network error hint.
            showError('Error: ' + error.message + (error.message.includes("NetworkError") || error.message.includes("fetch") ? " Ensure backend server is running and accessible." : ""));
            statusAreaEl.style.display = 'none'; // Hide status message if there's an error
        } finally {
            // --- Reset UI regardless of success or failure ---
            submitBtn.disabled = false; // Re-enable button
            btnText.textContent = 'Tailor My Resume'; // Reset button text
            btnLoader.style.display = 'none'; // Hide button spinner
            // Keep status message if successful, otherwise it's hidden by showError
            // --- End UI reset ---
        }
    });

    // Helper function to display error messages
    function showError(message) {
        errorAreaEl.textContent = message;
        errorAreaEl.style.display = 'block';
        statusAreaEl.style.display = 'none'; // Hide status message when showing an error
    }

    // Helper function to display status messages
    function showStatus(message) {
        statusAreaEl.textContent = message;
        statusAreaEl.style.display = 'block';
        errorAreaEl.style.display = 'none'; // Hide error message when showing a status
    }
});