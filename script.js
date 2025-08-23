document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const chartsListContainer = document.getElementById('charts-list-container');
    const searchInput = document.getElementById('chart-search');
    const nav = document.getElementById('nav');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    // --- ESTADO DE LA APLICACIÓN ---
    let allChartsData = {}; // Almacena todos los datos de los charts procesados

    // --- ICONOS SVG para botones y detalles ---
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    };

    // --- LÓGICA DE CARGA Y RENDERIZADO DE CHARTS ---

    /**
     * Carga y procesa el archivo index.yaml del repositorio de Helm.
     */
    async function loadCharts() {
        try {
            const response = await fetch('index.yaml');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);

            // Agrupa todas las versiones bajo un único nombre de chart
            for (const [name, versions] of Object.entries(data.entries)) {
                allChartsData[name] = {
                    name: name,
                    // Ordena las versiones de más nueva a más antigua
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

    /**
     * Renderiza la lista de charts en el contenedor del DOM.
     * @param {Array} chartsToRender - Array de objetos de chart a renderizar.
     */
    function renderChartList(chartsToRender) {
        if (chartsToRender.length === 0) {
            chartsListContainer.innerHTML = 'No charts found matching your search.';
            chartsListContainer.classList.add('no-results');
            return;
        }
        chartsListContainer.classList.remove('no-results');

        chartsListContainer.innerHTML = chartsToRender.map(chart => {
            const latestVersion = chart.versions[0];
            const versionOptions = chart.versions.map(v => `<option value="${v.version}">${v.version}</option>`).join('');

            return `
                <div class="chart-item" id="chart-${chart.name}" data-chart-name="${chart.name}">
                    <div class="chart-item-header">
                        <div>
                            <h3>${chart.name}</h3>
                            <p class="chart-item-description">${latestVersion.description || ''}</p>
                        </div>
                        <span class="chart-version-badge">v${latestVersion.version}</span>
                    </div>
                    <div class="chart-details">
                        <div class="details-panel">
                            <div class="details-header">
                                <h4>Chart Details</h4>
                                <select class="version-selector" data-chart-name="${chart.name}">${versionOptions}</select>
                            </div>
                            <div class="details-body" data-details-container>
                                <!-- Los detalles se inyectarán aquí -->
                            </div>
                            <div class="helm-install-block" data-helm-container>
                                <!-- El bloque de instalación de Helm se inyectará aquí -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Renderiza inicialmente los detalles para todas las tarjetas (ocultos por defecto)
        chartsToRender.forEach(chart => {
            updateChartDetailsView(chart.name, chart.versions[0].version);
        });
    }

    /**
     * Actualiza la vista de detalles para un chart y versión específicos.
     * @param {string} chartName - El nombre del chart a actualizar.
     * @param {string} version - La versión específica a mostrar.
     */
    function updateChartDetailsView(chartName, version) {
        const chartData = allChartsData[chartName];
        const versionData = chartData.versions.find(v => v.version === version);
        if (!versionData) return;

        const chartItemElement = document.getElementById(`chart-${chartName}`);
        const detailsContainer = chartItemElement.querySelector('[data-details-container]');
        const helmContainer = chartItemElement.querySelector('[data-helm-container]');
        const versionBadge = chartItemElement.querySelector('.chart-version-badge');

        // Actualizar el badge de la cabecera
        versionBadge.textContent = `v${versionData.version}`;

        const maintainers = versionData.maintainers?.map(m => `<a href="mailto:${m.email}" target="_blank">${m.name}</a>`).join(', ') || 'N/A';
        const keywords = versionData.keywords ? `<ul class="keywords-list">${versionData.keywords.map(k => `<li>${k}</li>`).join('')}</ul>` : 'N/A';
        const sources = versionData.sources?.map(s => `<a href="${s}" target="_blank" rel="noopener noreferrer">${s}</a>`).join('<br>') || 'N/A';
        const homeLink = versionData.home ? `<a href="${versionData.home}" target="_blank" rel="noopener noreferrer">${versionData.home}</a>` : 'N/A';

        detailsContainer.innerHTML = `
            <div class="detail-item"><strong>App Version</strong><div class="detail-item-content">${versionData.appVersion || 'N/A'}</div></div>
            <div class="detail-item"><strong>Home</strong><div class="detail-item-content">${homeLink}</div></div>
            <div class="detail-item"><strong>Maintainers</strong><div class="detail-item-content">${maintainers}</div></div>
            <div class="detail-item"><strong>Sources</strong><div class="detail-item-content">${sources}</div></div>
            <div class="detail-item"><strong>Keywords</strong><div class="detail-item-content">${keywords}</div></div>
        `;

        const repoName = 'eggybyte';
        const installCommand = `helm install my-${versionData.name} ${repoName}/${versionData.name} --version ${versionData.version}`;
        const helmCommands = `<span class="comment"># Install chart version ${versionData.version}</span>\n<span class="command">${installCommand}</span>`;

        helmContainer.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-dot terminal-dot-red"></div>
                <div class="terminal-dot terminal-dot-yellow"></div>
                <div class="terminal-dot terminal-dot-green"></div>
                <button class="copy-btn" data-clipboard-text="${installCommand}" title="Copy Install Command">${ICONS.copy}</button>
            </div>
            <div class="terminal-content"><pre><code>${helmCommands}</code></pre></div>
        `;
    }


    // --- MANEJADORES DE EVENTOS ---

    // Búsqueda de charts
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

    // Delegación de eventos para las tarjetas de chart
    chartsListContainer.addEventListener('click', (e) => {
        const header = e.target.closest('.chart-item-header');
        if (header) {
            header.parentElement.classList.toggle('active');
        }

        const copyButton = e.target.closest('.copy-btn');
        if (copyButton) {
            const textToCopy = copyButton.dataset.clipboardText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyButton.innerHTML = ICONS.check;
                setTimeout(() => { copyButton.innerHTML = ICONS.copy; }, 2000);
            });
        }
    });

    // Cambio de versión
    chartsListContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('version-selector')) {
            const chartName = e.target.dataset.chartName;
            const newVersion = e.target.value;
            updateChartDetailsView(chartName, newVersion);
        }
    });

    // --- FUNCIONALIDAD UI GENERAL ---

    // Menú móvil
    mobileMenuBtn.addEventListener('click', () => nav.classList.toggle('active'));

    // Ocultar cabecera al hacer scroll hacia abajo
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });

    // --- CARGA INICIAL ---
    loadCharts();
});