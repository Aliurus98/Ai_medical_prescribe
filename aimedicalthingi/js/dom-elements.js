
export const elements = {
    currentYear: document.getElementById('currentYear'),
    prescriptionModal: document.getElementById('prescriptionModal'),
    prescriptionDetailsDiv: document.getElementById('prescriptionDetails'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    fileInputs: [
        document.getElementById('prescriptionUploadNav'),
        document.getElementById('prescriptionUploadHero'),
        document.getElementById('prescriptionUploadCTA')
    ]
};


export function openModal() {
    elements.prescriptionModal.style.display = 'block';
}

export function closeModal() {
    elements.prescriptionModal.style.display = 'none';
}

export function showLoading(message = "Processing Prescription... Please Wait.") {
    elements.loadingIndicator.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>${message}`;
    elements.loadingIndicator.style.display = 'flex';
}

export function hideLoading() {
    elements.loadingIndicator.style.display = 'none';
}

export function setPrescriptionDetails(htmlContent) {
    elements.prescriptionDetailsDiv.innerHTML = htmlContent;
}

if (elements.currentYear) {
    elements.currentYear.textContent = new Date().getFullYear();
}