/* ============================================
   TRND — Amsterdam Home Décor
   Scroll Effects & Interactions
   ============================================ */

(function () {
    'use strict';

    // --- Loader ---
    const loader = document.getElementById('loader');
    function dismissLoader() {
        loader.classList.add('hidden');
        document.querySelector('.hero').classList.add('loaded');
        window.removeEventListener('scroll', dismissLoader);
        window.removeEventListener('wheel', dismissLoader);
        window.removeEventListener('touchmove', dismissLoader);
    }
    window.addEventListener('scroll', dismissLoader);
    window.addEventListener('wheel', dismissLoader);
    window.addEventListener('touchmove', dismissLoader);

    // --- Custom Cursor ---
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    if (window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        function animateCursor() {
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Cursor interactions
        const interactiveElements = document.querySelectorAll('a, button, .h-card, .art-item, .tag, input');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('active');
                follower.classList.add('active');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('active');
                follower.classList.remove('active');
            });
        });
    } else {
        cursor.style.display = 'none';
        follower.style.display = 'none';
        document.body.style.cursor = 'auto';
    }

    // --- Navigation ---
    const nav = document.getElementById('nav');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScrollY = window.scrollY;
    });

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });

    // --- Smooth anchor scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- Horizontal Scroll + Drag/Swipe ---
    const horizontalSection = document.querySelector('.horizontal-section');
    const horizontalInner = document.getElementById('horizontalInner');
    const horizontalPin = document.querySelector('.horizontal-pin');
    const hPrevBtn = document.getElementById('hPrev');
    const hNextBtn = document.getElementById('hNext');
    const hCurrentEl = document.getElementById('hCurrent');
    const hTotalEl = document.getElementById('hTotal');

    let isDragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let currentOffset = 0;
    let lastDragX = 0;
    let dragVelocity = 0;
    let lastDragTime = 0;

    function getMaxOffset() {
        if (!horizontalInner || !horizontalPin) return 0;
        return Math.max(0, horizontalInner.scrollWidth - horizontalPin.clientWidth);
    }

    function getCards() {
        return horizontalInner ? horizontalInner.querySelectorAll('.h-card') : [];
    }

    function setOffset(offset, animate = false) {
        const max = getMaxOffset();
        currentOffset = Math.max(0, Math.min(max, offset));
        horizontalInner.style.transition = animate
            ? 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'none';
        horizontalInner.style.transform = `translateX(${-currentOffset}px)`;
        updateCounter();
        updateNavButtons();
    }

    function updateCounter() {
        if (!hCurrentEl || !hTotalEl) return;
        const cards = getCards();
        if (!cards.length) return;
        const cardWidth = cards[0].offsetWidth + 32;
        const idx = Math.min(cards.length - 1, Math.round(currentOffset / cardWidth));
        hCurrentEl.textContent = idx + 1;
        hTotalEl.textContent = cards.length;
    }

    function updateNavButtons() {
        if (!hPrevBtn || !hNextBtn) return;
        hPrevBtn.disabled = currentOffset <= 0;
        hNextBtn.disabled = currentOffset >= getMaxOffset() - 1;
    }

    function snapToCard(velocityHint) {
        const cards = getCards();
        if (!cards.length) return;
        const cardWidth = cards[0].offsetWidth + 32;
        // Use velocity to determine how many cards to skip
        const momentum = velocityHint * 0.3;
        const projectedOffset = currentOffset + momentum;
        const targetIdx = Math.round(projectedOffset / cardWidth);
        const clampedIdx = Math.max(0, Math.min(cards.length - 1, targetIdx));
        setOffset(clampedIdx * cardWidth, true);
    }

    // --- Drag (mouse) ---
    if (horizontalPin) {
        horizontalPin.addEventListener('mousedown', e => {
            if (e.target.closest('.h-nav-btn')) return;
            isDragging = true;
            dragStartX = e.clientX;
            lastDragX = e.clientX;
            dragStartOffset = currentOffset;
            dragVelocity = 0;
            lastDragTime = Date.now();
            horizontalPin.classList.add('dragging');
            e.preventDefault();
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const now = Date.now();
            const dt = now - lastDragTime || 1;
            dragVelocity = (lastDragX - e.clientX) / dt * 16; // px per frame
            lastDragX = e.clientX;
            lastDragTime = now;
            setOffset(dragStartOffset + (dragStartX - e.clientX), false);
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            horizontalPin.classList.remove('dragging');
            snapToCard(dragVelocity);
        });

        // --- Swipe (touch) ---
        horizontalPin.addEventListener('touchstart', e => {
            if (e.target.closest('.h-nav-btn')) return;
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            lastDragX = e.touches[0].clientX;
            dragStartOffset = currentOffset;
            dragVelocity = 0;
            lastDragTime = Date.now();
        }, { passive: true });

        horizontalPin.addEventListener('touchmove', e => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const diff = dragStartX - touch.clientX;
            const now = Date.now();
            const dt = now - lastDragTime || 1;
            dragVelocity = (lastDragX - touch.clientX) / dt * 16;
            lastDragX = touch.clientX;
            lastDragTime = now;
            if (Math.abs(diff) > 8) {
                e.preventDefault();
                setOffset(dragStartOffset + diff, false);
            }
        }, { passive: false });

        horizontalPin.addEventListener('touchend', e => {
            if (!isDragging) return;
            isDragging = false;
            snapToCard(dragVelocity);
        });
    }

    // --- Arrow buttons ---
    function snapDirection(dir) {
        const cards = getCards();
        if (!cards.length) return;
        const cardWidth = cards[0].offsetWidth + 32;
        const currentIdx = Math.round(currentOffset / cardWidth);
        const targetIdx = Math.max(0, Math.min(cards.length - 1, currentIdx + dir));
        setOffset(targetIdx * cardWidth, true);
    }
    if (hPrevBtn) hPrevBtn.addEventListener('click', () => snapDirection(-1));
    if (hNextBtn) hNextBtn.addEventListener('click', () => snapDirection(1));

    // Initialize carousel counter & buttons
    updateCounter();
    updateNavButtons();
    window.addEventListener('resize', () => {
        setOffset(currentOffset, false);
    });

    // --- Parallax Effect ---
    function handleParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-img-wrap');
        parallaxElements.forEach(el => {
            const rect = el.parentElement.getBoundingClientRect();
            const speed = 0.3;
            const yPos = rect.top * speed;
            el.style.transform = `translateY(${yPos}px)`;
        });

        // Hero parallax
        const heroBg = document.querySelector('.hero-bg-img');
        if (heroBg) {
            const scrollY = window.scrollY;
            heroBg.style.transform = `scale(${1 + scrollY * 0.0001}) translateY(${scrollY * 0.3}px)`;
        }
    }

    // --- Scroll-triggered animations (Intersection Observer) ---
    function setupScrollAnimations() {
        // Add animation classes to elements
        document.querySelectorAll('.philosophy-text').forEach(el => el.classList.add('split-text'));
        document.querySelectorAll('.art-item').forEach((el, i) => {
            el.classList.add('fade-up');
            el.style.transitionDelay = `${i * 0.1}s`;
        });
        document.querySelectorAll('.h-card').forEach((el, i) => {
            el.classList.add('scale-in');
            el.style.transitionDelay = `${i * 0.05}s`;
        });

        // Section headers
        document.querySelectorAll('.section-title').forEach(el => el.classList.add('fade-up'));
        document.querySelectorAll('.section-label').forEach(el => el.classList.add('fade-up'));

        // Lifestyle section
        const lifestyleLeft = document.querySelector('.lifestyle-left');
        if (lifestyleLeft) lifestyleLeft.classList.add('slide-right');
        const lifestyleContent = document.querySelector('.lifestyle-content');
        if (lifestyleContent) lifestyleContent.classList.add('slide-left');

        // Contact section
        const contactLeft = document.querySelector('.contact-left');
        if (contactLeft) contactLeft.classList.add('fade-up');
        const contactRight = document.querySelector('.contact-right');
        if (contactRight) contactRight.classList.add('fade-up');

        // Philosophy label, manifesto & footer
        const philLabel = document.querySelector('.philosophy-label');
        if (philLabel) philLabel.classList.add('fade-up');
        const philAttribution = document.querySelector('.philosophy-attribution');
        if (philAttribution) philAttribution.classList.add('fade-up');
        const manifesto = document.querySelector('.manifesto-text');
        if (manifesto) manifesto.classList.add('split-text');
        const philFooter = document.querySelector('.philosophy-footer');
        if (philFooter) philFooter.classList.add('fade-up');

        // Stats
        document.querySelectorAll('.stat').forEach((el, i) => {
            el.classList.add('fade-up');
            el.style.transitionDelay = `${i * 0.15}s`;
        });

        // Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Start counting if it's a stat
                    const statNum = entry.target.querySelector('.stat-num');
                    if (statNum && !statNum.dataset.counted) {
                        animateCounter(statNum);
                        statNum.dataset.counted = 'true';
                    }
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.fade-up, .fade-in, .scale-in, .slide-left, .slide-right, .split-text').forEach(el => {
            observer.observe(el);
        });
    }

    // --- Counter Animation ---
    function animateCounter(el) {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        }

        requestAnimationFrame(update);
    }

    // --- Magnetic Effect on CTA buttons ---
    document.querySelectorAll('.cta-btn, .submit-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // --- Image Tilt Effect on Art Items ---
    document.querySelectorAll('.art-item-inner').forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            item.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
            item.style.transition = 'transform 0.5s ease';
            setTimeout(() => { item.style.transition = ''; }, 500);
        });
    });

    // --- Scroll-based marquee speed ---
    const marqueeTrack = document.querySelector('.marquee-track');
    let scrollSpeed = 1;

    function updateMarqueeSpeed() {
        const currentScroll = window.scrollY;
        const delta = Math.abs(currentScroll - lastScrollY);
        scrollSpeed = Math.min(3, 1 + delta * 0.05);

        if (marqueeTrack) {
            marqueeTrack.style.animationDuration = `${25 / scrollSpeed}s`;
        }
    }

    // --- Main scroll handler ---
    function onScroll() {
        handleParallax();
        updateMarqueeSpeed();
    }

    // Throttled scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                onScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // --- Initialize ---
    setupScrollAnimations();

    // --- Smooth page transition on nav links ---
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('mouseenter', function () {
            this.style.transition = 'all 0.3s ease';
        });
    });

    // --- Tag hover ripple ---
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.05)';
        });
        tag.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1)';
        });
    });

})();
