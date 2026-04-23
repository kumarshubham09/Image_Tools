let cropper;
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const dropZone = document.getElementById('drop-zone');
const uploadSection = document.getElementById('upload-section');
const editorSection = document.getElementById('editor-section');
const resultSection = document.getElementById('result-section');
const cropperImage = document.getElementById('cropper-image');
const countrySelect = document.getElementById('country-select');
const generateBtn = document.getElementById('generate-btn');
const backBtn = document.getElementById('back-btn');
const editAgainBtn = document.getElementById('edit-again');
const printCanvas = document.getElementById('print-canvas');
const downloadSingle = document.getElementById('download-single');
const downloadSheet = document.getElementById('download-sheet');

// Handle Browse Button
browseBtn.addEventListener('click', () => fileInput.click());

// Handle File Input
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Drag and Drop
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
        handleFile(e.dataTransfer.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        cropperImage.src = e.target.result;
        uploadSection.hidden = true;
        editorSection.hidden = false;
        initCropper();
    };
    reader.readAsDataURL(file);
}

function initCropper() {
    if (cropper) {
        cropper.destroy();
    }

    const ratio = getAspectRatio();
    cropper = new Cropper(cropperImage, {
        aspectRatio: ratio,
        viewMode: 1,
        guides: true,
        background: false,
        autoCropArea: 0.8,
        responsive: true,
    });
}

function getAspectRatio() {
    const val = countrySelect.value;
    if (val === '35-45') return 3.5 / 4.5;
    if (val === '2-2') return 1;
    if (val === '33-48') return 3.3 / 4.8;
    if (val === '35-35') return 1;
    return 1;
}

countrySelect.addEventListener('change', () => {
    if (cropper) {
        cropper.setAspectRatio(getAspectRatio());
    }
});

backBtn.addEventListener('click', () => {
    editorSection.hidden = true;
    uploadSection.hidden = false;
    if (cropper) cropper.destroy();
});

editAgainBtn.addEventListener('click', () => {
    resultSection.hidden = true;
    editorSection.hidden = false;
});

generateBtn.addEventListener('click', () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
        width: 600, // High quality individual photo
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    generatePrintSheet(canvas);
    
    editorSection.hidden = true;
    resultSection.hidden = false;
    document.getElementById('preview-box').style.display = 'flex';

    // Store single image for download
    downloadSingle.onclick = () => {
        const link = document.createElement('a');
        link.download = 'passport_photo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
});

function generatePrintSheet(singlePhotoCanvas) {
    const ctx = printCanvas.getContext('2d');
    
    // Sheet size: 4x6 inch @ 300 DPI = 1800x1200 px (Landscape)
    // We'll use a slightly smaller version for the preview but keep aspect ratio
    const sheetW = 1800;
    const sheetH = 1200;
    printCanvas.width = sheetW;
    printCanvas.height = sheetH;

    // Background white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, sheetW, sheetH);

    // Calculate grid
    // Standard photo size in px at 300 DPI
    // India: 3.5cm x 4.5cm -> ~413 x 531 px
    const val = countrySelect.value;
    let pw, ph;
    
    if (val === '35-45') { pw = 413; ph = 531; }
    else if (val === '2-2') { pw = 600; ph = 600; }
    else if (val === '33-48') { pw = 390; ph = 567; }
    else { pw = 413; ph = 413; }

    const marginX = 40;
    const marginY = 40;
    const gap = 20;

    let count = 0;
    for (let y = marginY; y + ph <= sheetH && count < 8; y += ph + gap) {
        for (let x = marginX; x + pw <= sheetW && count < 8; x += pw + gap) {
            // Draw photo
            ctx.drawImage(singlePhotoCanvas, x, y, pw, ph);
            
            // Draw very faint border for cutting
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, pw, ph);
            
            count++;
            if (count >= 2 && x === marginX) {
                // second column logic if needed
            }
        }
    }

    downloadSheet.onclick = () => {
        const link = document.createElement('a');
        link.download = 'passport_sheet_4x6_landscape.png';
        link.href = printCanvas.toDataURL('image/png');
        link.click();
    };
}
