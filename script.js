document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-btn');
    const convertBtn = document.getElementById('convert-btn');
    const mainCard = document.getElementById('main-card');
    const successCard = document.getElementById('success-card');
    const downloadLink = document.getElementById('download-link');
    const resetBtn = document.getElementById('reset-btn');
    const loader = convertBtn.querySelector('.loader');
    const btnText = convertBtn.querySelector('.btn-text');

    let selectedFile = null;

    // --- File Handling ---

    const handleFile = (file) => {
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.hidden = false;
                convertBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file (PNG, JPG).');
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
        imagePreview.src = '';
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
        btnText.textContent = 'Processing...';

        try {
            let resultBlob;
            let fileName = selectedFile.name.split('.')[0];

            if (format === 'webp') {
                resultBlob = await convertToWebP(selectedFile);
                fileName += '.webp';
            } else {
                resultBlob = await convertToSVG(selectedFile);
                fileName += '.svg';
            }

            // Create download URL
            const url = URL.createObjectURL(resultBlob);
            downloadLink.href = url;
            downloadLink.download = fileName;

            // Show success
            mainCard.hidden = true;
            successCard.hidden = false;

        } catch (error) {
            console.error('Conversion failed:', error);
            alert('An error occurred during conversion.');
        } finally {
            loader.hidden = true;
            btnText.textContent = 'Convert Image';
            convertBtn.disabled = false;
        }
    });

    // --- Conversion Helpers ---

    function convertToWebP(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/webp', 0.85);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    function convertToSVG(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // Using ImageTracer library
                    // This library needs the image as an object or URL
                    ImageTracer.imageToSVG(
                        img.src,
                        (svgString) => {
                            const blob = new Blob([svgString], { type: 'image/svg+xml' });
                            resolve(blob);
                        },
                        { 
                            ltres: 1, 
                            qtres: 1, 
                            pathomit: 8, 
                            colorsampling: 1, 
                            numberofcolors: 16, 
                            mincolorratio: 0.02, 
                            colorquantcycles: 3, 
                            scale: 1,
                            strokewidth: 1
                        }
                    );
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    resetBtn.addEventListener('click', () => {
        mainCard.hidden = false;
        successCard.hidden = true;
        // Keep the file if they want to convert to another format, or reset?
        // Let's reset for a clean start
        selectedFile = null;
        imagePreview.src = '';
        previewContainer.hidden = true;
        convertBtn.disabled = true;
        fileInput.value = '';
    });
});
