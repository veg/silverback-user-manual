class HPCManualApp {
    constructor() {
        this.markdownContent = '';
        this.sections = [];
        this.activeSection = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            await this.loadMarkdown();
            this.parseContent();
            this.renderContent();
            this.setupNavigation();
            this.setupScrollSpy();
            this.setupMobileMenu();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError();
        }
    }

    async loadMarkdown() {
        const response = await fetch('HPC_User_Manual.md');
        if (!response.ok) {
            throw new Error(`Failed to load markdown: ${response.status}`);
        }
        this.markdownContent = await response.text();
    }

    parseContent() {
        const lines = this.markdownContent.split('\n');
        let currentSection = null;
        let currentContent = [];
        
        lines.forEach(line => {
            if (line.startsWith('# ')) {
                // Save previous section
                if (currentSection) {
                    this.sections.push({
                        ...currentSection,
                        content: currentContent.join('\n')
                    });
                }
                // Start new level 1 section
                currentSection = {
                    id: this.createId(line.replace('# ', '')),
                    title: line.replace('# ', ''),
                    level: 1,
                    parent: null
                };
                currentContent = [line];
            } else if (line.startsWith('## ')) {
                // Save previous section
                if (currentSection) {
                    this.sections.push({
                        ...currentSection,
                        content: currentContent.join('\n')
                    });
                }
                // Start new level 2 section
                currentSection = {
                    id: this.createId(line.replace('## ', '')),
                    title: line.replace('## ', ''),
                    level: 2,
                    parent: this.findParentSection(1)
                };
                currentContent = [line];
            } else if (line.startsWith('### ')) {
                // Save previous section
                if (currentSection) {
                    this.sections.push({
                        ...currentSection,
                        content: currentContent.join('\n')
                    });
                }
                // Start new level 3 section
                currentSection = {
                    id: this.createId(line.replace('### ', '')),
                    title: line.replace('### ', ''),
                    level: 3,
                    parent: this.findParentSection(2)
                };
                currentContent = [line];
            } else {
                currentContent.push(line);
            }
        });
        
        // Don't forget the last section
        if (currentSection) {
            this.sections.push({
                ...currentSection,
                content: currentContent.join('\n')
            });
        }
    }

    findParentSection(level) {
        for (let i = this.sections.length - 1; i >= 0; i--) {
            if (this.sections[i].level === level) {
                return this.sections[i].id;
            }
        }
        return null;
    }

    createId(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\\s-]/g, '')
            .replace(/\\s+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    renderContent() {
        const contentElement = document.getElementById('content');
        let html = '';

        this.sections.forEach(section => {
            const renderedContent = marked.parse(section.content);
            html += `
                <section class="section" id="${section.id}">
                    <div class="section-container">
                        ${renderedContent}
                    </div>
                </section>
            `;
        });

        contentElement.innerHTML = html;
        
        // Re-run Prism.js syntax highlighting
        if (window.Prism) {
            Prism.highlightAll();
        }
    }

    setupNavigation() {
        const navMenu = document.getElementById('navMenu');
        
        // Group sections by parent for better organization
        const topLevelSections = this.sections.filter(s => s.level === 1);
        
        topLevelSections.forEach(section => {
            // Add main section
            const navItem = this.createNavItem(section);
            navMenu.appendChild(navItem);
            
            // Add subsections
            const subsections = this.sections.filter(s => s.parent === section.id);
            subsections.forEach(subsection => {
                const subNavItem = this.createNavItem(subsection, true);
                navMenu.appendChild(subNavItem);
            });
        });

        // Add orphaned level 2 sections (sections without level 1 parents)
        const orphanedSections = this.sections.filter(s => 
            s.level === 2 && !topLevelSections.find(top => top.id === s.parent)
        );
        
        if (orphanedSections.length > 0) {
            orphanedSections.forEach(section => {
                const navItem = this.createNavItem(section);
                navMenu.appendChild(navItem);
            });
        }
    }

    createNavItem(section, isSubItem = false) {
        const navItem = document.createElement('a');
        navItem.className = `nav-item${isSubItem ? ' sub-item' : ''}`;
        navItem.href = `#${section.id}`;
        navItem.textContent = section.title;
        navItem.dataset.sectionId = section.id;
        
        navItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.scrollToSection(section.id);
        });
        
        return navItem;
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = 60; // CSS var --header-height
            const targetPosition = section.offsetTop - headerHeight - 10;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    setupScrollSpy() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveSection(entry.target.id);
                }
            });
        }, {
            rootMargin: '-60px 0px -80% 0px', // Account for header height
            threshold: 0.1
        });

        // Observe all sections
        this.sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
            }
        });

        // Also listen to scroll events for better responsiveness
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveSection();
            }, 50);
        });
    }

    updateActiveSection() {
        const scrollPosition = window.scrollY + 80; // Offset for header
        
        for (let i = this.sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(this.sections[i].id);
            if (section && section.offsetTop <= scrollPosition) {
                this.setActiveSection(this.sections[i].id);
                break;
            }
        }
    }

    setActiveSection(sectionId) {
        if (this.activeSection === sectionId) return;
        
        this.activeSection = sectionId;
        
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.sectionId === sectionId) {
                item.classList.add('active');
            }
        });
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });

            // Close menu when clicking a nav item on mobile
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                    }
                });
            });
        }
    }

    showError() {
        const contentElement = document.getElementById('content');
        contentElement.innerHTML = `
            <div class="section">
                <div class="section-container">
                    <div class="loading">
                        <h2>Unable to load documentation</h2>
                        <p>Please check your connection and try refreshing the page.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HPCManualApp();
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const app = window.hpcApp;
        if (app) {
            app.scrollToSection(hash);
        }
    }
});