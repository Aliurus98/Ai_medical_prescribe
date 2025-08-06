import { elements, openModal, closeModal, showLoading, hideLoading, setPrescriptionDetails } from './dom-elements.js';
import { ApiService } from './services/api.service.js';

const GEMINI_API_KEY = "REDACTED_API_KEY"; // Replace with your actual Gemini API key
const MEDICINE_API_URL = "http://127.0.0.1:5000";

//instance of ApiService 
const apiService = new ApiService(GEMINI_API_KEY, MEDICINE_API_URL);

// Event listeners
elements.fileInputs.forEach(input => {
    input.addEventListener('change', handleImageUpload);
});

window.addEventListener('click', (event) => {
    if (event.target === elements.prescriptionModal) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const modalCloseSpan = document.getElementById('modalCloseSpan');
    if (modalCloseSpan) {
        modalCloseSpan.addEventListener('click', closeModal);
    }
    const modalCloseButton = document.getElementById('modalCloseButton');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }
});

async function handleImageUpload(event) {
    console.log('handleImageUpload called', event);
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    if (!file.type.startsWith('image/')) {
        setPrescriptionDetails('<p class="text-red-400">Error: Please select a valid image file.</p>');
        openModal();
        return;
    }

    setPrescriptionDetails('<p>Processing your prescription...</p>');
    openModal();

    try {
        // Complete pipeline in ApiService:
        // 1. Image → Gemini API (text extraction)
        // 2. Raw text → Formatter (initial formatting)  
        // 3. Extract medicine names
        // 4. Medicine API (spell checking)
        // 5. Replace corrected names
        // 6. Final formatting → HTML
        const finalFormattedHtml = await apiService.analyzePrescriptionImage(file);
        setPrescriptionDetails(finalFormattedHtml);
        
        console.log('Prescription processing pipeline completed successfully');
        
    } catch (error) {
        console.error('Error during prescription processing pipeline:', error);
        const errorMessage = getErrorMessage(error);
        setPrescriptionDetails(`<p class="text-red-400">Error: ${errorMessage}</p>`);
        
    } finally {
        hideLoading();
    }
    event.target.value = null;
}

function getErrorMessage(error) {
    const errorMessage = error.message || 'Unknown error occurred';
    
    if (errorMessage.includes('Failed to process prescription')) {
        return 'Unable to process the prescription. Please ensure the image is clear and try again.';
    }
    
    if (errorMessage.includes('Failed to analyze prescription image')) {
        return 'Unable to analyze the prescription image. Please ensure the image is clear and try again.';
    }
    
    if (errorMessage.includes('File must be an image')) {
        return 'Please select a valid image file (JPG, PNG, etc.).';
    }
    
    if (errorMessage.includes('No file provided')) {
        return 'No file was selected. Please choose an image file.';
    }
    
    if (errorMessage.includes('Failed to read file')) {
        return 'Unable to read the selected file. Please try again with a different image.';
    }
    
    if (errorMessage.includes('Gemini API key is required')) {
        return 'Configuration error. Please refresh the page and try again.';
    }
    
    if (errorMessage.includes('Medicine API URL is required')) {
        return 'Medicine database unavailable. Please try again later.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
    }
    return 'Failed to process prescription. Please try again.';
}

function initializeDragAndDrop() {
    elements.fileInputs.forEach(input => {
        const dropZone = input.closest('.upload-area') || input.parentElement;
        
        if (dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, preventDefaults, false);
                document.body.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, unhighlight, false);
            });
            
            // Handle dropped files
            dropZone.addEventListener('drop', handleDrop, false);
        }
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    e.currentTarget.classList.add('drag-over');
}

function unhighlight(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const fileInput = e.currentTarget.querySelector('input[type="file"]');
        if (fileInput) {
            const event = { target: { files: files, value: null } };
            handleImageUpload(event);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
});

console.log('Main.js loaded with pipeline configuration:');
console.log('- Gemini API configured:', !!GEMINI_API_KEY);
console.log('- Medicine API URL:', MEDICINE_API_URL);
console.log('- Pipeline flow: Image → Gemini → Format → Medicine API → Display');