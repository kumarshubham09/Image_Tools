document.addEventListener('DOMContentLoaded', () => {
    // Set PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const pdfFilename = document.getElementById('pdf-filename');
    const pdfFilesize = document.getElementById('pdf-filesize');
    const removeBtn = document.getElementById('remove-btn');
    const convertBtn = document.getElementById('convert-btn');
    const mainCard = document.getElementById('main-card');
    const successCard = document.getElementById('success-card');
    const downloadList = document.getElementById('download-list');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    const loader = convertBtn.querySelector('.loader');
    const btnText = convertBtn.querySelector('.btn-text');

    let selectedFile = null;
    let convertedImages = []; // List of {blob, name}

    // --- File Handling ---

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            pdfFilename.textContent = file.name;
            pdfFilesize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            previewContainer.hidden = false;
            convertBtn.disabled = false;
        } else {
            alert('Please select a valid PDF file.');
        }
    };

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // --- Drag & Drop ---

    dropZone.addEventListener('click', () => {
        if (!selectedFile) fileInput.click();
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFile(dt.files[0]);
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        previewContainer.hidden = true;
        convertBtn.disabled = true;
        fileInput.value = '';
    });

    // --- Conversion Logic ---

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const format = document.querySelector('input[name="format"]:checked').value;
        
        // UI State: Loading
        convertBtn.disabled = true;
        loader.hidden = false;
        btnText.textContent = 'Rendering PDF...';

        try {
            convertedImages = await convertPDFToImages(selectedFile, format);

            // Populate success list
            downloadList.innerHTML = '';
            convertedImages.forEach((img, index) => {
                const item = document.createElement('div');
                item.className = 'download-item';
                
                const infoDiv = document.createElement('div');
                infoDiv.style.display = 'flex';
                infoDiv.style.flexDirection = 'column';
                infoDiv.style.gap = '2px';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'download-item-name';
                nameSpan.textContent = img.name;
                nameSpan.style.color = '#1e293b';
                nameSpan.style.fontWeight = '600';
                
                const sizeSpan = document.createElement('span');
                sizeSpan.textContent = (img.blob.size / 1024).toFixed(1) + ' KB';
                
                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(sizeSpan);
                
                const dlBtn = document.createElement('a');
                dlBtn.className = 'btn-secondary';
                dlBtn.style.padding = '6px 12px';
                dlBtn.style.fontSize = '0.85rem';
                dlBtn.style.textDecoration = 'none';
                dlBtn.href = URL.createObjectURL(img.blob);
                dlBtn.download = img.name;
                dlBtn.innerHTML = '<i data-lucide="download" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Download';

                item.appendChild(infoDiv);
                item.appendChild(dlBtn);
                downloadList.appendChild(item);
            });

            lucide.createIcons();

            // Show success
            mainCard.hidden = true;
            successCard.hidden = false;

        } catch (error) {
            console.error('PDF processing failed:', error);
            alert('An error occurred while processing the PDF file. Please ensure it is not password-protected.');
        } finally {
            loader.hidden = true;
            btnText.textContent = 'Convert PDF to Images';
            convertBtn.disabled = false;
        }
    });

    // --- ZIP Download all ---
    downloadAllBtn.addEventListener('click', async () => {
        if (convertedImages.length === 0) return;

        downloadAllBtn.disabled = true;
        const origText = downloadAllBtn.innerHTML;
        downloadAllBtn.innerHTML = '<div class="loader"></div> Bundling ZIP...';

        try {
            const zip = new JSZip();
            convertedImages.forEach(img => {
                zip.file(img.name, img.blob);
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_images.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error('ZIP generation failed:', err);
            alert('Failed to generate ZIP file.');
        } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = origText;
        }
    });

    // --- PDF rendering logic ---
    async function convertPDFToImages(file, format) {
        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
            fileReader.onload = async function() {
                try {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                    const images = [];

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 }); // High-res render scale
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        await page.render(renderContext).promise;

                        const mimeType = format;
                        const ext = format === 'image/png' ? 'png' : 'jpg';
                        const blob = await new Promise(r => canvas.toBlob(r, mimeType, 0.9));
                        
                        images.push({
                            blob,
                            name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}.${ext}`
                        });
                    }
                    resolve(images);
                } catch (err) {
                    reject(err);
                }
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
        });
    }

    resetBtn.addEventListener('click', () => {
        mainCard.hidden = false;
        successCard.hidden = true;
        selectedFile = null;
        previewContainer.hidden = true;
        convertBtn.disabled = true;
        fileInput.value = '';
        convertedImages = [];
    });
});
