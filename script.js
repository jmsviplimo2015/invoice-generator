window.addEventListener('DOMContentLoaded', () => {
    const formFrame = document.getElementById('formFrame');
    const previewFrame = document.getElementById('previewFrame');
    const downloadPdfButton = document.getElementById('downloadPdfButton');

    let formDoc;
    let previewDoc;
    let form;

    // Wait for iframes to load
    let formLoaded = false;
    let previewLoaded = false;

    formFrame.onload = () => {
        formDoc = formFrame.contentDocument || formFrame.contentWindow.document;
        form = formDoc.getElementById('invoiceForm');
        addFormEventListeners();
        formLoaded = true;
        if (previewLoaded) initializeAndUpdatePreview();
    };

    previewFrame.onload = () => {
        previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        previewLoaded = true;
        if (formLoaded) initializeAndUpdatePreview();
    };
    
    function initializeAndUpdatePreview() {
        updatePreview(); // Initial population
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone interpretation
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12; // Convert 0 to 12 for 12 AM/PM
        return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    function formatCurrency(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return '$0.00';
        return `$${num.toFixed(2)}`;
    }
    
    function formatNegativeCurrency(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return '$0.00';
        return `-$${Math.abs(num).toFixed(2)}`;
    }


    function addFormEventListeners() {
        if (!form) return;
        Array.from(form.elements).forEach(element => {
            element.addEventListener('input', updatePreview);
            if (element.type === 'checkbox' || element.type === 'radio') {
                 element.addEventListener('change', updatePreview);
            }
        });

        const rateTypeRadios = formDoc.querySelectorAll('input[name="rateType"]');
        rateTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const flatRateSection = formDoc.getElementById('flatRateSection');
                const hourlyRateSection = formDoc.getElementById('hourlyRateSection');
                if (formDoc.getElementById('rateTypeFlat').checked) {
                    flatRateSection.classList.remove('hidden');
                    hourlyRateSection.classList.add('hidden');
                } else {
                    flatRateSection.classList.add('hidden');
                    hourlyRateSection.classList.remove('hidden');
                }
                updatePreview();
            });
        });
        
        const showDiscountCheckbox = formDoc.getElementById('showDiscount');
        showDiscountCheckbox.addEventListener('change', () => {
            formDoc.getElementById('discountOptions').style.display = showDiscountCheckbox.checked ? 'block' : 'none';
            updatePreview();
        });
        // Initial state for discount options
        formDoc.getElementById('discountOptions').style.display = showDiscountCheckbox.checked ? 'block' : 'none';
        
        // Initial state for rate sections
        if (formDoc.getElementById('rateTypeFlat').checked) {
            formDoc.getElementById('flatRateSection').classList.remove('hidden');
            formDoc.getElementById('hourlyRateSection').classList.add('hidden');
        } else {
            formDoc.getElementById('flatRateSection').classList.add('hidden');
            formDoc.getElementById('hourlyRateSection').classList.remove('hidden');
        }
    }

    function updatePreview() {
        if (!formDoc || !previewDoc || !form) return;

        // Company & Invoice Info
        previewDoc.getElementById('mainLogo').src = formDoc.getElementById('logoUrl').value;
        previewDoc.getElementById('watermarkLogo').src = formDoc.getElementById('logoUrl').value;
        previewDoc.getElementById('companyNameDisplay').textContent = formDoc.getElementById('companyName').value;
        previewDoc.getElementById('companyAddressDisplay').textContent = formDoc.getElementById('companyAddress').value;
        previewDoc.getElementById('invoiceDateDisplay').textContent = formatDate(formDoc.getElementById('invoiceDate').value);
        
        previewDoc.getElementById('companyPhoneDisplay').textContent = formDoc.getElementById('companyPhone').value;
        previewDoc.getElementById('companyWebsiteDisplay').textContent = formDoc.getElementById('companyWebsite').value;
        previewDoc.getElementById('companyEmailDisplay').textContent = formDoc.getElementById('companyEmail').value;


        // Confirmation
        previewDoc.getElementById('confirmationNumberDisplay').textContent = formDoc.getElementById('confirmationNumber').value;
        previewDoc.getElementById('farmInConfirmationDisplay').textContent = formDoc.getElementById('farmInConfirmation').value;

        // Trip Details
        const pickupDateVal = formDoc.getElementById('pickupDate').value;
        previewDoc.getElementById('pickupDateDisplay').textContent = formatDate(pickupDateVal);
        previewDoc.getElementById('vehicleDisplay').textContent = formDoc.getElementById('vehicle').value;
        previewDoc.getElementById('reservationPickupTimeDisplay').textContent = formatTime(formDoc.getElementById('reservationPickupTime').value);
        previewDoc.getElementById('pickupTimeDisplay').textContent = formatTime(formDoc.getElementById('pickupTime').value);
        previewDoc.getElementById('dropOffTimeDisplay').textContent = formatTime(formDoc.getElementById('dropOffTime').value);
        previewDoc.getElementById('pickupPointDisplay').textContent = formDoc.getElementById('pickupPoint').value;
        previewDoc.getElementById('primaryPassengerDisplay').textContent = formDoc.getElementById('primaryPassenger').value;
        previewDoc.getElementById('additionalPassengerLuggageDisplay').textContent = formDoc.getElementById('additionalPassengerLuggage').value;
        previewDoc.getElementById('stopDetailsDisplay').textContent = formDoc.getElementById('stopDetails').value;
        previewDoc.getElementById('dropOffLocationDisplay').textContent = formDoc.getElementById('dropOffLocation').value;
        
        // Financial Calculations
        let baseRate = 0;
        const isFlatRate = formDoc.getElementById('rateTypeFlat').checked;
        
        previewDoc.getElementById('flatRateRow').style.display = isFlatRate ? '' : 'none';
        previewDoc.getElementById('hourlyRateRow').style.display = isFlatRate ? 'none' : '';

        if (isFlatRate) {
            baseRate = parseFloat(formDoc.getElementById('flatRate').value) || 0;
            previewDoc.getElementById('flatRateDescription').textContent = ''; // Or some default message
            previewDoc.getElementById('flatRateValueDisplay').textContent = formatCurrency(baseRate);
        } else {
            const hourlyRate = parseFloat(formDoc.getElementById('hourlyRate').value) || 0;
            const hours = parseFloat(formDoc.getElementById('hours').value) || 0;
            const minutes = parseFloat(formDoc.getElementById('minutes').value) || 0;
            baseRate = hourlyRate * (hours + minutes / 60);
            previewDoc.getElementById('hourlyRateDescription').textContent = `${hours}h ${minutes}m @ ${formatCurrency(hourlyRate)}/hr`;
            previewDoc.getElementById('hourlyRateValueDisplay').textContent = formatCurrency(baseRate);
        }

        const stopsCharge = parseFloat(formDoc.getElementById('stopsCharge').value) || 0;
        const waitingTimeCharge = parseFloat(formDoc.getElementById('waitingTimeCharge').value) || 0;
        const tollCharge = parseFloat(formDoc.getElementById('tollCharge').value) || 0;
        const serviceCharge = parseFloat(formDoc.getElementById('serviceCharge').value) || 0;

        previewDoc.getElementById('stopsChargeDisplay').textContent = formatCurrency(stopsCharge);
        previewDoc.getElementById('waitingTimeChargeDisplay').textContent = formatCurrency(waitingTimeCharge);
        previewDoc.getElementById('tollChargeDisplay').textContent = formatCurrency(tollCharge);
        previewDoc.getElementById('serviceChargeDisplay').textContent = formatCurrency(serviceCharge);

        // Gratuity is calculated on (baseRate + stopsCharge + waitingTimeCharge + tollCharge + serviceCharge)
        // As per initial understanding, but example invoice has specific calculation.
        // Let's follow the example's logic for tax and discount calculation.
        // Tax is on baseRate (Flat/Hourly).
        // Discount is on (baseRate + serviceCharge + taxAmount).
        // Gratuity, if added, would typically be on (baseRate + serviceCharge).

        let subtotalForGratuity = baseRate + serviceCharge + stopsCharge + waitingTimeCharge + tollCharge; // Common base for gratuity
        const gratuityPercent = parseFloat(formDoc.getElementById('gratuityPercent').value) || 0;
        const gratuityAmount = subtotalForGratuity * (gratuityPercent / 100);
        
        previewDoc.getElementById('gratuityDescriptionDisplay').textContent = gratuityPercent > 0 ? `${gratuityPercent.toFixed(2)}%` : '';
        previewDoc.getElementById('gratuityValueDisplay').textContent = formatCurrency(gratuityAmount);
        if (gratuityAmount > 0) {
            previewDoc.getElementById('gratuityRow').style.display = '';
        } else {
             previewDoc.getElementById('gratuityRow').style.display = 'none'; // Hide if zero
        }


        const taxPercent = parseFloat(formDoc.getElementById('taxPercent').value) || 0;
        // Based on example, tax is on baseRate only.
        const taxAmount = baseRate * (taxPercent / 100);
        previewDoc.getElementById('taxDescriptionDisplay').textContent = `${taxPercent.toFixed(2)}%`;
        previewDoc.getElementById('taxValueDisplay').textContent = formatCurrency(taxAmount);
        
        const showDiscount = formDoc.getElementById('showDiscount').checked;
        let discountAmount = 0;
        const discountRow = previewDoc.getElementById('discountRow');

        if (showDiscount) {
            const discountPercent = parseFloat(formDoc.getElementById('discountPercent').value) || 0;
            const discountMessage = formDoc.getElementById('discountMessage').value || `${discountPercent.toFixed(2)}%`;
            
            // Based on example, discount is on (baseRate + serviceCharge + taxAmount + gratuityAmount + other fixed charges)
            const baseForDiscount = baseRate + serviceCharge + taxAmount + gratuityAmount + stopsCharge + waitingTimeCharge + tollCharge;
            discountAmount = baseForDiscount * (discountPercent / 100);
            
            previewDoc.getElementById('discountMessageDisplay').textContent = discountMessage;
            previewDoc.getElementById('discountValueDisplay').textContent = formatNegativeCurrency(discountAmount);
            discountRow.style.display = '';
        } else {
            discountRow.style.display = 'none';
        }

        const total = baseRate + stopsCharge + waitingTimeCharge + tollCharge + serviceCharge + gratuityAmount + taxAmount - discountAmount;
        previewDoc.getElementById('totalValueDisplay').textContent = formatCurrency(total);
    }

    downloadPdfButton.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const invoiceContent = previewDoc.getElementById('invoice-container');
        if (!invoiceContent) {
            alert("Preview content not found!");
            return;
        }

        const passengerName = formDoc.getElementById('primaryPassenger').value.trim() || "Customer";
        const pickupDate = formDoc.getElementById('pickupDate').value || new Date().toISOString().split('T')[0];
        const filename = `Customer Invoice - ${passengerName.replace(/\s+/g, '_')}-${pickupDate}.pdf`;

        downloadPdfButton.textContent = "Generating...";
        downloadPdfButton.disabled = true;

        try {
            // Inside the downloadPdfButton event listener, for html2canvas options:
            const canvas = await html2canvas(invoiceContent, {
                scale: 2,
                useCORS: true,
                logging: true,
                scrollX: 0, // Explicitly set scroll positions
                scrollY: 0,
                windowWidth: invoiceContent.scrollWidth, // Use content's scroll dimensions
                windowHeight: invoiceContent.scrollHeight,
                onclone: (clonedDoc) => {
                    // If there are any dynamic styles or elements that don't copy well,
                    // you might need to re-apply or adjust them in the clonedDoc here.
                    // For example, ensuring visibility of elements.
                    const clonedWatermark = clonedDoc.getElementById('watermark-logo-container');
                    if (clonedWatermark) {
                        clonedWatermark.style.opacity = '0.08'; // Re-assert opacity if needed
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt', // points
                format: 'letter' // or 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Calculate the aspect ratio
            const ratio = imgWidth / imgHeight;
            let newImgWidth = pdfWidth - 40; // With some margin
            let newImgHeight = newImgWidth / ratio;

            if (newImgHeight > pdfHeight - 40) {
                newImgHeight = pdfHeight - 40;
                newImgWidth = newImgHeight * ratio;
            }
            
            const x = (pdfWidth - newImgWidth) / 2;
            const y = 20; // Top margin

            pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);
            pdf.save(filename);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Check console for details.");
        } finally {
            downloadPdfButton.textContent = "Download Invoice as PDF";
            downloadPdfButton.disabled = false;
        }
    });
});
