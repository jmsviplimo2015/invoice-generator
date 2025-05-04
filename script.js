document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('invoice-form');
    const preview = document.getElementById('invoice-preview');
    const generatePdfButton = document.getElementById('generate-pdf');

    // --- Helper Functions ---
    const formatCurrency = (amount, addParenthesesForNegative = false) => {
        const value = Number(amount);
        const formatted = `$${Math.abs(value).toFixed(2)}`;
        if (addParenthesesForNegative && value < 0) {
            return `(${formatted})`;
        }
         if (!addParenthesesForNegative && value < 0){
             return `-${formatted}`; // Show negative discount with minus sign
         }
        return formatted;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${month}/${day}/${year}`;
    };

    const formatFilenameDate = (dateString) => {
         if (!dateString) return 'nodate';
         return dateString; // YYYY-MM-DD is fine for filenames
    }

    const formatTime = (timeString) => {
         if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hours12 = (parseInt(hours) % 12) || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const getVal = (id) => document.getElementById(id)?.value || '';
    const getNum = (id) => parseFloat(document.getElementById(id)?.value) || 0;

    // --- Update Preview Function ---
    const updatePreview = () => {
        // Header & Confirmation
        document.getElementById('preview-companyName').textContent = getVal('companyName');
        document.getElementById('preview-companyAddress').textContent = getVal('companyAddress');
        document.getElementById('preview-invoiceDate').textContent = formatDate(getVal('invoiceDate'));
        document.getElementById('preview-confirmationNumber').textContent = getVal('confirmationNumber');
        document.getElementById('preview-farmInConfirmation').textContent = getVal('farmInConfirmation');

        // Ride Details
        document.getElementById('preview-pickupDate').textContent = formatDate(getVal('pickupDate'));
        document.getElementById('preview-vehicle').textContent = getVal('vehicle');
        document.getElementById('preview-reservationTime').textContent = formatTime(getVal('reservationTime'));
        document.getElementById('preview-pickupTime').textContent = formatTime(getVal('pickupTime'));
        document.getElementById('preview-dropoffTime').textContent = formatTime(getVal('dropoffTime'));
        document.getElementById('preview-pickupPoint').textContent = getVal('pickupPoint');
        document.getElementById('preview-primaryPassenger').textContent = getVal('primaryPassenger');
        document.getElementById('preview-additionalPassengers').textContent = getVal('additionalPassengers');
        document.getElementById('preview-stopLocation').textContent = getVal('stopLocation');
        document.getElementById('preview-dropoffLocation').textContent = getVal('dropoffLocation');

        // Billing Calculations
        const flatHours = getNum('flatHours');
        const flatMins = getNum('flatMins');
        const flatRate = getNum('flatRate');
        const stopsCost = getNum('stopsCost');
        const waitingCost = getNum('waitingCost');
        const tollCost = getNum('tollCost');
        const serviceCharge = getNum('serviceCharge');
        const discountAmount = getNum('discountAmount');
        const gratuityPercent = getNum('gratuityPercent');
        const taxPercent = getNum('taxPercent');

        // Calculate Flat Total
        const totalHours = flatHours + (flatMins / 60);
        const flatTotal = totalHours * flatRate;

        // --- MODIFIED CALCULATION BASES ---
        // Calculate Gratuity ONLY on the flatTotal
        // Ensure base is not negative
        const gratuityBase = Math.max(0, flatTotal);
        const gratuityAmount = gratuityBase * (gratuityPercent / 100);

        // Calculate Tax ONLY on the flatTotal
        // Ensure base is not negative
        const taxBase = Math.max(0, flatTotal);
        const taxAmount = taxBase * (taxPercent / 100);
        // --- END OF MODIFIED BASES ---

        // Calculate the sum of all charges BEFORE discount
        const baseChargesTotal = flatTotal + stopsCost + waitingCost + tollCost + serviceCharge;

        // Calculate the final total including all charges, discount, and the *newly calculated* gratuity/tax
        const grandTotal = baseChargesTotal - discountAmount + gratuityAmount + taxAmount;


        // Update Billing Preview
        document.getElementById('preview-flatDescription').textContent = `${flatHours} H ${flatMins} Mins x ${formatCurrency(flatRate)}`;
        document.getElementById('preview-flatTotal').textContent = formatCurrency(flatTotal);
        document.getElementById('preview-stopsCost').textContent = formatCurrency(stopsCost);
        document.getElementById('preview-waitingCost').textContent = formatCurrency(waitingCost);
        document.getElementById('preview-tollCost').textContent = formatCurrency(tollCost);
        document.getElementById('preview-serviceCharge').textContent = formatCurrency(serviceCharge);
        document.getElementById('preview-discountAmount').textContent = formatCurrency(-discountAmount); // Show discount as negative

        document.getElementById('preview-gratuityPercent').textContent = `${gratuityPercent}%`;
        document.getElementById('preview-gratuityAmount').textContent = formatCurrency(gratuityAmount); // Display the newly calculated gratuity

        document.getElementById('preview-taxPercent').textContent = `${taxPercent}%`;
        document.getElementById('preview-taxAmount').textContent = formatCurrency(taxAmount); // Display the newly calculated tax

        document.getElementById('preview-totalAmount').textContent = formatCurrency(grandTotal); // Display the final grand total

        // Footer
        document.getElementById('preview-footerPhone').textContent = getVal('footerPhone');
        document.getElementById('preview-footerWebsite').textContent = getVal('footerWebsite');
        document.getElementById('preview-footerEmail').textContent = getVal('footerEmail');
    };

    // --- Event Listeners ---
    form.addEventListener('input', updatePreview);
    updatePreview(); // Initial preview update on load

    // PDF Generation (Filename part remains the same)
    generatePdfButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const invoiceElement = document.getElementById('invoice-preview');

        const customerNameRaw = getVal('primaryPassenger') || 'NoName';
        const customerNameClean = customerNameRaw.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        const invoiceDateStr = formatFilenameDate(getVal('invoiceDate'));
        const filename = `Invoice-${customerNameClean}-${invoiceDateStr}.pdf`;

        const originalShadow = invoiceElement.style.boxShadow;
        invoiceElement.style.boxShadow = 'none';

        html2canvas(invoiceElement, {
             scale: 2,
             useCORS: true
            }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            invoiceElement.style.boxShadow = originalShadow;

            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);
        }).catch(err => {
            console.error("Error generating PDF:", err);
             invoiceElement.style.boxShadow = originalShadow;
        });
    });
});
