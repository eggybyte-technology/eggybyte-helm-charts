document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const chartsListContainer = document.getElementById('charts-list-container');
    const searchInput = document.getElementById('chart-search');
    const nav = document.getElementById('nav');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    // --- APP STATE ---
    let allChartsData = {};

    // --- SVG ICONS FOR UI ELEMENTS ---
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        home: `<div class="detail-card-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
        appVersion: `<div class="detail-card-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg></div>`,
        maintainers: `<div class="detail-card-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>`,
        sources: `<div class="detail-card-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg></div>`,
        keywords: `<div class="detail-card-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></div>`
    };

    // --- CHART LOADING & RENDERING LOGIC ---

    async function loadCharts() {
        try {
            const response = await fetch('index.yaml');
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = jsyaml.load(await response.text());

            for (const [name, versions] of Object.entries(data.entries)) {
                allChartsData[name] = {
                    name: name,
                    versions: versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true })),
                };
            }
            const sortedCharts = Object.values(allChartsData).sort((a, b) => a.name.localeCompare(b.name));
            renderChartList(sortedCharts);
        } catch (error) {
            console.error('Error loading or parsing Helm charts:', error);
            chartsListContainer.innerHTML = `<p class="error-message">Could not load Helm chart repository.</p>`;
            chartsListContainer.classList.add('no-results');
        }
    }

    function renderChartList(chartsToRender) {
        chartsListContainer.innerHTML = '';
        if (chartsToRender.length === 0) {
            chartsListContainer.innerHTML = 'No charts found matching your search.';
            chartsListContainer.classList.add('no-results');
            return;
        }
        chartsListContainer.classList.remove('no-results');

        chartsToRender.forEach((chart, index) => {
            const latestVersion = chart.versions[0];
            const chartElement = document.createElement('div');
            chartElement.className = 'chart-item';
            chartElement.id = `chart-${chart.name}`;
            chartElement.dataset.chartName = chart.name;
            chartElement.innerHTML = `
                <div class="chart-item-header">
                    <div>
                        <h3>${chart.name}</h3>
                        <p class="chart-item-description">${latestVersion.description || ''}</p>
                    </div>
                    <span class="chart-version-badge">v${latestVersion.version}</span>
                </div>
                <div class="chart-details">
                    <div>
                        <div class="details-content"></div>
                    </div>
                </div>`;
            chartsListContainer.appendChild(chartElement);
            setTimeout(() => {
                chartElement.classList.add('visible');
            }, index * 100);
            updateChartDetailsView(chart.name, latestVersion.version);
        });
    }

    function updateChartDetailsView(chartName, version) {
        const chartData = allChartsData[chartName];
        const versionData = chartData.versions.find(v => v.version === version);
        if (!versionData) return;

        const chartItemElement = document.getElementById(`chart-${chartName}`);
        const contentContainer = chartItemElement.querySelector('.details-content');
        chartItemElement.querySelector('.chart-version-badge').textContent = `v${versionData.version}`;

        const versionOptions = chartData.versions.map(v =>
            `<div class="custom-select-option ${v.version === version ? 'selected' : ''}" data-value="${v.version}">${v.version}</div>`
        ).join('');

        const homeLink = versionData.home ? `<a href="${versionData.home}" target="_blank" rel="noopener noreferrer">${versionData.home}</a>` : 'N/A';
        const appVersion = `<span>${versionData.appVersion || 'N/A'}</span>`;
        const maintainers = versionData.maintainers?.map(m => `<a href="mailto:${m.email}" target="_blank">${m.name}</a>`).join(', ') || 'N/A';
        const sources = versionData.sources?.map(s => `<a href="${s}" target="_blank" rel="noopener noreferrer">${s}</a>`).join('<br>') || 'N/A';
        const keywords = versionData.keywords ? `<ul class="keywords-list">${versionData.keywords.map(k => `<li>${k}</li>`).join('')}</ul>` : 'N/A';

        const installCommand = `helm install my-${versionData.name} eggybyte/${versionData.name} --version ${versionData.version}`;

        contentContainer.innerHTML = `
            <div class="details-header">
                <h4>Chart Details</h4>
                <div class="custom-select-wrapper" data-chart-name="${chartName}">
                    <div class="custom-select-trigger">v${version}</div>
                    <div class="custom-select-options">${versionOptions}</div>
                </div>
            </div>
            <div class="details-body">
                <div class="details-grid-3-col">
                    <div class="detail-card">
                        <div class="detail-card-header">${ICONS.home}<strong>Home</strong></div>
                        <div class="detail-card-content">${homeLink}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-card-header">${ICONS.appVersion}<strong>App Version</strong></div>
                        <div class="detail-card-content">${appVersion}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-card-header">${ICONS.maintainers}<strong>Maintainers</strong></div>
                        <div class="detail-card-content">${maintainers}</div>
                    </div>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">${ICONS.sources}<strong>Sources</strong></div>
                    <div class="detail-card-content">${sources}</div>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">${ICONS.keywords}<strong>Keywords</strong></div>
                    <div class="detail-card-content">${keywords}</div>
                </div>
            </div>
            <div class="helm-install-block">
                <div class="terminal-header">
                    <div class="terminal-dots"><div class="terminal-dot" style="background:#ff5f56;"></div><div class="terminal-dot" style="background:#ffbd2e;"></div><div class="terminal-dot" style="background:#27c93f;"></div></div>
                    <button class="copy-btn" data-clipboard-text="${installCommand}" title="Copy Command">${ICONS.copy}</button>
                </div>
                <div class="terminal-content"><pre><code><span class="comment"># Install chart version ${versionData.version}</span>\n<span class="prompt">$ </span><span class="command">${installCommand}</span></code></pre></div>
            </div>
        `;
    }

    // --- EVENT HANDLERS ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCharts = Object.values(allChartsData).filter(chart => {
            const latest = chart.versions[0];
            return latest.name.toLowerCase().includes(searchTerm) ||
                latest.description?.toLowerCase().includes(searchTerm) ||
                latest.keywords?.some(k => k.toLowerCase().includes(searchTerm));
        });
        renderChartList(filteredCharts);
    });

    chartsListContainer.addEventListener('click', (e) => {
        const header = e.target.closest('.chart-item-header');
        if (header) {
            header.parentElement.classList.toggle('active');
        }
        const copyButton = e.target.closest('.copy-btn');
        if (copyButton) {
            navigator.clipboard.writeText(copyButton.dataset.clipboardText).then(() => {
                copyButton.innerHTML = ICONS.check;
                setTimeout(() => { copyButton.innerHTML = ICONS.copy; }, 2000);
            });
        }
        const selectTrigger = e.target.closest('.custom-select-trigger');
        if (selectTrigger) {
            selectTrigger.parentElement.classList.toggle('open');
        }
        const selectOption = e.target.closest('.custom-select-option');
        if (selectOption) {
            const wrapper = selectOption.closest('.custom-select-wrapper');
            const chartName = wrapper.dataset.chartName;
            const newVersion = selectOption.dataset.value;
            wrapper.classList.remove('open');
            updateChartDetailsView(chartName, newVersion);
        }
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.custom-select-wrapper.open').forEach(wrapper => {
                wrapper.classList.remove('open');
            });
        }
    });

    // --- GENERAL UI FUNCTIONALITY ---
    mobileMenuBtn.addEventListener('click', () => nav.classList.toggle('active'));

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll <= 0 ? 0 : currentScroll;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    document.querySelectorAll('.feature-card').forEach(card => observer.observe(card));

    // --- DYNAMIC BACKGROUND ANIMATION ---
    const canvas = document.getElementById('tech-background');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 1;
            this.speedX = (Math.random() * 1 - 0.5) * 0.5;
            this.speedY = (Math.random() * 1 - 0.5) * 0.5;
            this.color = 'rgba(129, 140, 248, 0.7)';
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            this.x += this.speedX;
            this.y += this.speedY;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const numberOfParticles = (canvas.width * canvas.height) / 12000;
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle());
        }
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    const opacityValue = 1 - (distance / 150);
                    ctx.strokeStyle = `rgba(129, 140, 248, ${opacityValue})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const particle of particles) {
            particle.update();
            particle.draw();
        }
        connectParticles();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        setCanvasSize();
        initParticles();
    });

    setCanvasSize();
    initParticles();
    animate();

    // --- INITIAL LOAD ---
    loadCharts();
});