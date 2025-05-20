const FOLDER_ID = '1XZnCvIUSJ0VQ13AlDJHp8VWSM_zZueTk';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxQJ7JdYVPcGuPvkr0CcGZBPTkmAXt47cDm6H9hCgQiUAD7E5FTYvgDmgiOyvRevT0sTA/exec';

const gallery = document.getElementById('gallery');
const loadingElement = document.getElementById('loading');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenContent = document.getElementById('fullscreen-content');
const fullscreenLoading = document.getElementById('fullscreen-loading');
const closeFullscreen = document.getElementById('close-fullscreen');
const uploadArea = document.querySelector('.upload-area');

let loadedFiles = [];

function init() {
    setupEventListeners();
    loadMediaFromDrive();
}

function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    
    closeFullscreen.addEventListener('click', closeFullscreenHandler);
    
    fullscreenOverlay.addEventListener('click', (e) => {
        if (e.target === fullscreenOverlay) {
            closeFullscreenHandler();
        }
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect({ target: { files: e.dataTransfer.files } });
        }
    });
    
    uploadArea.addEventListener('click', () => fileInput.click());
}

function closeFullscreenHandler() {
    fullscreenOverlay.style.display = 'none';
    fullscreenContent.innerHTML = '<div id="fullscreen-loading">Loading...</div>';
}

async function loadMediaFromDrive() {
    try {
        const response = await fetch(WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const files = await response.json();
        
        if (files.length > 0) {
            loadingElement.style.display = 'none';
            loadedFiles = files;
            displayMediaItems(files);
        } else {
            loadingElement.textContent = 'No media files found in the specified folder.';
        }
    } catch (error) {
        console.error('Error loading media:', error);
        loadingElement.textContent = 'Error loading gallery. Please try again later.';
    }
}

function displayMediaItems(files) {
    gallery.innerHTML = '';
    
    files.forEach((file, index) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.dataset.index = index;
        
        if (file.mimeType.includes('image/')) {
            const img = document.createElement('img');
            img.src = file.thumbnail || file.url;
            img.alt = file.name;
            img.loading = 'lazy';
            img.onerror = () => { img.src = 'https://via.placeholder.com/200?text=Error'; };
            mediaItem.appendChild(img);
        } else if (file.mimeType.includes('video/')) {
            const videoContainer = document.createElement('div');
            videoContainer.style.position = 'relative';
            
            const thumbnail = document.createElement('img');
            thumbnail.src = file.thumbnail || 'https://via.placeholder.com/200?text=Video';
            thumbnail.style.width = '100%';
            thumbnail.style.height = '100%';
            thumbnail.style.objectFit = 'cover';
            thumbnail.onerror = () => { thumbnail.src = 'https://via.placeholder.com/200?text=Video'; };
            videoContainer.appendChild(thumbnail);
            
            const playButton = document.createElement('div');
            playButton.innerHTML = '▶';
            playButton.style.position = 'absolute';
            playButton.style.top = '50%';
            playButton.style.left = '50%';
            playButton.style.transform = 'translate(-50%, -50%)';
            playButton.style.fontSize = '48px';
            playButton.style.color = 'white';
            playButton.style.textShadow = '0 0 8px rgba(0,0,0,0.5)';
            playButton.style.cursor = 'pointer';
            videoContainer.appendChild(playButton);
            
            mediaItem.appendChild(videoContainer);
        }
        
        mediaItem.addEventListener('click', () => showFullscreen(file));
        gallery.appendChild(mediaItem);
    });
}

function showFullscreen(file) {
    fullscreenContent.innerHTML = '<div id="fullscreen-loading">Loading...</div>';
    fullscreenOverlay.style.display = 'flex';
    fullscreenLoading.style.display = 'block';
    
    if (file.mimeType.includes('image/')) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        img.onload = () => {
            fullscreenLoading.style.display = 'none';
            fullscreenContent.innerHTML = '';
            fullscreenContent.appendChild(img);
        };
        img.onerror = () => {
            fullscreenLoading.style.display = 'none';
            fullscreenContent.innerHTML = '<img src="https://via.placeholder.com/800?text=Image+Not+Found" alt="Error">';
        };
    } else if (file.mimeType.includes('video/')) {
        const video = document.createElement('video');
        video.controls = true;
        video.src = file.url;
        video.autoplay = true;
        video.onloadeddata = () => {
            fullscreenLoading.style.display = 'none';
            fullscreenContent.innerHTML = '';
            fullscreenContent.appendChild(video);
        };
        video.onerror = () => {
            fullscreenLoading.style.display = 'none';
            fullscreenContent.innerHTML = '<img src="https://via.placeholder.com/800?text=Video+Not+Found" alt="Error">';
        };
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length === 0) return;

    uploadStatus.textContent = `${files.length} file(s) selected`;
    progressBar.style.display = 'block';
    progress.style.width = '0%';

    Array.from(files).forEach((file, i) => {
        uploadFile(file, i, files.length);
    });
}

async function uploadFile(file, currentIndex, totalFiles) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: formData
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            throw new Error(`Failed to parse server response: ${jsonError.message}`);
        }

        if (!response.ok) {
            throw new Error(`Upload failed: HTTP ${response.status}${result.error ? ' - ' + result.error : ''}`);
        }
        
        if (!result || !result.success) {
            throw new Error(result?.error || 'Upload failed: No success response');
        }
        
        const progressPercent = Math.round(((currentIndex + 1) / totalFiles) * 100);
        progress.style.width = `${progressPercent}%`;

        if (currentIndex === totalFiles - 1) {
            uploadStatus.textContent = 'Upload complete! Refreshing gallery...';
            setTimeout(() => {
                progressBar.style.display = 'none';
                progress.style.width = '0%';
                fileInput.value = '';
                uploadStatus.textContent = 'No files selected';
                loadMediaFromDrive();
            }, 1000);
        }
    } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.textContent = `Error uploading ${file.name}: ${error.message}`;
        progressBar.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', init);