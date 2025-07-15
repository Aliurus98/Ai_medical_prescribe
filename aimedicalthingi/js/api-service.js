

const API_KEY = "AIzaSyDR2gji0oSVPO40AjCzezedf1T1duktw8w"; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export async function analyzePrescriptionImage(base64ImageData) {
    const prompt = `
Analyze the following prescription image and extract ALL information in EXACTLY this structured format. Follow the format precisely with the exact headers and structure shown below:

**Patient Information:**
Patient Name: [Extract patient name or write "Not visible"]
Doctor Name: [Extract doctor name or write "Not visible"] 
Clinic/Hospital Name: [Extract clinic/hospital name or write "Not visible"]
Address: [Extract address or write "Not visible"]
Date of Prescription: [Extract date or write "Not visible"]

**Medication(s):**

**Medication 1:**
* Name: [Medication name or "Not visible"]
* Dosage: [Exact dosage like "100mg - 1 tab" or "Not visible"]
* Frequency: [How often like "BID (twice a day)" or "Not visible"]
* Duration: [How long like "7 days" or "N/A" if not specified]
* Instructions: [Special instructions or "N/A" if none]

**Medication 2:**
* Name: [Medication name or "Not visible"]
* Dosage: [Exact dosage or "Not visible"]
* Frequency: [How often or "Not visible"]
* Duration: [How long or "N/A" if not specified]
* Instructions: [Special instructions or "N/A" if none]

[Continue this pattern for ALL medications found - add Medication 3, 4, 5, etc. as needed]

**Other Notes/Instructions:**
Refills: [Number of refills allowed or "Not visible"]
Label: [Any label instructions or "Not visible"]

IMPORTANT FORMATTING RULES:
1. Use EXACTLY the headers shown above with double asterisks (**)
2. For medications, use the exact format "**Medication X:**" where X is the number
3. Under each medication, use bullet points with single asterisks (*)
4. Always include ALL fields even if "Not visible" or "N/A"
5. If you find more than 2 medications, add them as Medication 3, Medication 4, etc.
6. Do not add any extra text, explanations, or formatting outside this structure
7. If the image is not a prescription or unreadable, write only: "ERROR: Image is not a readable prescription"

Extract every piece of visible text from the prescription, even if handwritten or partially unclear. If text is partially visible, write what you can see followed by "[partially visible]".
    `;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg", // Assuming jpeg, adjust if necessary
                            data: base64ImageData
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            topK: 40
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response:", errorBody);
            throw new Error("Failed to analyze prescription from API.");
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0 &&
            result.candidates[0].content.parts[0].text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Unexpected API response structure:", result);
            return "Could not extract details from the prescription due to unexpected API response.";
        }

    } catch (error) {
        console.error('Error in analyzePrescriptionImage:', error);
        throw new Error(`An unexpected error occurred during API call: ${error.message}`);
    }
}