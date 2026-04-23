document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const previewGrid = document.getElementById('preview-grid');
    const removeBtn = document.getElementById('remove-btn');
    const resizeOptions = document.getElementById('resize-options');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const maintainAspect = document.getElementById('maintain-aspect');
    const targetKbInput = document.getElementById('target-kb');
    const resizeBtn = document.getElementById('resize-btn');
    const successCard = document.getElementById('success-card');
    const mainCard = document.getElementById('main-card');
    const downloadList = document.getElementById('download-list');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const resetBtn = document.getElementById('reset-btn');

    let imageFiles = []; // Array of {file, img, aspectRatio}
    let resizedResults = []; // Array of {dataUrl, name}

    // Handle Browse Button
    browseBtn.addEventListener('click', () => fileInput.click());

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
            alert('Please select valid image files.');
            return;
        }

        for (const file of imageFilesOnly) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        imageFiles.push({
                            file: file,
                            img: img,
                            aspectRatio: img.width / img.height
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
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (imageFiles.length > 0) {
            previewContainer.hidden = false;
            resizeOptions.style.display = 'block';
            resizeBtn.disabled = false;

            // Set initial dimensions from the first image
            if (!widthInput.value) {
                widthInput.value = imageFiles[0].img.width;
                heightInput.value = imageFiles[0].img.height;
            }
        }
    }

    // Maintain Aspect Ratio Logic (based on first image)
    widthInput.addEventListener('input', () => {
        if (maintainAspect.checked && imageFiles.length > 0) {
            heightInput.value = Math.round(widthInput.value / imageFiles[0].aspectRatio);
        }
    });

    heightInput.addEventListener('input', () => {
        if (maintainAspect.checked && imageFiles.length > 0) {
            widthInput.value = Math.round(heightInput.value * imageFiles[0].aspectRatio);
        }
    });

    // Remove Images
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUI();
    });

    function resetUI() {
        fileInput.value = '';
        previewContainer.hidden = true;
        previewGrid.innerHTML = '';
        resizeOptions.style.display = 'none';
        resizeBtn.disabled = true;
        imageFiles = [];
        resizedResults = [];
        mainCard.hidden = false;
        successCard.hidden = true;
        downloadList.innerHTML = '';
    }

    // Batch Resize Logic
    resizeBtn.addEventListener('click', async () => {
        if (imageFiles.length === 0) return;

        const targetWidth = parseInt(widthInput.value);
        const targetHeight = parseInt(heightInput.value);
        const targetKB = parseInt(targetKbInput.value);
        const format = document.querySelector('input[name="output-format"]:checked').value;

        if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
            alert('Please enter valid dimensions.');
            return;
        }

        const btnText = resizeBtn.querySelector('.btn-text');
        const loader = resizeBtn.querySelector('.loader');

        btnText.style.display = 'none';
        loader.hidden = false;
        resizeBtn.disabled = true;

        resizedResults = [];
        downloadList.innerHTML = '';

        // Process each image
        for (let i = 0; i < imageFiles.length; i++) {
            const { file, img, aspectRatio } = imageFiles[i];
            
            // Calculate height for this specific image if aspect ratio is maintained
            let currentWidth = targetWidth;
            let currentHeight = targetHeight;
            
            if (maintainAspect.checked) {
                currentHeight = Math.round(targetWidth / aspectRatio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = currentWidth;
            canvas.height = currentHeight;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

            let dataUrl = '';
            let finalSizeKb = 0;

            if (!isNaN(targetKB) && targetKB > 0 && (format === 'image/jpeg' || format === 'image/webp')) {
                let bestDataUrl = canvas.toDataURL(format, 0.01);
                for (let q = 0.95; q >= 0.05; q -= 0.05) {
                    const currentUrl = canvas.toDataURL(format, q);
                    const sizeKb = (currentUrl.length * (3/4)) / 1024;
                    if (sizeKb <= targetKB) {
                        bestDataUrl = currentUrl;
                        finalSizeKb = sizeKb;
                        break;
                    }
                    bestDataUrl = currentUrl;
                    finalSizeKb = sizeKb;
                }
                dataUrl = bestDataUrl;
            } else {
                dataUrl = canvas.toDataURL(format, 0.9);
                finalSizeKb = (dataUrl.length * (3/4)) / 1024;
            }

            const extension = format.split('/')[1];
            const originalName = file.name.split('.')[0];
            const resultName = `${originalName}_resized_${currentWidth}x${currentHeight}.${extension}`;

            resizedResults.push({ dataUrl, name: resultName });

            // Add to download list UI
            const dItem = document.createElement('div');
            dItem.className = 'download-item';
            dItem.innerHTML = `
                <div class="download-item-name">${resultName}</div>
                <span>${finalSizeKb.toFixed(1)} KB</span>
            `;
            downloadList.appendChild(dItem);
        }

        setTimeout(() => {
            btnText.style.display = 'block';
            loader.hidden = true;
            resizeBtn.disabled = false;
            mainCard.hidden = true;
            successCard.hidden = false;
            document.getElementById('success-msg').textContent = `${imageFiles.length} images processed successfully.`;
        }, 500);
    });

    // Download All Logic
    downloadAllBtn.addEventListener('click', () => {
        resizedResults.forEach((result, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = result.dataUrl;
                link.download = result.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 300); // 300ms delay between downloads
        });
    });

    resetBtn.addEventListener('click', resetUI);
    
    // Initializing Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
