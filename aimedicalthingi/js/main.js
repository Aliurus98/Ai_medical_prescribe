

// Import functions and elements from other modules
import { elements, openModal, closeModal, showLoading, hideLoading, setPrescriptionDetails } from './dom-elements.js';
import { analyzePrescriptionImage } from './api-service.js';
import { formatPrescriptionDetails } from './formatter.js';

// Attach event listeners for file uploads
elements.fileInputs.forEach(input => {
    input.addEventListener('change', handleImageUpload);
});

// Attach event listener for closing modal by clicking outside
window.addEventListener('click', (event) => {
    if (event.target === elements.prescriptionModal) {
        closeModal();
    }
});

// Attach event listeners for closing modal with the buttons inside
// Ensure the IDs 'modalCloseSpan' and 'modalCloseButton' are correctly in your HTML
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

// ... (rest of handleImageUpload function remains the same)
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    setPrescriptionDetails('<p>Processing your prescription...</p>');
    showLoading();
    openModal();

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64ImageData = reader.result.split(',')[1]; // Get base64 part
        try {
            const rawExtractedText = await analyzePrescriptionImage(base64ImageData);
            const formattedHtml = formatPrescriptionDetails(rawExtractedText);
            setPrescriptionDetails(formattedHtml);
        } catch (error) {
            console.error('Error during image upload and analysis:', error);
            setPrescriptionDetails(`<p class="text-red-400">Error: ${error.message || 'Failed to process prescription. Please try again.'}</p>`);
        } finally {
            hideLoading();
        }
    };
    reader.readAsDataURL(file);

    // Reset file input to allow uploading the same file again
    event.target.value = null;
}