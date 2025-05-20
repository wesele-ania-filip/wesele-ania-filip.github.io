// Replace these with your actual values
const API_KEY = 'AIzaSyDbs-HMHt__vQAjeSuU89U4WBhlr5EEnx4';
const FOLDER_ID = '1XZnCvIUSJ0VQ13AlDJHp8VWSM_zZueTk';
const CLIENT_ID = '423158260926-21qotkdtat68fh814ilqmqkc82rdo1m8.apps.googleusercontent.com';

// Google Drive API endpoint
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

// DOM elements
const gallery = document.getElementById('gallery');
const loadingElement = document.getElementById('loading');

// Function to load media from Google Drive
async function loadMediaFromDrive() {
    try {
        // Query files in the folder that are images or videos
        const query = `'${FOLDER_ID}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`;
        const url = `${DRIVE_API}?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=files(id,name,mimeType,thumbnailLink,webContentLink)`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
            loadingElement.remove();
            displayMediaItems(data.files);
        } else {
            loadingElement.textContent = 'No media files found in the specified folder.';
        }
    } catch (error) {
        console.error('Error loading media:', error);
        loadingElement.textContent = 'Error loading media. Please check console for details.';
    }
}

// Function to display media items in the gallery
function displayMediaItems(files) {
    files.forEach(file => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        
        if (file.mimeType.includes('image/')) {
            // For images, use the webContentLink for full resolution
            const img = document.createElement('img');
            img.src = file.webContentLink;
            img.alt = file.name;
            mediaItem.appendChild(img);
        } else if (file.mimeType.includes('video/')) {
            // For videos, create a video element
            const video = document.createElement('video');
            video.controls = true;
            video.src = file.webContentLink;
            video.preload = 'metadata';
            mediaItem.appendChild(video);
        }
        
        gallery.appendChild(mediaItem);
    });
}

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', loadMediaFromDrive);