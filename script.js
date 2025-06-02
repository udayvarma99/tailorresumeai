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
        console.error("One or more critical UI elements are missing from the HTML.");
        if (errorAreaEl) {
            errorAreaEl.textContent = "Page initialization error. UI elements missing.";
            errorAreaEl.style.display = 'block';
        }
        return;
    }

    if (resumeFileEl && fileInfoDisplayEl) {
        resumeFileEl.addEventListener('change', () => {
            if (resumeFileEl.files.length > 0) {
                fileInfoDisplayEl.textContent = `Selected: ${resumeFileEl.files[0].name}`;
            } else {
                fileInfoDisplayEl.textContent = '';
            }
        });
    }

    tailorForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const jobDescription = jobDescriptionEl.value.trim();
        const resumeFile = resumeFileEl.files[0];

        // Clear previous states
        errorAreaEl.style.display = 'none';
        errorAreaEl.textContent = '';
        statusAreaEl.style.display = 'none';
        statusAreaEl.textContent = '';
        resultAreaEl.innerHTML = ''; // Clear previous download links

        if (!jobDescription) {
            showError("Please paste the Job Description.");
            return;
        }
        if (!resumeFile) {
            showError("Please upload your resume file.");
            return;
        }
        if (resumeFile.size > 10 * 1024 * 1024) { // 10 MB limit
            showError("File is too large. Maximum size is 10MB.");
            return;
        }

        const formData = new FormData();
        formData.append('job_description', jobDescription); // Matches backend
        formData.append('resume', resumeFile);             // Matches backend

        // UI updates for loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Processing...';
        btnLoader.style.display = 'inline-block';
        showStatus('Uploading and parsing resume...');

        try {
            // Endpoint from your backend/app.py
            const response = await fetch('http://127.0.0.1:5000/tailor_resume', {
                method: 'POST',
                body: formData,
            });

            showStatus('AI is tailoring your resume... this can take a moment.');

            if (!response.ok) {
                let errorMsg = `Server Error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = `${errorMsg}: ${errorData.error || 'Unknown server error. Check backend logs.'}`;
                } catch (jsonError) {
                    const textError = await response.text();
                    errorMsg = `${errorMsg}: ${textError || 'Could not retrieve error details. Check backend logs.'}`;
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.className = 'download-link'; // For styling if needed

            let filename = "tailored_resume.docx"; // Default
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.includes('attachment')) {
                const filenameRegex = /filename[^;=\n]*=(?:(['"])(.*?)\1|([^;\n]*))/i;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && (matches[2] || matches[3])) {
                    filename = (matches[2] || matches[3]).replace(/^["']|["']$/g, "");
                }
            }

            a.download = filename;
            a.textContent = `Download Tailored Resume (${filename.split('.').pop().toUpperCase()})`;
            resultAreaEl.appendChild(a);
            showStatus('Resume tailored successfully! Click the link to download.');
            // a.click(); // Optional: auto-click to download

            window.URL.revokeObjectURL(downloadUrl); // Clean up object URL

        } catch (error) {
            console.error('Operation failed:', error);
            showError('Error: ' + error.message + (error.message.includes("NetworkError") ? " Ensure backend server is running and accessible." : ""));
            statusAreaEl.style.display = 'none'; // Hide status if error
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Tailor My Resume';
            btnLoader.style.display = 'none';
        }
    });

    function showError(message) {
        errorAreaEl.textContent = message;
        errorAreaEl.style.display = 'block';
        statusAreaEl.style.display = 'none'; // Hide status message if there's an error
    }

    function showStatus(message) {
        statusAreaEl.textContent = message;
        statusAreaEl.style.display = 'block';
        errorAreaEl.style.display = 'none'; // Hide error message if there's a status
    }
});