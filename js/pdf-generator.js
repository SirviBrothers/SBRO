// Utility to convert numbers to words for the invoice
function numberToWords(num) {
    if (num === 0) return 'Zero';
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

class PDFGenerator {
    static _prepareTemplate(billData) {
        document.getElementById('inv-buyer-name').innerText = billData.buyerName || 'N/A';
        document.getElementById('inv-buyer-mobile').innerText = billData.mobile || 'N/A';
        document.getElementById('inv-buyer-address').innerText = billData.address || 'N/A';
        document.getElementById('inv-date').innerText = billData.date || new Date().toISOString().split('T')[0];
        document.getElementById('inv-number').innerText = billData.invoiceNo;

        const tbody = document.querySelector('#inv-items-table tbody');
        tbody.innerHTML = '';
        
        billData.items.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td style="text-align: left;">${item.category} - ${item.brand} (${item.variant})</td>
                <td style="text-align: center;">${item.hsn || ''}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">₹ ${item.price.toFixed(2)}</td>
                <td style="text-align: right;">₹ ${item.amount.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('inv-total-amount').innerText = `₹ ${billData.total.toFixed(2)}`;
        
        if (billData.dueAmount > 0) {
            document.getElementById('inv-paid-row').style.display = 'table-row';
            document.getElementById('inv-paid-amount').innerText = `₹ ${billData.paidAmount.toFixed(2)}`;
            document.getElementById('inv-due-row').style.display = 'table-row';
            document.getElementById('inv-due-amount').innerText = `₹ ${billData.dueAmount.toFixed(2)}`;
        } else {
            document.getElementById('inv-paid-row').style.display = 'none';
            document.getElementById('inv-due-row').style.display = 'none';
        }

        document.getElementById('inv-amount-words').innerText = numberToWords(Math.round(billData.total));

        const element = document.getElementById('invoice-template');
        return element;
    }

    static _getOptions(billData) {
        return {
            margin:       0.5,
            filename:     `Invoice_${billData.invoiceNo}_${billData.buyerName.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
    }

    static async generate(billData) {
        const element = this._prepareTemplate(billData);
        const wrapper = document.getElementById('invoice-template-wrapper');
        wrapper.style.display = 'block';

        try {
            await html2pdf().set(this._getOptions(billData)).from(element).save();
        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            wrapper.style.display = 'none';
        }
    }

    static async generateBlob(billData) {
        const element = this._prepareTemplate(billData);
        const wrapper = document.getElementById('invoice-template-wrapper');
        wrapper.style.display = 'block';

        try {
            const pdfBlob = await html2pdf().set(this._getOptions(billData)).from(element).output('blob');
            return pdfBlob;
        } catch (error) {
            console.error("PDF Blob generation failed:", error);
            throw error;
        } finally {
            wrapper.style.display = 'none';
        }
    }
}
