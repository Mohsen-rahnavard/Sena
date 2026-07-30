// Dropdown Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    dropdownToggle.addEventListener('click', function (e) {
        e.preventDefault();
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', function (e) {
        if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

// Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-N1SSRSE35X');

// All window load logic in one place
window.addEventListener('load', function() {
    // Fade-in effect
    document.body.classList.add('fade-in');

    // Hide preloader, show content
    const preloader = document.getElementById('preloader');
    const content = document.getElementById('content');
    if (preloader) preloader.style.display = 'none';
    if (content) content.style.display = 'block';

    // Show fade-blur images
    const images = document.querySelectorAll('.fade-blur-image');
    images.forEach(image => {
        image.classList.add('show');
    });
});