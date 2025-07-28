// 🚀 Reader Logic 🚀
document.addEventListener('DOMContentLoaded', async () => {
    const readerContent = document.getElementById('reader-content');
    const prevChapterBtn = document.getElementById('prev-chapter-top');
    const nextChapterBtn = document.getElementById('next-chapter-top');
    const themeSwitch = document.getElementById('checkbox'); // The actual checkbox input

    let novelsData = null;
    let currentVolumeIndex = -1;
    let currentChapterIndex = -1;

    // Function to fetch and parse Markdown
    async function fetchMarkdown(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const markdown = await response.text();
            return marked.parse(markdown); // Using marked.js to parse Markdown
        } catch (error) {
            console.error('Error fetching markdown:', error);
            return `<p>Error loading chapter: ${error.message}</p>`;
        }
    }

    // Function to load a chapter
    async function loadChapter(volumeIndex, chapterIndex) {
        if (!novelsData || !novelsData.volumes[volumeIndex] || !novelsData.volumes[volumeIndex].chapters[chapterIndex]) {
            readerContent.innerHTML = '<p>Chapter not found.</p>';
            return;
        }

        currentVolumeIndex = volumeIndex;
        currentChapterIndex = chapterIndex;

        const chapter = novelsData.volumes[volumeIndex].chapters[chapterIndex];

        // Fade out current content
        readerContent.style.opacity = 0;
        readerContent.style.transition = 'opacity 0.3s ease-out';

        // Wait for fade out, then load new content and fade in
        setTimeout(async () => {
            const chapterHtml = await fetchMarkdown(chapter.file);
            readerContent.innerHTML = `<h1>${chapter.title}</h1>${chapterHtml}`;
            updateNavigationButtons();
            readerContent.style.opacity = 1;
        }, 300); // Match this duration with the CSS transition
    }

    // Function to update navigation buttons
    function updateNavigationButtons() {
        prevChapterBtn.style.display = 'none';
        nextChapterBtn.style.display = 'none';

        const currentVolume = novelsData.volumes[currentVolumeIndex];
        if (currentVolume) {
            // Check for previous chapter
            if (currentChapterIndex > 0) {
                prevChapterBtn.style.display = 'inline-block';
                prevChapterBtn.onclick = () => loadChapter(currentVolumeIndex, currentChapterIndex - 1);
            } else if (currentVolumeIndex > 0) {
                // Check for previous volume's last chapter
                const prevVolume = novelsData.volumes[currentVolumeIndex - 1];
                if (prevVolume && prevVolume.chapters.length > 0) {
                    prevChapterBtn.style.display = 'inline-block';
                    prevChapterBtn.onclick = () => loadChapter(currentVolumeIndex - 1, prevVolume.chapters.length - 1);
                }
            }

            // Check for next chapter
            if (currentChapterIndex < currentVolume.chapters.length - 1) {
                nextChapterBtn.style.display = 'inline-block';
                nextChapterBtn.onclick = () => loadChapter(currentVolumeIndex, currentChapterIndex + 1);
            } else if (currentVolumeIndex < novelsData.volumes.length - 1) {
                // Check for next volume's first chapter
                const nextVolume = novelsData.volumes[currentVolumeIndex + 1];
                if (nextVolume && nextVolume.chapters.length > 0) {
                    nextChapterBtn.style.display = 'inline-block';
                    nextChapterBtn.onclick = () => loadChapter(currentVolumeIndex + 1, 0);
                }
            }
        }
    }

    // Function to toggle theme
    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        // Save preference to localStorage
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    }

    // Initialize reader
    async function initializeReader() {
        try {
            const response = await fetch('data/novels.json');
            novelsData = await response.json();

            // Apply saved theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-mode');
                themeSwitch.checked = true; // Set switch to checked for light mode
            } else {
                themeSwitch.checked = false; // Set switch to unchecked for dark mode
            }

            const urlParams = new URLSearchParams(window.location.search);
            const volumeId = urlParams.get('volume');
            const chapterId = urlParams.get('chapter');

            let initialVolumeIndex = 0;
            let initialChapterIndex = 0;

            if (volumeId && chapterId) {
                const volume = novelsData.volumes.find(v => v.id === `volume-${volumeId}`);
                if (volume) {
                    initialVolumeIndex = novelsData.volumes.indexOf(volume);
                    const chapter = volume.chapters.find(c => c.id === `chapter-${chapterId}`);
                    if (chapter) {
                        initialChapterIndex = volume.chapters.indexOf(chapter);
                    }
                }
            }
            loadChapter(initialVolumeIndex, initialChapterIndex);

        } catch (error) {
            console.error('Error initializing reader:', error);
            readerContent.innerHTML = '<p>Error loading novels data.</p>';
        }
    }

    // Event Listener for theme switch
    themeSwitch.addEventListener('change', toggleTheme);

    initializeReader();
});