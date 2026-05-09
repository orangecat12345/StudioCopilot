document.addEventListener('DOMContentLoaded', () => {
    const superSearchBtn = document.getElementById('superSearchBtn');
    const superSearchInput = document.getElementById('superSearchInput');
    const chartContainer = document.getElementById('superSearchChart');

    // Controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const fitViewBtn = document.getElementById('fitViewBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const viewTreeBtn = document.getElementById('viewTreeBtn');
    const viewConstellationBtn = document.getElementById('viewConstellationBtn');
    const metricsEl = document.getElementById('superSearchMetrics');
    const topTagsEl = document.getElementById('superSearchTopTags');
    const assistExpandBtn = document.getElementById('assistExpandBtn');
    const assistLessonBtn = document.getElementById('assistLessonBtn');
    const assistQuizBtn = document.getElementById('assistQuizBtn');
    const assistResultEl = document.getElementById('assistResult');

    let activeNodeData = null;
    let activeQuery = '';
    let renderMode = localStorage.getItem('superSearchRenderMode') || 'tree';
    let rerenderCurrentGraph = null;

    if (superSearchBtn) {
        superSearchBtn.addEventListener('click', performSuperSearch);
    }
    
    if (superSearchInput) {
        superSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSuperSearch();
        });
    }

    // Fullscreen Toggle
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                chartContainer.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    function setAssistLoading(loading, label = 'AI 正在生成...') {
        if (!assistExpandBtn || !assistLessonBtn || !assistQuizBtn) return;
        assistExpandBtn.disabled = loading;
        assistLessonBtn.disabled = loading;
        assistQuizBtn.disabled = loading;
        if (assistResultEl && loading) assistResultEl.textContent = label;
    }

    async function runNodeAssist(action) {
        if (!activeNodeData || !activeQuery) {
            if (assistResultEl) assistResultEl.textContent = '请先点击一个知识节点，再使用 AI 交互增强。';
            return;
        }
        setAssistLoading(true);
        try {
            const response = await fetch('/api/super-search/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    query: activeQuery,
                    node: activeNodeData
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'AI 生成失败');
            if (assistResultEl) assistResultEl.textContent = data.result || 'AI 未返回内容';
        } catch (error) {
            if (assistResultEl) assistResultEl.textContent = `生成失败：${error.message}`;
        } finally {
            setAssistLoading(false);
        }
    }

    if (assistExpandBtn) assistExpandBtn.onclick = () => runNodeAssist('expand');
    if (assistLessonBtn) assistLessonBtn.onclick = () => runNodeAssist('lesson_plan');
    if (assistQuizBtn) assistQuizBtn.onclick = () => runNodeAssist('quiz');

    function syncRenderModeUI() {
        if (viewTreeBtn) viewTreeBtn.classList.toggle('active', renderMode === 'tree');
        if (viewConstellationBtn) viewConstellationBtn.classList.toggle('active', renderMode === 'constellation');
    }
    function setRenderMode(mode) {
        renderMode = mode;
        localStorage.setItem('superSearchRenderMode', renderMode);
        syncRenderModeUI();
        if (typeof rerenderCurrentGraph === 'function') rerenderCurrentGraph();
    }
    if (viewTreeBtn) viewTreeBtn.onclick = () => setRenderMode('tree');
    if (viewConstellationBtn) viewConstellationBtn.onclick = () => setRenderMode('constellation');
    syncRenderModeUI();

    function escapeHtml(str = '') {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }

    function updateIntelBar(root) {
        if (!root || !metricsEl || !topTagsEl) return;
        const nodes = root.descendants().filter(d => d.depth > 0);
        const leaves = nodes.filter(d => !d.children || d.children.length === 0);
        const maxDepth = nodes.reduce((m, d) => Math.max(m, d.depth), 0);
        const links = Math.max(0, nodes.length - 1);
        metricsEl.innerHTML = `
            <span class="intel-chip"><i class="fa-solid fa-diagram-project"></i> 节点 ${nodes.length}</span>
            <span class="intel-chip"><i class="fa-solid fa-layer-group"></i> 层级 ${maxDepth}</span>
            <span class="intel-chip"><i class="fa-solid fa-sitemap"></i> 叶子 ${leaves.length}</span>
            <span class="intel-chip"><i class="fa-solid fa-bolt"></i> 连接 ${links}</span>
        `;
        const topGroups = root.children || [];
        topTagsEl.innerHTML = topGroups
            .slice(0, 6)
            .map(g => `<span class="intel-chip"><i class="fa-solid fa-hashtag"></i> ${escapeHtml(g.data.name || '')}</span>`)
            .join('');
    }

    function trimText(raw = '', max = 26) {
        const s = String(raw || '').replace(/\s+/g, ' ').trim();
        return s.length > max ? `${s.slice(0, max)}…` : s;
    }

    function buildVisualTree(tree) {
        const cloned = JSON.parse(JSON.stringify(tree || {}));
        let seq = 0;
        const normalize = (node, depth = 0) => {
            if (!node || typeof node !== 'object') return null;
            node.id = String(node.id || `auto_${depth}_${++seq}`);
            node.name = trimText(node.name || '未命名节点', depth <= 1 ? 22 : 26);
            node.description = trimText(node.description || '', 56);
            const children = Array.isArray(node.children) ? node.children.map(c => normalize(c, depth + 1)).filter(Boolean) : [];
            node.children = children;
            return node;
        };
        return normalize(cloned, 0);
    }

    async function performSuperSearch() {
        const query = superSearchInput.value.trim();
        if (!query) return;
        activeQuery = query;
        activeNodeData = null;
        if (assistResultEl) assistResultEl.textContent = '';
        if (topTagsEl) topTagsEl.innerHTML = '';
        if (metricsEl) {
            metricsEl.innerHTML = `
                <span class="intel-chip"><i class="fa-solid fa-diagram-project"></i> 节点 0</span>
                <span class="intel-chip"><i class="fa-solid fa-layer-group"></i> 层级 0</span>
                <span class="intel-chip"><i class="fa-solid fa-sitemap"></i> 叶子 0</span>
                <span class="intel-chip"><i class="fa-solid fa-bolt"></i> 连接 0</span>
            `;
        }

        // Reset UI
        chartContainer.innerHTML = '';
        chartContainer.classList.add('rainbow-loading-active');
        
        // Create Status Log Element (Overlay) - Replaced with minimal pill
        let statusLog = document.getElementById('searchStatusPill');
        if (statusLog) statusLog.remove();
        
        statusLog = document.createElement('div');
        statusLog.id = 'searchStatusPill';
        statusLog.className = 'status-pill';
        statusLog.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>正在初始化超级搜索...</span>`;
        chartContainer.appendChild(statusLog);

        // Data State
        let nodeMap = new Map();
        let pendingNodes = [];
        let rootData = null;
        let svg = null, g = null, zoom = null;
        let isGraphInitialized = false;
        let renderQueued = false;
        let latestTree = null;
        let hasUserZoomed = false;
        let lastAutoFitNodeCount = 0;
        rerenderCurrentGraph = () => {
            hasUserZoomed = false;
            lastAutoFitNodeCount = 0;
            if (latestTree) queueRender();
        };

        try {
            const response = await fetch('/api/super-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); 

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') {
                            statusLog.className = 'status-pill success';
                            statusLog.innerHTML = `<i class="fa-solid fa-check"></i> <span>生成完成</span>`;
                            chartContainer.classList.remove('rainbow-loading-active');
                            setTimeout(() => statusLog.remove(), 3000);
                            continue;
                        }
                        
                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (data.type === 'status') {
                                statusLog.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${data.msg}</span>`;
                            } 
                            else if (data.type === 'node') {
                                const node = data.data;
                                // Ensure IDs are strings to avoid mismatch
                                node.id = String(node.id);
                                if (node.parent) node.parent = String(node.parent);
                                
                                // Sanitize: incoming node should not overwrite children
                                if (node.children) delete node.children;

                                // Prevent duplicate processing if node already exists and is linked
                                if (nodeMap.has(node.id)) {
                                    // Update existing node data if needed, but preserve structure
                                    const existing = nodeMap.get(node.id);
                                    // Protect children from being overwritten by Object.assign
                                    const children = existing.children;
                                    Object.assign(existing, node);
                                    if (children) existing.children = children;
                                    
                                    // Trigger render
                                    if (rootData) {
                                        latestTree = rootData;
                                        queueRender();
                                    }
                                    continue;
                                }

                                // DO NOT initialize node.children = [] here
                                nodeMap.set(node.id, node);

                                if (node.id === 'root' || !node.parent) {
                                    rootData = node;
                                } else {
                                    const parent = nodeMap.get(node.parent);
                                    if (parent) {
                                        if (!parent.children) parent.children = [];
                                        if (!parent.children.find(c => c.id === node.id)) {
                                            parent.children.push(node);
                                        }
                                    } else {
                                        pendingNodes.push(node);
                                    }
                                }

                                // Check pending
                                for (let i = pendingNodes.length - 1; i >= 0; i--) {
                                    const pNode = pendingNodes[i];
                                    if (pNode.parent === node.id) { // Match parent ID
                                        if (!node.children) node.children = [];
                                        if (!node.children.find(c => c.id === pNode.id)) {
                                            node.children.push(pNode);
                                        }
                                        pendingNodes.splice(i, 1);
                                    }
                                }

                                if (rootData) {
                                    if (!isGraphInitialized) {
                                        isGraphInitialized = true;
                                    }
                                    latestTree = rootData;
                                    queueRender();
                                }
                            }
                            else if (data.type === 'error') {
                                statusLog.className = 'status-pill error';
                                statusLog.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>${data.msg}</span>`;
                                chartContainer.classList.remove('rainbow-loading-active');
                            }
                        } catch (e) {
                            console.error('Error parsing SSE:', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error:', error);
            chartContainer.classList.remove('rainbow-loading-active');
            let statusLog = document.getElementById('searchStatusPill');
            if (statusLog) {
                statusLog.className = 'status-pill error';
                statusLog.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>生成失败: ${error.message}</span>`;
            }
        }

        function queueRender() {
            if (renderQueued || !latestTree) return;
            renderQueued = true;
            requestAnimationFrame(() => {
                renderQueued = false;
                if (latestTree) renderKnowledgeGraph(latestTree);
            });
        }

        function renderKnowledgeGraph(data) {
            if (!window.d3) {
                throw new Error('D3 加载失败，请刷新后重试');
            }
            const containerWidth = chartContainer.clientWidth;
            const containerHeight = Math.max(chartContainer.clientHeight || 0, 760);
            const colors = [
                "#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#ec4899"
            ];
            const colorScale = d3.scaleOrdinal(colors);
            const visualData = buildVisualTree(data);
            const root = d3.hierarchy(visualData);
            updateIntelBar(root);

            let linkPathFactory = null;
            if (renderMode === 'constellation') {
                const radius = Math.max(180, Math.min(containerWidth, containerHeight) * 0.43);
                d3.cluster()
                    .size([Math.PI * 2, radius])
                    .separation((a, b) => a.parent === b.parent ? 1 : 1.12)(root);
                const cx = containerWidth / 2;
                const cy = containerHeight / 2;
                root.each(d => {
                    const a = d.x - Math.PI / 2;
                    const r = 20 + d.y;
                    d.plotX = cx + Math.cos(a) * r;
                    d.plotY = cy + Math.sin(a) * r;
                    d.angle = a;
                    d.dir = Math.cos(a) >= 0 ? 1 : -1;
                });
                linkPathFactory = (d) => {
                    const sx = d.source.plotX;
                    const sy = d.source.plotY;
                    const tx = d.target.plotX;
                    const ty = d.target.plotY;
                    const mx = (sx + tx) / 2;
                    const my = (sy + ty) / 2;
                    return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
                };
            } else {
                d3.tree()
                    .nodeSize([86, 280])
                    .separation((a, b) => a.parent === b.parent ? 1 : 1.25)(root);
                let minX = Infinity;
                root.each(d => {
                    minX = Math.min(minX, d.x);
                });
                const padTop = 80;
                const padLeft = 140;
                root.each(d => {
                    d.plotX = d.y + padLeft;
                    d.plotY = d.x - minX + padTop;
                    d.dir = 1;
                });
                linkPathFactory = (d) => {
                    const sx = d.source.plotX;
                    const sy = d.source.plotY;
                    const tx = d.target.plotX;
                    const ty = d.target.plotY;
                    const mx = (sx + tx) / 2;
                    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
                };
            }

            const fitToGraph = () => {
                if (!svg || !g) return;
                const box = g.node().getBBox();
                const availableW = Math.max(10, containerWidth - 60);
                const availableH = Math.max(10, containerHeight - 60);
                const scale = Math.max(0.35, Math.min(1.9, Math.min(availableW / Math.max(1, box.width), availableH / Math.max(1, box.height))));
                const tx = (containerWidth - box.width * scale) / 2 - box.x * scale;
                const ty = (containerHeight - box.height * scale) / 2 - box.y * scale;
                svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
            };

            if (!svg) {
                svg = d3.select(chartContainer).append("svg")
                    .attr("width", containerWidth)
                    .attr("height", containerHeight)
                    .style("background", "transparent")
                    .style("display", "block");
                g = svg.append("g");
                zoom = d3.zoom()
                    .scaleExtent([0.35, 4])
                    .on("zoom", (event) => {
                        if (event.sourceEvent) hasUserZoomed = true;
                        g.attr("transform", event.transform);
                        if (zoomSlider) zoomSlider.value = Math.min(3, Math.max(0.1, event.transform.k));
                    });
                svg.call(zoom);
                if (zoomInBtn) zoomInBtn.onclick = () => {
                    hasUserZoomed = true;
                    svg.transition().duration(250).call(zoom.scaleBy, 1.2);
                };
                if (zoomOutBtn) zoomOutBtn.onclick = () => {
                    hasUserZoomed = true;
                    svg.transition().duration(250).call(zoom.scaleBy, 0.8);
                };
                if (fitViewBtn) fitViewBtn.onclick = () => {
                    hasUserZoomed = false;
                    fitToGraph();
                };
                if (zoomSlider) zoomSlider.oninput = (e) => {
                    hasUserZoomed = true;
                    const k = Number(e.target.value || 1);
                    svg.call(zoom.scaleTo, k);
                };
            } else {
                svg.attr("width", containerWidth).attr("height", containerHeight);
            }

            const links = root.links();
            const linkSel = g.selectAll("path.mind-link")
                .data(links, d => `${d.source.data.id}->${d.target.data.id}`);
            linkSel.exit().remove();
            linkSel.enter().append("path").attr("class", "mind-link")
                .merge(linkSel)
                .attr("fill", "none")
                .attr("stroke", "rgba(99,102,241,0.32)")
                .attr("stroke-width", d => d.target.depth <= 1 ? 2.2 : 1.5)
                .attr("d", d => linkPathFactory(d));

            const drawNodes = root.descendants();
            const nodes = g.selectAll("g.mind-node")
                .data(drawNodes, d => d.data.id);

            nodes.exit().remove();

            const enter = nodes.enter()
                .append("g")
                .attr("class", "mind-node")
                .attr("transform", d => `translate(${d.plotX},${d.plotY})`);

            enter.append("circle").attr("class", "mind-dot");
            enter.append("rect").attr("class", "mind-card");
            enter.append("text").attr("class", "mind-title");
            enter.append("text").attr("class", "mind-subtitle");

            const merged = enter.merge(nodes)
                .attr("transform", d => `translate(${d.plotX},${d.plotY})`);

            const cardW = d => {
                const hint = [d.data.type, d.data.difficulty, d.data.bloom].filter(Boolean).join(' · ');
                const raw = (d.data.name || '') + hint;
                return Math.max(130, Math.min(360, raw.length * 9 + 26));
            };
            const cardH = d => {
                const hint = [d.data.type, d.data.difficulty, d.data.bloom].filter(Boolean).join(' · ');
                return hint ? 46 : 34;
            };
            const cardX = d => {
                const w = cardW(d);
                if (d.depth === 0 && renderMode === 'constellation') return -w / 2;
                return (d.dir || 1) >= 0 ? 14 : -(w + 14);
            };
            const titleX = d => cardX(d) + 10;
            const subtitleX = d => cardX(d) + 10;

            merged.select("circle.mind-dot")
                .attr("r", d => d.depth === 0 ? 8 : 5.5)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("fill", d => {
                    let top = d;
                    while (top.depth > 1) top = top.parent;
                    const base = d3.color(colorScale(top.data.name));
                    if (!base) return "rgba(99,102,241,0.5)";
                    return d.depth === 0 ? base.darker(0.6) : base;
                })
                .attr("stroke", "rgba(255,255,255,0.8)")
                .attr("stroke-width", 1.2);

            merged.select("rect.mind-card")
                .attr("x", d => cardX(d))
                .attr("y", -24)
                .attr("width", d => cardW(d))
                .attr("height", d => cardH(d))
                .attr("rx", 9)
                .attr("ry", 9)
                .attr("fill", d => d.depth === 0 ? "rgba(79,70,229,0.14)" : "rgba(255,255,255,0.88)")
                .attr("stroke", d => d.depth <= 1 ? "rgba(79,70,229,0.42)" : "rgba(148,163,184,0.32)")
                .attr("stroke-width", d => d.depth <= 1 ? 1.4 : 1);

            merged.select("text.mind-title")
                .attr("x", d => titleX(d))
                .attr("y", -7)
                .text(d => d.data.name || "")
                .attr("fill", "#1e293b")
                .style("font-weight", d => d.depth <= 1 ? "800" : "700")
                .style("font-size", d => d.depth <= 1 ? "13px" : "12px")
                .style("pointer-events", "none");

            merged.select("text.mind-subtitle")
                .attr("x", d => subtitleX(d))
                .attr("y", 12)
                .text(d => {
                    const hints = [d.data.type, d.data.difficulty, d.data.bloom].filter(Boolean).join(' · ');
                    if (hints) return trimText(hints, 34);
                    return trimText(d.data.description || "", 34);
                })
                .attr("fill", "rgba(51,65,85,0.75)")
                .style("font-size", "10.8px")
                .style("opacity", d => d.depth <= 2 ? 1 : 0.9)
                .style("pointer-events", "none");

            merged.on("click", (e, d) => {
                if (d.children && d.children.length && d.depth <= 1) {
                    const scale = renderMode === 'constellation' ? 1.18 : 1.25;
                    const x = (renderMode === 'constellation' ? containerWidth * 0.5 : containerWidth * 0.24) - d.plotX * scale;
                    const y = containerHeight * 0.5 - d.plotY * scale;
                    svg.transition().duration(450).call(
                        zoom.transform,
                        d3.zoomIdentity.translate(x, y).scale(scale)
                    );
                } else {
                    handleNodeClick(e, d);
                }
            }).on("mouseover", function(e, d) {
                d3.select(this).select("rect.mind-card")
                    .attr("stroke-width", 1.8)
                    .attr("fill", d.depth === 0 ? "rgba(79,70,229,0.22)" : "rgba(255,255,255,0.96)");
            }).on("mouseout", function(e, d) {
                d3.select(this).select("rect.mind-card")
                    .attr("stroke-width", d.depth <= 1 ? 1.4 : 1)
                    .attr("fill", d.depth === 0 ? "rgba(79,70,229,0.14)" : "rgba(255,255,255,0.88)");
            });

            if (!hasUserZoomed && drawNodes.length > 0 && drawNodes.length !== lastAutoFitNodeCount) {
                lastAutoFitNodeCount = drawNodes.length;
                fitToGraph();
            }
        }

        function handleNodeClick(e, d) {
            e.stopPropagation();
            const panel = document.getElementById('superSearchPanel');
            const panelTitle = document.getElementById('panelTitle');
            const panelDesc = document.getElementById('panelDesc');
            const panelDetail = document.getElementById('panelDetail');
            const panelLinks = document.getElementById('panelLinks');
            const closeBtn = document.getElementById('closePanelBtn');

            if (panel && (d.data.detail || d.data.description)) {
                activeNodeData = d.data;
                panelTitle.textContent = d.data.name;
                panelDesc.textContent = d.data.description || "暂无摘要";
                const insightChips = [d.data.type, d.data.difficulty, d.data.bloom]
                    .filter(Boolean)
                    .map(t => `<span class="chip" style="font-size:0.78rem; padding:4px 8px;">${escapeHtml(t)}</span>`)
                    .join('');
                panelDetail.innerHTML = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">${insightChips}</div>
                    <div><strong>核心解析：</strong>${escapeHtml(d.data.detail || "暂无详细解析。")}</div>
                    <div style="margin-top:10px;"><strong>常见误区：</strong>${escapeHtml(d.data.misconception || "可引导学生区分概念边界与反例。")}</div>
                    <div style="margin-top:10px;"><strong>教学活动：</strong>${escapeHtml(d.data.activity || "采用“示例-练习-反馈”三段式活动。")}</div>
                    <div style="margin-top:10px;"><strong>评估建议：</strong>${escapeHtml(d.data.assessment || "设置形成性测验并结合口头追问。")}</div>
                    <div style="margin-top:10px;"><strong>AI 提示词：</strong>${escapeHtml(d.data.prompt || `围绕“${d.data.name || ''}”生成分层讲解与练习。`)}</div>
                `;
                if (assistResultEl) assistResultEl.textContent = '';

                if (d.data.url) {
                    panelLinks.innerHTML = `<a href="${d.data.url}" target="_blank" class="link-item"><i class="fa-solid fa-arrow-up-right-from-square"></i> 查看原始来源</a>`;
                } else {
                    panelLinks.innerHTML = "<p style='color:#999; font-size:0.9rem;'>暂无相关链接</p>";
                }

                panel.classList.add('active');
                closeBtn.onclick = () => panel.classList.remove('active');
            }

            // Force Directed Zoom Handling
            const width = chartContainer.clientWidth;
            const height = chartContainer.clientHeight || 800;
            const hasTreePoint = typeof d.plotX === 'number' && typeof d.plotY === 'number';
            const nodeWidth = hasTreePoint ? 220 : Math.max(40, (d.x1 || 0) - (d.x0 || 0));
            const nodeHeight = hasTreePoint ? 80 : Math.max(40, (d.y1 || 0) - (d.y0 || 0));
            const scale = hasTreePoint
                ? 1.3
                : Math.min(8, Math.max(1.2, Math.min(width / nodeWidth, height / nodeHeight) * 0.68));
            const cx = hasTreePoint ? d.plotX : (((d.x0 || 0) + (d.x1 || 0)) / 2);
            const cy = hasTreePoint ? d.plotY : (((d.y0 || 0) + (d.y1 || 0)) / 2);
            const targetAnchor = hasTreePoint ? (renderMode === 'constellation' ? 0.5 : 0.3) : 0.5;
            const x = -cx * scale + width * targetAnchor;
            const y = -cy * scale + height / 2;
            
            svg.transition().duration(750).call(
                zoom.transform, 
                d3.zoomIdentity.translate(x, y).scale(scale)
            );
        }

        // Removed handleMouseMove and handleMouseLeave as they were for the 3D tilt effect on Rects
    }
});
