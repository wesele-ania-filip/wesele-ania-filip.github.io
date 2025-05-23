let gapiLoaded = false;
let isSignedIn = false;
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
const FOLDER_ID = 'YOUR_FOLDER_ID'; // Replace with your Google Drive folder ID
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('gallery');
    const emptyGallery = document.querySelector('.empty-gallery');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const fileInput = document.getElementById('file_input');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');
    const progressBar = document.querySelector('.progress');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.querySelector('.close');
    const signOutBtn = document.getElementById('sign-out-btn');

    let galleryItems = [];

    // Initialize Google API Client
    function initGapi() {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                scope: SCOPES
            }).then(() => {
                gapiLoaded = true;
                gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
                updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            }).catch(err => {
                console.error('GAPI initialization failed:', err);
                emptyGallery.textContent = 'Błąd inicjalizacji API. Sprawdź Client ID i API Key.';
                emptyGallery.style.display = 'block';
            });
        });
    }

    // Handle sign-in status
    function updateSignInStatus(signedIn) {
        isSignedIn = signedIn;
        if (signedIn) {
            signOutBtn.style.display = 'block';
            fetchDrivePhotos();
        } else {
            signOutBtn.style.display = 'none';
            galleryItems = galleryItems.filter(item => !item.isDriveFile);
            renderGallery(galleryItems);
        }
    }

    // Google Sign-In callback
    window.onSignIn = function(googleUser) {
        isSignedIn = true;
        updateSignInStatus(true);
    };

    // Sign out
    signOutBtn.addEventListener('click', () => {
        gapi.auth2.getAuthInstance().signOut().then(() => {
            console.log('User signed out.');
        });
    });

    // Fetch photos from specific Google Drive folder
    function fetchDrivePhotos() {
        if (!gapiLoaded || !isSignedIn) {
            emptyGallery.textContent = 'Zaloguj się, aby zobaczyć zdjęcia z Google Drive.';
            emptyGallery.style.display = 'block';
            return;
        }
        gapi.client.drive.files.list({
            q: `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
            spaces: 'drive'
        }).then(response => {
            const files = response.result.files || [];
            if (files.length === 0) {
                emptyGallery.textContent = 'Brak zdjęć w folderze Google Drive. Dodaj zdjęcia lub sprawdź Folder ID.';
                emptyGallery.style.display = 'block';
            } else {
                emptyGallery.style.display = 'none';
            }
            const driveItems = files.map(file => ({
                type: 'image',
                src: file.webContentLink || file.thumbnailLink || '',
                alt: file.name,
                isDriveFile: true
            })).filter(item => item.src); // Filter out items without valid URLs
            galleryItems = [...galleryItems.filter(item => !item.isDriveFile), ...driveItems];
            renderGallery(galleryItems);
        }).catch(err => {
            console.error('Error fetching Drive photos:', err);
            emptyGallery.textContent = 'Błąd podczas pobierania zdjęć z Google Drive. Sprawdź uprawnienia folderu.';
            emptyGallery.style.display = 'block';
        });
    }

    // Render gallery items
    function renderGallery(items) {
        gallery.innerHTML = '';
        if (items.length === 0) {
            emptyGallery.style.display = 'block';
            return;
        }
        emptyGallery.style.display = 'none';
        items.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('gallery-item');
            div.dataset.type = item.type;
            div.dataset.alt = item.alt.toLowerCase();

            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.alt;
            img.loading = 'lazy';
            img.onerror = () => {
                img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50" font-size="12" fill="red">Błąd ładowania</text></svg>';
            };
            div.appendChild(img);

            gallery.appendChild(div);
        });
    }

    // Search functionality
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filteredItems = galleryItems.filter(item => item.alt.toLowerCase().includes(query));
        renderGallery(filteredItems);
    });

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            let filteredItems = galleryItems;
            if (filter !== 'all') {
                filteredItems = galleryItems.filter(item => item.type === filter);
            }
            renderGallery(filteredItems);
        });
    });

    // Upload functionality
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (files.length > 0) {
            uploadStatus.style.display = 'block';
            progressBar.style.width = '0%';

            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                progressBar.style.width = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    uploadStatus.style.display = 'none';
                    Array.from(files).forEach(file => {
                        if (file.type.startsWith('image/')) {
                            const src = URL.createObjectURL(file);
                            galleryItems.push({
                                type: 'image',
                                src,
                                alt: file.name,
                                isDriveFile: false
                            });
                        }
                    });
                    renderGallery(galleryItems);
                    fileInput.value = '';
                    if (isSignedIn) {
                        uploadToDrive(files);
                    }
                }
            }, 200);
        }
    });

    // Upload to Google Drive
    function uploadToDrive(files) {
        Array.from(files).filter(file => file.type.startsWith('image/')).forEach(file => {
            const metadata = {
                name: file.name,
                mimeType: file.type,
                parents: [FOLDER_ID]
            };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            gapi.client.request({
                path: 'https://www.googleapis.com/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: {
                    'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                },
                body: form
            }).then(() => {
                fetchDrivePhotos();
            }).catch(err => console.error('Error uploading to Drive:', err));
        });
    }

    // Modal functionality
    gallery.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName === 'IMG') {
            modalContent.innerHTML = '';
            const clone = target.cloneNode(true);
            modalContent.appendChild(clone);
            modal.style.display = 'block';
        }
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        modalContent.innerHTML = '';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modalContent.innerHTML = '';
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            modalContent.innerHTML = '';
        }
    });

    // Load Google API
    gapi.load('client', initGapi);
});