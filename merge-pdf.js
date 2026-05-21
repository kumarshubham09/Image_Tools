document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const pdfListContainer = document.getElementById('pdf-list-container');
    const removeBtn = document.getElementById('remove-btn');
    const convertBtn = document.getElementById('convert-btn');
    const successCard = document.getElementById('success-card');
    const mainCard = document.getElementById('main-card');
    const downloadLink = document.getElementById('download-link');
    const resetBtn = document.getElementById('reset-btn');
    
    const loader = convertBtn.querySelector('.loader');
    const btnText = convertBtn.querySelector('.btn-text');

    let pdfFiles = []; // Array of File objects

    // Update file list display
    const renderList = () => {
        pdfListContainer.innerHTML = '';
        pdfFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'download-item';
            item.style.background = 'rgba(255, 255, 255, 0.08)';
            item.style.marginBottom = '6px';
            
            const nameSpan = document.createElement('div');
            nameSpan.className = 'download-item-name';
            nameSpan.textContent = file.name;
            nameSpan.style.color = '#ffffff';
            
            const sizeSpan = document.createElement('span');
            sizeSpan.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            sizeSpan.style.color = '#94a3b8';
            sizeSpan.style.fontSize = '0.8rem';
            sizeSpan.style.marginRight = '12px';

            const rightContainer = document.createElement('div');
            rightContainer.style.display = 'flex';
            rightContainer.style.alignItems = 'center';
            rightContainer.appendChild(sizeSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.style.background = 'none';
            deleteBtn.style.border = 'none';
            deleteBtn.style.color = '#ef4444';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width:16px;height:16px;"></i>';
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                pdfFiles.splice(index, 1);
                if (pdfFiles.length === 0) {
                    resetUI();
                } else {
                    renderList();
                }
            });

            rightContainer.appendChild(deleteBtn);
            item.appendChild(nameSpan);
            item.appendChild(rightContainer);
            pdfListContainer.appendChild(item);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    // Handle File Selection
    const handleFiles = (files) => {
        const validPDFs = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        if (validPDFs.length === 0) {
            alert('Please select valid PDF files.');
            return;
        }

        pdfFiles = [...pdfFiles, ...validPDFs];
        renderList();
        previewContainer.hidden = false;
        convertBtn.disabled = false;
    };

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    });

    // Handle Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    });

    // Reset UI helper
    function resetUI() {
        fileInput.value = '';
        previewContainer.hidden = true;
        pdfListContainer.innerHTML = '';
        convertBtn.disabled = true;
        pdfFiles = [];
        mainCard.hidden = false;
        successCard.hidden = true;
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUI();
    });

    // Merge PDF Logic
    convertBtn.addEventListener('click', async () => {
        if (pdfFiles.length === 0) return;

        btnText.textContent = 'Merging PDFs...';
        loader.hidden = false;
        convertBtn.disabled = true;

        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

            // Create download URL
            const url = URL.createObjectURL(mergedPdfBlob);
            downloadLink.href = url;
            downloadLink.download = 'merged_document.pdf';

            mainCard.hidden = true;
            successCard.hidden = false;

        } catch (error) {
            console.error('Failed to merge PDFs:', error);
            alert('An error occurred while merging the PDF files. Please ensure none of the selected files are password-protected.');
        } finally {
            loader.hidden = true;
            btnText.textContent = 'Merge PDFs';
            convertBtn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', resetUI);
});
