// js/formatter.js

// Medical terminology dictionary for frequency abbreviations
const MEDICAL_FREQUENCY_DICTIONARY = {
    // Basic frequency terms
    'BID': '2 times per day',
    'TID': '3 times per day', 
    'QID': '4 times per day',
    'QD': '1 time per day',
    'QOD': 'Every other day',
    'PRN': 'As needed',
    'AC': 'Before meals',
    'PC': 'After meals',
    'HS': 'At bedtime',
    'Q4H': 'Every 4 hours',
    'Q6H': 'Every 6 hours',
    'Q8H': 'Every 8 hours',
    'Q12H': 'Every 12 hours',
    'QAM': 'Every morning',
    'QPM': 'Every evening',
    'STAT': 'Immediately',
    
    // Case variations
    'bid': '2 times per day',
    'tid': '3 times per day',
    'qid': '4 times per day',
    'qd': '1 times per day',
    'qod': 'Every other day',
    'prn': 'As needed',
    'ac': 'Before meals',
    'pc': 'After meals',
    'hs': 'At bedtime',
    'q4h': 'Every 4 hours',
    'q6h': 'Every 6 hours',
    'q8h': 'Every 8 hours',
    'q12h': 'Every 12 hours',
    'qam': 'Every morning',
    'qpm': 'Every evening',
    'stat': 'Immediately',
    
    // Alternative formats
    'b.i.d': '2 times per day',
    't.i.d': '3 times per day',
    'q.i.d': '4 times per day',
    'q.d': '1 times per day',
    'q.o.d': 'Every other day',
    'p.r.n': 'As needed',
    'a.c': 'Before meals',
    'p.c': 'After meals',
    'h.s': 'At bedtime',
    
    // Common numeric patterns
    '2x daily': '2 times per day',
    '3x daily': '3 times per day',
    '4x daily': '4 times per day',
    '1x daily': '1 times per day',
    'twice daily': '2 times per day',
    'three times daily': '3 times per day',
    'four times daily': '4 times per day',
    'once daily': '1 times per day',
    'twice a day': '2 times per day',
    'three times a day': '3 times per day',
    'four times a day': '4 times per day',
    'once a day': '1 times per day'
};

// Function to translate medical frequency terms
function translateMedicalFrequency(frequencyText) {
    if (!frequencyText) return frequencyText;
    
    let translatedText = frequencyText;
    
    // Check for exact matches first (case-insensitive)
    const lowerFrequency = frequencyText.toLowerCase().trim();
    if (MEDICAL_FREQUENCY_DICTIONARY[lowerFrequency]) {
        return MEDICAL_FREQUENCY_DICTIONARY[lowerFrequency];
    }
    
    // Check for partial matches and replace them
    Object.keys(MEDICAL_FREQUENCY_DICTIONARY).forEach(abbrev => {
        const regex = new RegExp(`\\b${abbrev.replace(/\./g, '\\.')}\\b`, 'gi');
        if (regex.test(translatedText)) {
            translatedText = translatedText.replace(regex, MEDICAL_FREQUENCY_DICTIONARY[abbrev]);
        }
    });
    
    return translatedText;
}

