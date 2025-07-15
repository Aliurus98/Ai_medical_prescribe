document.getElementById('currentYear').textContent = new Date().getFullYear();

const modal = document.getElementById('prescriptionModal');
const prescriptionDetailsDiv = document.getElementById('prescriptionDetails');
const loadingIndicator = document.getElementById('loadingIndicator');

function openModal() {
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Close modal if user clicks outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    prescriptionDetailsDiv.innerHTML = '<p>Processing your prescription...</p>';
    openModal();


    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64ImageData = reader.result.split(',')[1]; // Get base64 part
        await analyzePrescription(base64ImageData);
    };
    reader.readAsDataURL(file);

    // Reset file input to allow uploading the same file again
    event.target.value = null;
}

async function analyzePrescription(base64ImageData) {
    const prompt = `
Analyze the following prescription image and extract the following information in a structured format.
If any information is not clearly visible or decipherable, indicate that.
- Patient Name (if visible)
- Doctor Name (if visible)
- Clinic/Hospital Name (if visible)
- Date of Prescription
- Medication(s): For each medication, list:
    - Name
    - Dosage (e.g., 500mg, 1 tablet)
    - Frequency (e.g., twice a day, before meals)
    - Duration (e.g., 7 days, until finished)
    - Any specific instructions (e.g., take with food)
- Any other important notes or instructions from the doctor.

Present the extracted information clearly. If the image is not a prescription or is unreadable, state that.
            `;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg", // Assuming jpeg, adjust if necessary based on actual uploads
                            data: base64ImageData
                        }
                    }
                ]
            }
        ],
         generationConfig: { // Added to try and get more consistent text output
             temperature: 0.3,
             topP: 0.9,
             topK: 40
         }
    };

    const apiKey = "api_expensive_hei "; // Replace with your actual API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response:", errorBody);
            prescriptionDetailsDiv.innerHTML = `<p class="text-red-400">Error: Failed to analyze prescription. Please try again.</p>`;
            return;
        }

        const result = await response.json();

        let extractedText = "Could not extract details from the prescription.";
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0 &&
            result.candidates[0].content.parts[0].text) {
            extractedText = result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Unexpected API response structure:", result);
        }
        prescriptionDetailsDiv.innerHTML = `<pre>${extractedText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;


    } catch (error) {
        console.error('Error analyzing prescription:', error);
        prescriptionDetailsDiv.innerHTML = `<p class="text-red-400">Error: An unexpected error occurred. Please try again.</p>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}