class HPCManualApp {
    constructor() {
        this.markdownContent = '';
        this.sections = [];
        this.currentSection = '';
        
        this.initializeApp();
    }

    async initializeApp() {
        await this.loadMarkdown();
        this.parseContent();
        this.setupNavigation();
        this.setupSearch();
        this.setupMobileMenu();
        this.setupTableOfContents();
        this.displayDefaultSection();
    }

    async loadMarkdown() {
        try {
            const response = await fetch('HPC_User_Manual.md');
            this.markdownContent = await response.text();
        } catch (error) {
            console.error('Error loading markdown:', error);
            document.getElementById('content').innerHTML = '<div class="loading">Error loading documentation. Please refresh the page.</div>';
        }
    }

    parseContent() {
        const lines = this.markdownContent.split('\n');
        let currentSection = null;
        let currentContent = [];
        
        lines.forEach(line => {
            if (line.startsWith('## ')) {
                if (currentSection) {
                    this.sections.push({
                        ...currentSection,
                        content: currentContent.join('\n')
                    });
                }
                currentSection = {
                    id: this.createId(line.replace('## ', '')),
                    title: line.replace('## ', ''),
                    level: 2
                };
                currentContent = [line];
            } else if (line.startsWith('# ')) {
                if (currentSection) {
                    this.sections.push({
                        ...currentSection,
                        content: currentContent.join('\n')
                    });
                }
                currentSection = {
                    id: this.createId(line.replace('# ', '')),
                    title: line.replace('# ', ''),
                    level: 1
                };
                currentContent = [line];
            } else {
                currentContent.push(line);
            }
        });
        
        if (currentSection) {
            this.sections.push({
                ...currentSection,
                content: currentContent.join('\n')
            });
        }
    }

    createId(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    setupNavigation() {
        const navMenu = document.getElementById('navMenu');
        
        this.sections.forEach(section => {
            const navItem = document.createElement('a');
            navItem.className = 'nav-item';
            navItem.textContent = section.title;
            navItem.href = `#${section.id}`;
            navItem.onclick = (e) => {
                e.preventDefault();
                this.displaySection(section.id);
                this.setActiveNavItem(navItem);
            };
            navMenu.appendChild(navItem);
        });
    }

    setupTableOfContents() {
        const tocContainer = document.getElementById('tableOfContents');
        
        this.sections.forEach(section => {
            const tocItem = document.createElement('a');
            tocItem.className = `toc-item level-${section.level}`;
            tocItem.textContent = section.title;
            tocItem.href = `#${section.id}`;
            tocItem.onclick = (e) => {
                e.preventDefault();
                this.displaySection(section.id);
                this.setActiveTocItem(tocItem);
            };
            tocContainer.appendChild(tocItem);
        });
    }

    displaySection(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;

        const contentDiv = document.getElementById('content');
        
        // Configure marked options
        marked.setOptions({
            highlight: function(code, lang) {
                if (Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            },
            breaks: true,
            gfm: true
        });

        contentDiv.innerHTML = marked.parse(section.content);
        
        this.currentSection = sectionId;
        this.updateActiveItems();
        
        // Scroll to top of content
        contentDiv.scrollTop = 0;
        window.scrollTo(0, 0);

        // Update URL without triggering navigation
        history.pushState(null, '', `#${sectionId}`);
    }

    displayDefaultSection() {
        if (this.sections.length > 0) {
            // Check if there's a hash in URL
            const hash = window.location.hash.replace('#', '');
            const sectionId = hash || this.sections[0].id;
            this.displaySection(sectionId);
        }
    }

    updateActiveItems() {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[href="#${this.currentSection}"]`);
        if (activeNavItem && activeNavItem.classList.contains('nav-item')) {
            activeNavItem.classList.add('active');
        }

        // Update TOC
        document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeTocItem = document.querySelector(`[href="#${this.currentSection}"].toc-item`);
        if (activeTocItem) {
            activeTocItem.classList.add('active');
        }
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    setActiveTocItem(activeItem) {
        document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) return;

            this.searchContent(query);
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Clear search on escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.clearSearchHighlights();
            }
        });
    }

    searchContent(query) {
        const results = [];
        
        this.sections.forEach(section => {
            const content = section.content.toLowerCase();
            if (content.includes(query)) {
                // Find the position of the match
                const index = content.indexOf(query);
                const start = Math.max(0, index - 100);
                const end = Math.min(content.length, index + 100);
                const excerpt = section.content.substring(start, end);
                
                results.push({
                    section: section,
                    excerpt: excerpt,
                    query: query
                });
            }
        });

        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        if (results.length === 0) {
            this.displayNoResults(query);
            return;
        }

        // Display first result
        const firstResult = results[0];
        this.displaySection(firstResult.section.id);
        
        // Highlight the search term
        setTimeout(() => {
            this.highlightSearchTerm(query);
        }, 100);
    }

    displayNoResults(query) {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div class="search-results">
                <h2>Search Results</h2>
                <p>No results found for "<strong>${query}</strong>".</p>
                <p>Try:</p>
                <ul>
                    <li>Checking your spelling</li>
                    <li>Using different keywords</li>
                    <li>Using more general terms</li>
                </ul>
            </div>
        `;
    }

    highlightSearchTerm(query) {
        const contentDiv = document.getElementById('content');
        const walker = document.createTreeWalker(
            contentDiv,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const regex = new RegExp(`(${query})`, 'gi');
            if (regex.test(text)) {
                const highlightedText = text.replace(regex, '<span class="highlight">$1</span>');
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedText;
                textNode.parentNode.replaceChild(wrapper, textNode);
            }
        });
    }

    clearSearchHighlights() {
        document.querySelectorAll('.highlight').forEach(element => {
            const parent = element.parentNode;
            parent.replaceChild(document.createTextNode(element.textContent), element);
            parent.normalize();
        });
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
        };

        mobileMenuBtn.addEventListener('click', toggleSidebar);
        sidebarToggle.addEventListener('click', toggleSidebar);

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // Close sidebar when navigating on mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HPCManualApp();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && window.hpcApp) {
        window.hpcApp.displaySection(hash);
    }
});