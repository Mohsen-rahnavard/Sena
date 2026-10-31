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

    // Smooth Scroll for Anchor Links (the Listen toggle only opens its menu)
    document.querySelectorAll('a[href^="#"]:not(.dropdown-toggle)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});



// Reveal headings, album covers, platforms and images as they scroll into view
function revealOnScroll() {
    const revealItems = document.querySelectorAll('.fade-blur-image, .section-label, .buyingSection, .photo-grid, .platform-list');

    // Stagger the items inside each list
    document.querySelectorAll('.photo-grid, .platform-list').forEach(list => {
        Array.from(list.children).forEach((item, i) => item.style.setProperty('--i', i));
    });

    if (!('IntersectionObserver' in window)) {
        revealItems.forEach(item => item.classList.add('show'));
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealItems.forEach(item => observer.observe(item));
}

// Spin the record, drop the needle and light up the console while the turntable is on screen
function playTurntable() {
    const turntable = document.querySelector('.turntable');
    const listenConsole = document.querySelector('.listen-console');
    if (!turntable || !listenConsole) return;

    if (!('IntersectionObserver' in window)) {
        listenConsole.classList.add('is-playing');
        return;
    }

    new IntersectionObserver(function (entries) {
        listenConsole.classList.toggle('is-playing', entries[0].intersectionRatio >= 0.5);
    }, { threshold: 0.5 }).observe(turntable);
}

// Topographic contour lines behind the About file; the ground rises under the pointer
function drawTopography() {
    const panel = document.querySelector('.about-file');
    const canvas = panel && panel.querySelector('.topo');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const CELL = 10;    // grid spacing in px
    const STEP = 0.07;  // height between contour lines
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0, lift: 0, toX: 0, toY: 0, toLift: 0 };
    let width, height, cols, rows, ground, field, color;
    let frame = 0;

    function hash(x, y) {
        let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    // Gradient noise
    function noise(x, y) {
        const x0 = Math.floor(x), y0 = Math.floor(y);
        const fx = x - x0, fy = y - y0;
        const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
        const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
        const corner = (ix, iy) => {
            const angle = hash(ix, iy) * Math.PI * 2;
            return Math.cos(angle) * (x - ix) + Math.sin(angle) * (y - iy);
        };
        const n00 = corner(x0, y0), n10 = corner(x0 + 1, y0);
        const n01 = corner(x0, y0 + 1), n11 = corner(x0 + 1, y0 + 1);
        const top = n00 + u * (n10 - n00);
        const bottom = n01 + u * (n11 - n01);
        return top + v * (bottom - top);
    }

    function build() {
        width = panel.clientWidth;
        height = panel.clientHeight;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        color = getComputedStyle(canvas).color;

        cols = Math.ceil(width / CELL) + 1;
        rows = Math.ceil(height / CELL) + 1;
        ground = new Float32Array(cols * rows);
        field = new Float32Array(cols * rows);

        // Rolling ground with one summit near the top right
        const peakX = width * 0.8, peakY = height * 0.28;
        const spread = 2 * Math.pow(Math.min(width, height) * 0.3, 2);
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = i * CELL, y = j * CELL;
                const summit = Math.exp(-((x - peakX) ** 2 + (y - peakY) ** 2) / spread);
                ground[j * cols + i] = noise(x / 240, y / 240) + noise(x / 90 + 17, y / 90 + 5) * 0.3 + summit * 0.9;
            }
        }
        render();
    }

    // Marching squares: draw where height t crosses one grid cell
    function trace(path, t, x, y, a, b, c, d) {
        const code = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        if (code === 0 || code === 15) return;
        const topX = x + CELL * (t - a) / (b - a);
        const rightY = y + CELL * (t - b) / (c - b);
        const bottomX = x + CELL * (t - d) / (c - d);
        const leftY = y + CELL * (t - a) / (d - a);
        const right = x + CELL, bottom = y + CELL;
        switch (code) {
            case 1: case 14: path.moveTo(x, leftY); path.lineTo(bottomX, bottom); break;
            case 2: case 13: path.moveTo(bottomX, bottom); path.lineTo(right, rightY); break;
            case 3: case 12: path.moveTo(x, leftY); path.lineTo(right, rightY); break;
            case 4: case 11: path.moveTo(topX, y); path.lineTo(right, rightY); break;
            case 6: case 9: path.moveTo(topX, y); path.lineTo(bottomX, bottom); break;
            case 7: case 8: path.moveTo(x, leftY); path.lineTo(topX, y); break;
            case 5:
                path.moveTo(topX, y); path.lineTo(right, rightY);
                path.moveTo(x, leftY); path.lineTo(bottomX, bottom);
                break;
            case 10:
                path.moveTo(x, leftY); path.lineTo(topX, y);
                path.moveTo(bottomX, bottom); path.lineTo(right, rightY);
                break;
        }
    }

    function render() {
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const k = j * cols + i;
                let h = ground[k];
                if (pointer.lift > 0.001) {
                    const dx = i * CELL - pointer.x, dy = j * CELL - pointer.y;
                    h += pointer.lift * Math.exp(-(dx * dx + dy * dy) / 8000);
                }
                field[k] = h;
            }
        }

        // Every fifth line is an index contour, drawn heavier
        const minor = new Path2D();
        const major = new Path2D();
        for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
                const k = j * cols + i;
                const a = field[k], b = field[k + 1], c = field[k + cols + 1], d = field[k + cols];
                const first = Math.ceil(Math.min(a, b, c, d) / STEP);
                const last = Math.floor(Math.max(a, b, c, d) / STEP);
                for (let n = first; n <= last; n++) {
                    trace(n % 5 === 0 ? major : minor, n * STEP, i * CELL, j * CELL, a, b, c, d);
                }
            }
        }

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.stroke(minor);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.3;
        ctx.stroke(major);
    }

    function animate() {
        if (frame) return;
        frame = requestAnimationFrame(function step() {
            pointer.x += (pointer.toX - pointer.x) * 0.2;
            pointer.y += (pointer.toY - pointer.y) * 0.2;
            pointer.lift += (pointer.toLift - pointer.lift) * 0.12;
            render();
            const moving = Math.abs(pointer.toX - pointer.x) > 0.5 ||
                Math.abs(pointer.toY - pointer.y) > 0.5 ||
                Math.abs(pointer.toLift - pointer.lift) > 0.004;
            frame = moving ? requestAnimationFrame(step) : 0;
        });
    }

    if (!still) {
        panel.addEventListener('pointermove', function (e) {
            if (e.pointerType === 'touch') return;
            const rect = panel.getBoundingClientRect();
            pointer.toX = e.clientX - rect.left;
            pointer.toY = e.clientY - rect.top;
            if (pointer.lift < 0.01) {
                pointer.x = pointer.toX;
                pointer.y = pointer.toY;
            }
            pointer.toLift = 0.5;
            animate();
        });

        panel.addEventListener('pointerleave', function () {
            pointer.toLift = 0;
            animate();
        });
    }

    if ('ResizeObserver' in window) {
        new ResizeObserver(build).observe(panel);
    } else {
        build();
        window.addEventListener('resize', build);
    }
}

