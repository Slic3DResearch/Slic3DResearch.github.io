document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // Check if script starts

    // --- Mobile Navigation Toggle ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const bodyEl = document.body; // Get body element

    if (navToggle && navMenu && bodyEl) {
        console.log("Nav toggle and menu found.");
        navToggle.addEventListener('click', () => {
            console.log("Nav toggle clicked.");
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            // Prevent body scroll when menu is open
            bodyEl.classList.toggle('no-scroll', !isExpanded);
            console.log("Body no-scroll toggled:", bodyEl.classList.contains('no-scroll'));
        });

        // Close menu when a link is clicked
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (navMenu.classList.contains('active')) {
                    const href = link.getAttribute('href');
                    // No preventDefault needed here unless specifically stopping hash link jumps entirely
                    console.log("Nav link clicked, closing menu.");
                    navToggle.setAttribute('aria-expanded', 'false');
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    bodyEl.classList.remove('no-scroll');
                }
            });
        });
    } else {
        console.error("Mobile navigation elements not found!");
    }

    // --- Header Shadow on Scroll ---
    const header = document.querySelector('.site-header');
    if (header) {
        console.log("Header found for scroll listener.");
        const scrollThreshold = 50;
        let isScrolled = false;

        const handleScroll = () => {
            const shouldBeScrolled = window.scrollY > scrollThreshold;
            if (shouldBeScrolled !== isScrolled) {
                header.classList.toggle('scrolled', shouldBeScrolled);
                isScrolled = shouldBeScrolled;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    } else {
        console.error("Site header not found for scroll effect!");
    }

    // --- Intersection Observer for Animations ---
    const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-slide-in-up, .animate-slide-in-left');
    if (animatedElements.length > 0) {
        console.log(`Found ${animatedElements.length} elements to animate.`);
        if ('IntersectionObserver' in window) {
            console.log("IntersectionObserver is supported.");
            try {
                const observer = new IntersectionObserver((entries, observerInstance) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observerInstance.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                animatedElements.forEach(el => { observer.observe(el); });
                console.log("IntersectionObserver setup complete.");
            } catch (error) {
                 console.error("Error setting up IntersectionObserver:", error);
                 animatedElements.forEach(el => { el.classList.add('is-visible'); });
            }
        } else {
            console.warn("IntersectionObserver not supported, showing all animated elements immediately.");
            animatedElements.forEach(el => { el.classList.add('is-visible'); });
        }
    } else {
        console.log("No elements found for animation observer.");
    }

    // --- Smooth Scroll for internal links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (href.length > 1 && targetElement) {
                e.preventDefault();
                console.log(`Smooth scrolling to: #${targetId}`);
                const headerOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '70', 10);
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 10; // Buffer

                window.scrollTo({ top: offsetPosition, behavior: "smooth" });

                if (navMenu && navMenu.classList.contains('active') && navToggle) {
                     console.log("Closing mobile nav after smooth scroll.");
                     navToggle.click();
                }
            } else {
                 console.warn(`Smooth scroll target not found for href: ${href}`);
            }
        });
    });

    // --- Update Active Nav Link based on Scroll Position ---
    function debounce(func, wait = 15, immediate = false) { /* Debounce function as before */
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() { timeout = null; if (!immediate) func.apply(context, args); };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const navLinks = document.querySelectorAll('.nav-menu a');
    const headerHeightOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '70', 10) + 20;

    const updateActiveNavLink = debounce(() => { /* updateActiveNavLink function as before */
        if (!sections.length || !navLinks.length) return;
        let currentSectionId = '';
        const scrollPosition = window.scrollY;
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            const sectionTop = section.offsetTop - headerHeightOffset;
            if (scrollPosition >= sectionTop) { currentSectionId = section.getAttribute('id'); break; }
        }
        if (currentSectionId === '' && scrollPosition < (sections[0]?.offsetTop - headerHeightOffset || window.innerHeight * 0.6)) {
             if (document.body.classList.contains('page-home')) { currentSectionId = 'hero'; }
        }

        let activeLinkFound = false;
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href'); let linkTargetId = '';
            if (linkHref) {
                if (linkHref === './' || linkHref === '/') { linkTargetId = 'hero'; }
                else if (linkHref.includes('#')) { linkTargetId = linkHref.substring(linkHref.lastIndexOf('#') + 1); }
            }
            if (linkTargetId && linkTargetId === currentSectionId) {
                link.classList.add('active'); activeLinkFound = true;
            }
        });

        if (!activeLinkFound) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            navLinks.forEach(link => {
                const linkPage = (link.getAttribute('href') || '').split('/').pop();
                const isCurrentPage = linkPage === currentPage || (currentPage === 'index.html' && (linkPage === '' || linkPage === '/'));
                const isHomeLink = (link.getAttribute('href') === './' || link.getAttribute('href') === '/');

                if (isCurrentPage || (isHomeLink && currentPage === 'index.html')) {
                    // Ensure only one link gets active, prioritize non-home if possible
                    let alreadyActive = false;
                    navLinks.forEach(l => { if(l.classList.contains('active')) alreadyActive = true; });
                    if (!alreadyActive || (isHomeLink && currentPage === 'index.html')) {
                         link.classList.add('active');
                    }
                }
            });
             // Final check to ensure only one is active
             let firstActiveFound = false;
             navLinks.forEach(link => {
                 if (link.classList.contains('active')) {
                     if (firstActiveFound) { link.classList.remove('active'); }
                     firstActiveFound = true;
                 }
             });
        }
    }, 50);

    updateActiveNavLink();
    window.addEventListener('scroll', updateActiveNavLink);
    window.addEventListener('resize', updateActiveNavLink);
    console.log("Active link update listeners added.");

    // --- Update Copyright Year ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
        console.log("Copyright year updated.");
    }

}); // End DOMContentLoaded