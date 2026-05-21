document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const previewGrid = document.getElementById('preview-grid');
    const removeBtn = document.getElementById('remove-btn');
    const convertBtn = document.getElementById('convert-btn');
    const successCard = document.getElementById('success-card');
    const mainCard = document.getElementById('main-card');
    const downloadLink = document.getElementById('download-link');
    const resetBtn = document.getElementById('reset-btn');
    const pageSizeSelect = document.getElementById('pdf-page-size');
    const marginSelect = document.getElementById('pdf-margin');

    const loader = convertBtn.querySelector('.loader');
    const btnText = convertBtn.querySelector('.btn-text');

    let imageFiles = []; // Array of {file, dataUrl, name}

    // Handle Browse Button
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Handle File Input
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

    async function handleFiles(files) {
        const imageFilesOnly = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFilesOnly.length === 0) {
            alert('Please select valid image files (PNG, JPG, JPEG).');
            return;
        }

        for (const file of imageFilesOnly) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageFiles.push({
                        file: file,
                        dataUrl: e.target.result,
                        name: file.name
                    });
                    
                    // Add to preview grid
                    const item = document.createElement('div');
                    item.className = 'preview-item';
                    const previewImg = document.createElement('img');
                    previewImg.src = e.target.result;
                    item.appendChild(previewImg);
                    previewGrid.appendChild(item);
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }

        if (imageFiles.length > 0) {
            previewContainer.hidden = false;
            convertBtn.disabled = false;
        }
    }

    // Reset UI helper
    function resetUI() {
        fileInput.value = '';
        previewContainer.hidden = true;
        previewGrid.innerHTML = '';
        convertBtn.disabled = true;
        imageFiles = [];
        mainCard.hidden = false;
        successCard.hidden = true;
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUI();
    });

    // Generate PDF Logic
    convertBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) return;

        btnText.textContent = 'Generating PDF...';
        loader.hidden = false;
        convertBtn.disabled = true;

        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            const pageSize = pageSizeSelect.value;
            const margin = parseInt(marginSelect.value);

            for (const imgData of imageFiles) {
                const arrayBuffer = await imgData.file.arrayBuffer();
                let pdfImg;

                if (imgData.file.type === 'image/png') {
                    pdfImg = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    pdfImg = await pdfDoc.embedJpg(arrayBuffer);
                }

                let pageWidth, pageHeight;
                if (pageSize === 'a4') {
                    pageWidth = 595.27; // A4 Width in points
                    pageHeight = 841.89; // A4 Height in points
                } else if (pageSize === 'letter') {
                    pageWidth = 612.0; // Letter Width in points
                    pageHeight = 792.0; // Letter Height in points
                } else {
                    // fit - image size + margins
                    pageWidth = pdfImg.width + (margin * 2);
                    pageHeight = pdfImg.height + (margin * 2);
                }

                const page = pdfDoc.addPage([pageWidth, pageHeight]);

                const maxWidth = pageWidth - (margin * 2);
                const maxHeight = pageHeight - (margin * 2);

                let drawWidth = pdfImg.width;
                let drawHeight = pdfImg.height;

                if (pageSize !== 'fit') {
                    const widthRatio = maxWidth / pdfImg.width;
                    const heightRatio = maxHeight / pdfImg.height;
                    const scale = Math.min(widthRatio, heightRatio, 1);

                    drawWidth = pdfImg.width * scale;
                    drawHeight = pdfImg.height * scale;
                }

                // Center the image on the page
                const x = margin + (maxWidth - drawWidth) / 2;
                const y = margin + (maxHeight - drawHeight) / 2;

                page.drawImage(pdfImg, {
                    x: x,
                    y: y,
                    width: drawWidth,
                    height: drawHeight
                });
            }

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Create download URL
            const url = URL.createObjectURL(pdfBlob);
            downloadLink.href = url;
            
            // Output name is first image name plus pdf
            let outputName = imageFiles[0].name.split('.')[0] + '_converted.pdf';
            downloadLink.download = outputName;

            mainCard.hidden = true;
            successCard.hidden = false;

        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('An error occurred while generating the PDF.');
        } finally {
            loader.hidden = true;
            btnText.textContent = 'Generate PDF';
            convertBtn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', resetUI);
});
