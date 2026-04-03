// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const triggerUploadBtn = document.getElementById('trigger-upload');
const uploadPanel = document.getElementById('upload-panel');
const loadingPanel = document.getElementById('loading-panel');
const resultPanel = document.getElementById('result-panel');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const errorToast = document.getElementById('error-toast');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');

let currentObjectURL = null;

// Dark Mode Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.setAttribute('data-theme', 'dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }
});

initTheme();

// Drag & Drop Events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', handleDrop, false);
triggerUploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const validExtensions = ['.pdf', '.svg'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (validExtensions.includes(extension)) {
        processFile(file);
    } else {
        showError('Please upload only .pdf or .svg files.');
    }
    fileInput.value = ''; // Reset input to allow same file upload again
}

// Convert Process
async function processFile(file) {
    const format = document.querySelector('input[name="format"]:checked').value;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    // Swap UI to Loading
    uploadPanel.classList.add('hidden');
    loadingPanel.classList.remove('hidden');

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server responded with ${response.status}`);
        }

        const blob = await response.blob();
        
        // Setup download button
        if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = URL.createObjectURL(blob);
        
        const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
        const downloadName = `highres_${originalName}.${format}`;
        
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = currentObjectURL;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        // Swap UI to Success
        loadingPanel.classList.add('hidden');
        resultPanel.classList.remove('hidden');

    } catch (error) {
        uploadPanel.classList.remove('hidden');
        loadingPanel.classList.add('hidden');
        showError(error.message);
    }
}

resetBtn.addEventListener('click', () => {
    resultPanel.classList.add('hidden');
    uploadPanel.classList.remove('hidden');
});

function showError(msg) {
    errorToast.textContent = msg;
    errorToast.classList.remove('hidden');
    setTimeout(() => {
        errorToast.classList.add('hidden');
    }, 4000);
}