// Waveform for the latest release: fills as the track plays, click to seek
function buildReleaseWave() {
    const wave = document.querySelector('.release-wave');
    const audio = document.querySelector('.release-panel audio');
    if (!wave || !audio) return;

    const BARS = 64;
    for (let i = 0; i < BARS; i++) {
        const bar = document.createElement('span');
        const swell = Math.sin((i / BARS) * Math.PI) * 0.35;
        const shape = 0.35 + swell + Math.sin(i * 0.9) * 0.15 + Math.sin(i * 2.3) * 0.12;
        bar.style.height = Math.round(Math.min(1, Math.max(0.12, shape)) * 100) + '%';
        wave.appendChild(bar);
    }

    const bars = wave.children;
    audio.addEventListener('timeupdate', function () {
        const played = audio.duration ? audio.currentTime / audio.duration : 0;
        for (let i = 0; i < BARS; i++) bars[i].classList.toggle('played', i / BARS < played);
    });

    wave.addEventListener('click', function (e) {
        if (!audio.duration) return;
        const rect = wave.getBoundingClientRect();
        audio.currentTime = (e.clientX - rect.left) / rect.width * audio.duration;
    });
}

// Contact form: posts to api/contact.js, so the email address never appears on the page
function setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const status = form.querySelector('.form-status');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        button.disabled = true;
        status.className = 'form-status';
        status.textContent = 'Sending…';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            form.reset();
            status.classList.add('is-sent');
            status.textContent = 'Message sent. Thanks, I will reply by email.';
        } catch (error) {
            status.classList.add('is-error');
            status.textContent = 'Message not sent. Check your connection and try again.';
        } finally {
            button.disabled = false;
        }
    });
}

// All window load logic in one place
window.addEventListener('load', function() {
    // Fade-in effect
    document.body.classList.add('fade-in');

    // Hide preloader, show content
    const preloader = document.getElementById('preloader');
    const content = document.getElementById('content');
    if (preloader) preloader.style.display = 'none';
    if (content) content.style.display = 'block';

    // Scroll-driven effects
    revealOnScroll();
    playTurntable();
    drawTopography();
    buildReleaseWave();
    setupContactForm();
});