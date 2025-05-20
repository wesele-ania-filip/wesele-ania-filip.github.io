const FOLDER_ID = '1XZnCvIUSJ0VQ13AlDJHp8VWSM_zZueTk';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxQJ7JdYVPcGuPvkr0CcGZBPTkmAXt47cDm6H9hCgQiUAD7E5FTYvgDmgiOyvRevT0sTA/exec';

const gallery = document.getElementById('gallery');
const loadingElement = document.getElementById('loading');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadStatus = document.getElementById('upload-status');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenContent = document.getElementById('fullscreen-content');
const closeFullscreen = document.getElementById('close-fullscreen');
const uploadArea = document.querySelector('.upload-area');

let loadedFiles = [];

function init() {
    setupEventListeners();
    loadMediaFromDrive();
}

function setupEventListeners() {
    uploadButton.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            handleFileSelect(e);
        }
    });
    
    closeFullscreen.addEventListener('click', () => {
        fullscreenOverlay.style.display = 'none';
        fullscreenContent.innerHTML = ''; // Clear content to stop videos
    });
    
    fullscreenOverlay.addEventListener('click', (e) => {
        if (e.target === fullscreenOverlay) {
            fullscreenOverlay.style.display = 'none';
            fullscreenContent.innerHTML = ''; // Clear content to stop videos
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

async function loadMediaFromDrive() {
    try {
        const response = await fetch(WEB_APP_URL);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const files = await response.json();
        
        if (files.length > 0) {
            loadingElement.remove();
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
            img.onerror = () => { img.src = 'https://via.placeholder.com/200?text=Error'; }; // Fallback for broken images
            mediaItem.appendChild(img);
        } else if (file.mimeType.includes('video/')) {
            const videoContainer = document.createElement('div');
            videoContainer.style.position = 'relative';
            
            const thumbnail = document.createElement('img');
            thumbnail.src = file.thumbnail || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
            thumbnail.style.width = '100%';
            thumbnail.style.height = '100%';
            thumbnail.style.objectFit = 'cover';
            thumbnail.onerror = () => { thumbnail.src = 'https://via.placeholder.com/200?text=Video'; }; // Fallback for broken thumbnails
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
        
        mediaItem.addEventListener('click', () => showFullscreen(files[index]));
        gallery.appendChild(mediaItem);
    });
}

function showFullscreen(file) {
    fullscreenContent.innerHTML = '';
    
    if (file.mimeType.includes('image/')) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        img.onerror = () => { img.src = 'https://via.placeholder.com/800?text=Image+Not+Found'; }; // Fallback for broken images
        fullscreenContent.appendChild(img);
    } else if (file.mimeType.includes('video/')) {
        const video = document.createElement('video');
        video.controls = true;
        video.src = file.url;
        video.autoplay = true;
        video.onerror = () => { video.poster = 'https://via.placeholder.com/800?text=Video+Not+Found'; }; // Fallback for broken videos
        fullscreenContent.appendChild(video);
    }
    
    fullscreenOverlay.style.display = 'flex';
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length === 0) return;

    uploadStatus.textContent = `${files.length} file(s) selected`;
    progressBar.style.display = 'block';

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

        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Upload failed');
        
        const progressPercent = Math.round(((currentIndex + 1) / totalFiles) * 100);
        progress.style.width = `${progressPercent}%`;

        if (currentIndex === totalFiles - 1) {
            uploadStatus.textContent = 'Upload complete! Refreshing gallery...';
            setTimeout(() => {
                progressBar.style.display = 'none';
                progress.style.width = '0%';
                fileInput.value = '';
                loadMediaFromDrive();
            }, 1000);
        }
    } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.textContent = `Error uploading ${file.name}: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', init);