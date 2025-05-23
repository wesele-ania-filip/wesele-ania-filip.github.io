document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('gallery');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const fileInput = document.getElementById('file_input');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');
    const progressBar = document.querySelector('.progress');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.querySelector('.close');

    // Sample gallery items (simulating dynamic content)
    let galleryItems = [
        { type: 'image', src: 'https://picsum.photos/400/400?random=1', alt: 'Piwonia w ogrodzie' },
        { type: 'image', src: 'https://picsum.photos/400/400?random=2', alt: 'Zachód słońca' },
        { type: 'video', src: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', alt: 'Film z naturą' },
        { type: 'image', src: 'https://picsum.photos/400/400?random=3', alt: 'Kwiatowe pole' },
    ];

    // Render gallery items
    function renderGallery(items) {
        gallery.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('gallery-item');
            div.dataset.type = item.type;
            div.dataset.alt = item.alt.toLowerCase();

            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.alt;
                div.appendChild(img);
            } else if (item.type === 'video') {
                const video = document.createElement('video');
                video.src = item.src;
                video.muted = true;
                video.poster = 'https://picsum.photos/400/400?random=4'; // Placeholder for video
                div.appendChild(video);
            }

            gallery.appendChild(div);
        });
    }

    // Initial render
    renderGallery(galleryItems);

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
                        const type = file.type.startsWith('image/') ? 'image' : 'video';
                        const src = URL.createObjectURL(file);
                        galleryItems.push({
                            type,
                            src,
                            alt: file.name
                        });
                    });
                    renderGallery(galleryItems);
                    fileInput.value = ''; // Reset input
                }
            }, 200);
        }
    });

    // Modal functionality
    gallery.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
            modalContent.innerHTML = '';
            const clone = target.cloneNode(true);
            if (target.tagName === 'VIDEO') {
                clone.controls = true;
            }
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
});