export function formatPrescriptionDetails(extractedText, errorMessage) {
    let htmlContent = '';

    // Clean up the extracted text - remove AI jargon and find actual prescription data
    let cleanedText = extractedText;
    
    // Find where the actual prescription data starts (look for Patient Name)
    const patientNameIndex = extractedText.indexOf('Patient Name:');
    if (patientNameIndex !== -1) {
        // Extract everything from Patient Name onwards
        cleanedText = extractedText.substring(patientNameIndex);
    } else {
        // Alternative patterns to look for
        const altPatterns = ['***Patient Name:', '**Patient Name:', '*Patient Name:'];
        for (const pattern of altPatterns) {
            const index = extractedText.indexOf(pattern);
            if (index !== -1) {
                cleanedText = extractedText.substring(index);
                break;
            }
        }
    }
    
    // Remove common AI prefixes if they still exist
    cleanedText = cleanedText.replace(/^Here's the extracted information from the prescription image:\s*/i, '');
    cleanedText = cleanedText.replace(/^The extracted information from the prescription:\s*/i, '');
    cleanedText = cleanedText.replace(/^Extracted prescription details:\s*/i, '');
    
    // Split the cleaned text into sections - but also handle the whole text as one block
    const sections = cleanedText.split('\n\n');
    // Also try splitting by major sections
    const wholeSections = cleanedText.split(/\*\*[A-Za-z]/);

    let patientInfo = {};
    let medications = [];
    let otherNotes = {};

    // Parse patient information - look for lines with patient details
    const lines = cleanedText.split('\n');
    
    lines.forEach(line => {
        line = line.trim();
        
        // Patient information parsing
        if (line.includes('Patient Name:')) {
            patientInfo.name = line.split('Patient Name:')[1]?.replace(/\*/g, '').trim();
        }
        if (line.includes('Doctor Name:')) {
            patientInfo.doctor = line.split('Doctor Name:')[1]?.replace(/\*/g, '').trim();
        }
        if (line.includes('Clinic/Hospital Name:')) {
            patientInfo.clinic = line.split('Clinic/Hospital Name:')[1]?.replace(/\*/g, '').trim();
        }
        if (line.includes('Address:')) {
            patientInfo.address = line.split('Address:')[1]?.replace(/\*/g, '').trim();
        }
        if (line.includes('Date of Prescription:')) {
            patientInfo.date = line.split('Date of Prescription:')[1]?.replace(/\*/g, '').trim();
        }
        
        // Refill information parsing
        if (line.includes('Refills:')) {
            otherNotes.refills = line.split('Refills:')[1]?.replace(/\*/g, '').trim();
        }
        if (line.includes('Label:')) {
            otherNotes.label = line.split('Label:')[1]?.replace(/\*/g, '').trim();
        }
    });

    // Enhanced medication parsing - look for medication patterns
    let currentMedication = {};
    let insideMedicationSection = false;
    
    lines.forEach((line, index) => {
        line = line.trim();
        
        // Check if we're entering the medication section
        if (line.includes('Medication(s):')) {
            insideMedicationSection = true;
            return;
        }
        
        // Check if we're leaving the medication section
        if (line.includes('Other Notes/Instructions:')) {
            insideMedicationSection = false;
            // Save last medication if exists
            if (Object.keys(currentMedication).length > 0 && currentMedication.name) {
                // Translate frequency before saving
                if (currentMedication.frequency) {
                    currentMedication.frequency = translateMedicalFrequency(currentMedication.frequency);
                }
                medications.push(currentMedication);
                currentMedication = {};
            }
            return;
        }
        
        if (insideMedicationSection) {
            // Look for medication number/name patterns
            if (line.includes('Medication ') && line.includes(':')) {
                // Save previous medication if it exists
                if (Object.keys(currentMedication).length > 0 && currentMedication.name) {
                    // Translate frequency before saving
                    if (currentMedication.frequency) {
                        currentMedication.frequency = translateMedicalFrequency(currentMedication.frequency);
                    }
                    medications.push(currentMedication);
                }
                // Start new medication
                currentMedication = {};
            }
            // Look for Name field
            else if (line.includes('Name:')) {
                const name = line.split('Name:')[1]?.replace(/\*/g, '').trim();
                if (name) {
                    currentMedication.name = name;
                }
            }
            // Look for Dosage field
            else if (line.includes('Dosage:')) {
                const dosage = line.split('Dosage:')[1]?.replace(/\*/g, '').trim();
                if (dosage) {
                    currentMedication.dosage = dosage;
                }
            }
            // Look for Frequency field
            else if (line.includes('Frequency:')) {
                const frequency = line.split('Frequency:')[1]?.replace(/\*/g, '').trim();
                if (frequency) {
                    currentMedication.frequency = frequency; // Will be translated later
                }
            }
            // Look for Duration field
            else if (line.includes('Duration:')) {
                const duration = line.split('Duration:')[1]?.replace(/\*/g, '').trim();
                if (duration && duration !== 'N/A') {
                    currentMedication.duration = duration;
                }
            }
            // Look for Instructions field
            else if (line.includes('Instructions:')) {
                const instructions = line.split('Instructions:')[1]?.replace(/\*/g, '').trim();
                if (instructions && instructions !== 'N/A') {
                    currentMedication.instructions = instructions;
                }
            }
        }
    });
    
    // Don't forget to add the last medication if we were still parsing
    if (Object.keys(currentMedication).length > 0 && currentMedication.name) {
        // Translate frequency before saving
        if (currentMedication.frequency) {
            currentMedication.frequency = translateMedicalFrequency(currentMedication.frequency);
        }
        medications.push(currentMedication);
    }

    // Alternative parsing method if the above didn't work
    if (medications.length === 0) {
        // Try regex pattern matching for medication blocks
        const medicationRegex = /\*\*Medication \d+:\*\*\s*\*\s*Name:\s*([^\n*]+)\s*\*\s*Dosage:\s*([^\n*]+)\s*\*\s*Frequency:\s*([^\n*]+)/g;
        let match;
        
        while ((match = medicationRegex.exec(extractedText)) !== null) {
            medications.push({
                name: match[1].trim(),
                dosage: match[2].trim(),
                frequency: translateMedicalFrequency(match[3].trim()) // Translate frequency here too
            });
        }
        
        // If regex didn't work, try another approach - split by medication markers
        if (medications.length === 0) {
            const medicationBlocks = extractedText.split(/\*\*Medication \d+:\*\*/);
            
            medicationBlocks.forEach((block, index) => {
                if (index === 0) return; // Skip the first empty split
                
                const med = {};
                const blockLines = block.split('\n');
                
                blockLines.forEach(line => {
                    line = line.trim();
                    if (line.includes('Name:')) {
                        med.name = line.split('Name:')[1]?.replace(/\*/g, '').trim();
                    }
                    if (line.includes('Dosage:')) {
                        med.dosage = line.split('Dosage:')[1]?.replace(/\*/g, '').trim();
                    }
                    if (line.includes('Frequency:')) {
                        const freq = line.split('Frequency:')[1]?.replace(/\*/g, '').trim();
                        med.frequency = translateMedicalFrequency(freq); // Translate frequency
                    }
                    if (line.includes('Duration:') && !line.includes('N/A')) {
                        med.duration = line.split('Duration:')[1]?.replace(/\*/g, '').trim();
                    }
                    if (line.includes('Instructions:') && !line.includes('N/A')) {
                        med.instructions = line.split('Instructions:')[1]?.replace(/\*/g, '').trim();
                    }
                });
                
                if (med.name) {
                    medications.push(med);
                }
            });
        }
    }

    // Debug logging
    console.log('Patient Info:', patientInfo);
    console.log('Medications:', medications);
    console.log('Other Notes:', otherNotes);

    // Check if we extracted any meaningful data
    const hasPatientInfo = patientInfo.name || patientInfo.doctor || patientInfo.clinic;
    const hasMedications = medications.length > 0;
    const hasOtherNotes = Object.keys(otherNotes).length > 0;

    // If no meaningful data was extracted, show debugging fallback
    if (!hasPatientInfo && !hasMedications && !hasOtherNotes) {
        return `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #dc2626; border-radius: 0.5rem; color: white;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">⚠️ Parsing Failed - Debug Information</h3>
                <p style="margin-bottom: 1rem;">Could not extract prescription details. Here's the raw data for debugging:</p>
                
                <details style="margin-bottom: 1rem;">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">🔍 Original AI Response</summary>
                    <pre style="background-color: #450a0a; padding: 1rem; border-radius: 0.25rem; white-space: pre-wrap; word-wrap: break-word; font-size: 0.875rem; overflow-x: auto;">${extractedText}</pre>
                </details>
                
                <details style="margin-bottom: 1rem;">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">🧹 Cleaned Text</summary>
                    <pre style="background-color: #450a0a; padding: 1rem; border-radius: 0.25rem; white-space: pre-wrap; word-wrap: break-word; font-size: 0.875rem; overflow-x: auto;">${cleanedText}</pre>
                </details>
                
                <details>
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">🔧 Parsing Results</summary>
                    <div style="background-color: #450a0a; padding: 1rem; border-radius: 0.25rem; font-size: 0.875rem;">
                        <p><strong>Patient Info Found:</strong> ${JSON.stringify(patientInfo, null, 2)}</p>
                        <p><strong>Medications Found:</strong> ${JSON.stringify(medications, null, 2)}</p>
                        <p><strong>Other Notes Found:</strong> ${JSON.stringify(otherNotes, null, 2)}</p>
                    </div>
                </details>
            </div>
        `;
    }

    // --- Build HTML Content ---

    // Patient Information Section
    htmlContent += `
        <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #374151; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: white;">Patient Information</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; color: #d1d5db;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500; color: #60a5fa;">Name:</span>
                    <span>${patientInfo.name || 'N/A'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500; color: #60a5fa;">Doctor:</span>
                    <span>${patientInfo.doctor || 'N/A'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500; color: #60a5fa;">Clinic:</span>
                    <span>${patientInfo.clinic || 'N/A'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500; color: #60a5fa;">Address:</span>
                    <span>${patientInfo.address || 'N/A'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500; color: #60a5fa;">Date Issued:</span>
                    <span>${patientInfo.date || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;

    // Medication Details Section
    if (medications.length > 0) {
        htmlContent += `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #374151; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: white;">Medication Details</h3>
        `;
        medications.forEach((med, index) => {
            htmlContent += `
                <div style="background-color: #4b5563; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: #34d399; margin-bottom: 0.5rem;">${med.name || 'Unknown Medication'}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; color: #d1d5db;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 500; color: #c084fc;">Dosage:</span>
                            <span>${med.dosage || 'N/A'}</span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 500; color: #c084fc;">Frequency:</span>
                            <span style="color: #fbbf24;">${med.frequency || 'N/A'}</span>
                        </div>
                        ${med.duration ? `
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 500; color: #c084fc;">Duration:</span>
                            <span>${med.duration}</span>
                        </div>` : ''}
                        ${med.instructions ? `
                        <div style="display: flex; flex-direction: column; grid-column: 1 / -1;">
                            <span style="font-weight: 500; color: #c084fc;">Instructions:</span>
                            <span>${med.instructions}</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
        });
        htmlContent += `</div>`;
    } else {
        htmlContent += `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #374151; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: white;">Medication Details</h3>
                <p style="color: #fbbf24;">No medications found in the prescription text.</p>
            </div>
        `;
    }

    // Refill Information Section
    if (Object.keys(otherNotes).length > 0) {
        htmlContent += `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #374151; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: white;">Refill Information</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; color: #d1d5db;">
                    ${otherNotes.refills ? `
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500; color: #60a5fa;">Refills:</span>
                        <span>${otherNotes.refills}</span>
                    </div>` : ''}
                    ${otherNotes.label ? `
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500; color: #60a5fa;">Label:</span>
                        <span>${otherNotes.label}</span>
                    </div>` : ''}
                </div>
                <p style="color: #9ca3af; margin-top: 1rem;">Please contact your doctor or clinic to request a refill. Refills are not available online for this prescription.</p>
                <button style="background-color: #059669; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; margin-top: 1rem; cursor: pointer; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#047857'" onmouseout="this.style.backgroundColor='#059669'">Contact Clinic for Refill!</button>
            </div>
        `;
    } else {
        htmlContent += `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #374151; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: white;">Refill Information</h3>
                <p style="color: #fbbf24;">No refill information found in the prescription.</p>
            </div>
        `;
    }

    return htmlContent;
}