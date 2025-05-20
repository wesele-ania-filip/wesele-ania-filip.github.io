// Replace these with your actual values
const API_KEY = 'AIzaSyDbs-HMHt__vQAjeSuU89U4WBhlr5EEnx4';
const FOLDER_ID = '1XZnCvIUSJ0VQ13AlDJHp8VWSM_zZueTk';

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
        const url = `${DRIVE_API}?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink)`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
            loadingElement.remove();
            await displayMediaItems(data.files);
        } else {
            loadingElement.textContent = 'No media files found in the specified folder.';
        }
    } catch (error) {
        console.error('Error loading media:', error);
        loadingElement.textContent = 'Error loading media. Please check console for details.';
    }
}

// Function to display media items in the gallery
async function displayMediaItems(files) {
    // Process files in batches to avoid overwhelming the browser
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(processFile));
    }
}

async function processFile(file) {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item';
    
    try {
        if (file.mimeType.includes('image/')) {
            // For images, try thumbnail first, fallback to full image
            const img = document.createElement('img');
            
            // Use thumbnail if available (faster loading)
            if (file.thumbnailLink) {
                img.src = file.thumbnailLink.replace('=s220', '=s400'); // Increase thumbnail size
                img.onload = () => {
                    // Optionally replace with higher quality later
                    // img.src = file.webContentLink;
                };
            } else {
                img.src = file.webContentLink;
            }
            
            img.alt = file.name;
            img.loading = 'lazy'; // Lazy loading for better performance
            mediaItem.appendChild(img);
            
        } else if (file.mimeType.includes('video/')) {
            // For videos, create a thumbnail with play button overlay
            const videoContainer = document.createElement('div');
            videoContainer.style.position = 'relative';
            
            // Try to get video thumbnail (might not always work)
            const thumbnail = document.createElement('img');
            if (file.thumbnailLink) {
                thumbnail.src = file.thumbnailLink.replace('=s220', '=s400');
            } else {
                // Fallback to a generic video icon
                thumbnail.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
                thumbnail.style.opacity = '0.6';
                thumbnail.style.backgroundColor = '#f0f0f0';
                thumbnail.style.padding = '20px';
            }
            
            thumbnail.alt = `Video: ${file.name}`;
            thumbnail.style.width = '100%';
            videoContainer.appendChild(thumbnail);
            
            // Add play button overlay
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
            
            playButton.addEventListener('click', () => {
                // Replace thumbnail with actual video when clicked
                videoContainer.innerHTML = '';
                const video = document.createElement('video');
                video.controls = true;
                video.src = file.webContentLink;
                video.style.width = '100%';
                videoContainer.appendChild(video);
                video.play();
            });
            
            videoContainer.appendChild(playButton);
            mediaItem.appendChild(videoContainer);
        }
        
        gallery.appendChild(mediaItem);
    } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
    }
}

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', loadMediaFromDrive);