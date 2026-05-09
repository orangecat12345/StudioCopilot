document.addEventListener('DOMContentLoaded', () => {
    console.log("MindMapNode workspace initialized.");
    
    // UI Elements
    const fileUploadInput = document.getElementById('fileUploadInput');
    const webSearchInput = document.getElementById('webSearchInput');
    const webSearchBtn = document.getElementById('webSearchBtn');
    const sourcesList = document.getElementById('sourcesList');
    const sourceEmptyState = document.getElementById('sourceEmptyState');
    const chatSourceCount = document.getElementById('chatSourceCount');
    
    const chatContent = document.getElementById('chatContent');
    const previewMarkdown = document.getElementById('previewMarkdown');
    const previewIframe = document.getElementById('previewIframe');
    const pdfPreviewTitle = document.getElementById('pdfPreviewTitle');
    const middlePanelTitle = document.getElementById('middlePanelTitle');

    // Ensure marked is available
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    let sourceCount = 0;
    const sourcesData = window.sourcesData = {}; // Store parsed content by source ID

    const chatEmptyState = document.getElementById('chatEmptyState');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Show loading state
            addSourceToList(`正在解析: ${file.name}...`, 'loading');
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/mindmapnode/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (response.ok) {
                    removeLoadingSource();
                    const sourceId = data.source_id;
                    addSourceToList(sourceId, file.name, '文件解析完成');
                    if (data.content) {
                        sourcesData[sourceId] = { 
                            title: file.name, 
                            content: data.content,
                            fileUrl: data.file_url,
                            type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text'
                        };
                    }
                } else {
                    removeLoadingSource();
                    alert('解析失败: ' + data.error);
                }
            } catch (err) {
                removeLoadingSource();
                alert('请求失败: ' + err.message);
            }
            
            // Reset input
            fileUploadInput.value = '';
        });
    }
    
    // --- Left Panel: Web Search ---
    async function handleWebSearch() {
        const query = webSearchInput.value.trim();
        if (!query) return;
        
        webSearchInput.value = '';
        addSourceToList('loading-source', `正在搜索: ${query}...`, 'loading');
        
        try {
            const response = await fetch('/api/mindmapnode/web_search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            
            const data = await response.json();
            if (response.ok && data.data && data.data.search_result) {
                removeLoadingSource();
                const sourceId = "web_" + Date.now();
                let combinedContent = "";
                data.data.search_result.slice(0, 3).forEach(res => {
                    combinedContent += `### ${res.title}\n${res.content}\n[来源链接](${res.link})\n\n`;
                });
                
                addSourceToList(sourceId, `网页搜索: ${query}`, '网络检索结果');
                sourcesData[sourceId] = { title: `网页搜索: ${query}`, content: combinedContent, type: 'text' };
                
                // 将网络搜索结果也同步到后端的 GLM5 Agent 上下文中
                fetch('/api/mindmapnode/sync_web_search_to_agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        source_id: sourceId,
                        title: `网页搜索: ${query}`,
                        content: combinedContent
                    })
                }).catch(err => console.error("同步搜索结果到后端失败", err));
                
            } else {
                removeLoadingSource();
                alert('搜索失败: ' + (data.error || '未知错误'));
            }
        } catch (err) {
            removeLoadingSource();
            alert('请求失败: ' + err.message);
        }
    }
    
    if (webSearchBtn) {
        webSearchBtn.addEventListener('click', handleWebSearch);
    }
    if (webSearchInput) {
        webSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleWebSearch();
        });
    }

    // --- Stage Stack Management ---
    window.switchStage = function(stageId) {
        // Handle exiting split view if clicking a different tab
        if (window.isSplitView && stageId !== 'mindmapStage' && stageId !== 'pdfPreviewStage') {
            window.isSplitView = false;
            const splitBtn = document.getElementById('splitViewBtn');
            if (splitBtn) splitBtn.innerHTML = '<i class="fa-solid fa-columns"></i> 开启并排PDF';
        }

        if (window.isSplitView && (stageId === 'mindmapStage' || stageId === 'pdfPreviewStage')) {
            document.querySelectorAll('.stage-container').forEach(el => {
                if (el.id !== 'mindmapStage' && el.id !== 'pdfPreviewStage') {
                    el.style.display = 'none';
                }
            });
            
            const mindmapStage = document.getElementById('mindmapStage');
            if (mindmapStage) mindmapStage.style.display = 'flex';
            
            const pdfStage = document.getElementById('pdfPreviewStage');
            if (pdfStage) pdfStage.style.display = 'flex';
            
            document.querySelectorAll('.stage-tab').forEach(el => el.classList.remove('active'));
            const mindmapTab = document.querySelector(`.stage-tab[data-target="mindmapStage"]`);
            if (mindmapTab) mindmapTab.classList.add('active');
            const pdfTab = document.querySelector(`.stage-tab[data-target="pdfPreviewStage"]`);
            if (pdfTab) pdfTab.classList.add('active');
            
            setTimeout(() => {
                if (myChart) myChart.resize();
            }, 100);
            return;
        }

        document.querySelectorAll('.stage-container').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.stage-tab').forEach(el => el.classList.remove('active'));
        
        const stage = document.getElementById(stageId);
        if (stage) {
            stage.style.display = 'flex';
        }
        
        const tab = document.querySelector(`.stage-tab[data-target="${stageId}"]`);
        if (tab) {
            tab.classList.add('active');
        }
        
        setTimeout(() => {
            if (myChart) myChart.resize();
        }, 100);
    };

    window.closeStage = function(event, stageId) {
        event.stopPropagation(); // Prevent tab click
        
        // Find and remove the tab
        const tab = document.querySelector(`.stage-tab[data-target="${stageId}"]`);
        if (tab) tab.remove();
        
        // Hide the stage
        const stage = document.getElementById(stageId);
        if (stage) stage.style.display = 'none';
        
        // If it was the PDF preview, clear the iframe to stop audio/video if any
        if (stageId === 'pdfPreviewStage' && previewIframe) {
            previewIframe.src = '';
        }

        // If we are in split view and we close one of the split stages, exit split view
        if (window.isSplitView && (stageId === 'mindmapStage' || stageId === 'pdfPreviewStage')) {
            window.isSplitView = false;
            const splitBtn = document.getElementById('splitViewBtn');
            if (splitBtn) splitBtn.innerHTML = '<i class="fa-solid fa-columns"></i> 开启并排PDF';
            
            // Switch to the other stage that is still open, or chatStage
            const otherStage = stageId === 'mindmapStage' ? 'pdfPreviewStage' : 'mindmapStage';
            const otherTab = document.querySelector(`.stage-tab[data-target="${otherStage}"]`);
            if (otherTab) {
                switchStage(otherStage);
            } else {
                switchStage('chatStage');
            }
            return;
        }
        
        // Fallback to chat stage
        switchStage('chatStage');
    };
    
    // Add event listener to default tab
    document.querySelector('.stage-tab[data-target="chatStage"]').addEventListener('click', () => switchStage('chatStage'));
    
    window.openStudioTool = function(tool) {
        if (tool === 'mindmap') {
            // Check if tab exists, if not create it
            let tab = document.querySelector('.stage-tab[data-target="mindmapStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'mindmapStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-network-wired"></i> 思维导图
                    <div class="stage-tab-close" onclick="closeStage(event, 'mindmapStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('mindmapStage');
                stageTabs.appendChild(tab);
            }
            switchStage('mindmapStage');
            
            // Auto generate if empty
            if (!window.mindmapData) {
                generateMindmap();
            }
        } else if (tool === 'textbook') {
            let tab = document.querySelector('.stage-tab[data-target="textbookStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'textbookStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-book-open-reader"></i> AI 课本
                    <div class="stage-tab-close" onclick="closeStage(event, 'textbookStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('textbookStage');
                stageTabs.appendChild(tab);
            }
            switchStage('textbookStage');
        } else if (tool === 'classroom') {
            let tab = document.querySelector('.stage-tab[data-target="classroomStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'classroomStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-person-chalkboard"></i> 模拟课堂
                    <div class="stage-tab-close" onclick="closeStage(event, 'classroomStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('classroomStage');
                stageTabs.appendChild(tab);
            }
            switchStage('classroomStage');
        } else if (tool === 'report') {
            let tab = document.querySelector('.stage-tab[data-target="reportStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'reportStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-file-contract"></i> 研究报告
                    <div class="stage-tab-close" onclick="closeStage(event, 'reportStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('reportStage');
                stageTabs.appendChild(tab);
            }
            switchStage('reportStage');
            
            if (!document.getElementById('reportHtmlContainer').innerHTML.trim()) {
                generateReport(true);
            }
        } else if (tool === 'flashcard') {
            let tab = document.querySelector('.stage-tab[data-target="flashcardStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'flashcardStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-clone"></i> 记忆闪卡
                    <div class="stage-tab-close" onclick="closeStage(event, 'flashcardStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('flashcardStage');
                stageTabs.appendChild(tab);
            }
            switchStage('flashcardStage');
        } else if (tool === 'quiz') {
            let tab = document.querySelector('.stage-tab[data-target="quizStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'quizStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-clipboard-question"></i> 随堂测验
                    <div class="stage-tab-close" onclick="closeStage(event, 'quizStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('quizStage');
                stageTabs.appendChild(tab);
            }
            switchStage('quizStage');
        } else if (tool === 'discussion') {
            let tab = document.querySelector('.stage-tab[data-target="discussionStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'discussionStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-users"></i> 小组讨论
                    <div class="stage-tab-close" onclick="closeStage(event, 'discussionStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('discussionStage');
                stageTabs.appendChild(tab);
            }
            switchStage('discussionStage');
        } else if (tool === 'infinityCity') {
            let tab = document.querySelector('.stage-tab[data-target="infinityCityStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'infinityCityStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-city"></i> 无限城
                    <div class="stage-tab-close" onclick="closeStage(event, 'infinityCityStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('infinityCityStage');
                stageTabs.appendChild(tab);
            }
            switchStage('infinityCityStage');
        } else {
            alert('功能开发中...');
        }
    };
    function addSourceToList(id, title, desc) {
        if (sourceEmptyState) sourceEmptyState.style.display = 'none';
        if (sourcesList) sourcesList.style.display = 'block';
        
        const isLoader = desc === 'loading';
        const isWebSearch = id.startsWith('web_');
        const fileIcon = isWebSearch ? 'fa-globe' : 'fa-file-lines';
        const iconColor = isWebSearch ? 'color: var(--primary);' : '';
        
        const itemHtml = `
            <div class="source-item" id="${id}" onclick="previewSource('${id}')">
                <div class="source-title" style="display:flex; justify-content:space-between; width:100%;">
                    <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden;">
                        <i class="fa-solid ${isLoader ? 'fa-spinner fa-spin' : fileIcon}" style="${iconColor}"></i>
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
                    </div>
                    ${!isLoader ? `<button class="delete-source-btn" onclick="deleteSource(event, '${id}')" title="删除来源"><i class="fa-solid fa-trash-can hover-danger"></i></button>` : ''}
                </div>
                ${!isLoader ? `<div class="source-desc">${desc}</div>` : ''}
            </div>
        `;
        
        sourcesList.insertAdjacentHTML('afterbegin', itemHtml);
        
        if (!isLoader) {
            sourceCount++;
            updateSourceCount();
        }
        
        return id;
    }
    
    function updateSourceCount() {
        if (chatSourceCount) chatSourceCount.textContent = `${sourceCount} 个来源`;
    }

    window.deleteSource = async function(event, id) {
        event.stopPropagation(); // Prevent triggering preview
        
        try {
            // For web search sources, there is no physical file on the backend, just remove from UI and Cache
            if (id.startsWith('web_')) {
                const item = document.getElementById(id);
                if (item) item.remove();
                delete sourcesData[id];
                sourceCount--;
                updateSourceCount();
                if (sourceCount === 0) {
                    if (sourceEmptyState) sourceEmptyState.style.display = 'flex';
                    if (sourcesList) sourcesList.style.display = 'none';
                }
                const pdfTab = document.querySelector('.stage-tab[data-target="pdfPreviewStage"]');
                if (pdfTab && pdfTab.classList.contains('active') && pdfPreviewTitle && pdfPreviewTitle.textContent.includes(id)) {
                    switchStage('chatStage');
                }
                return;
            }

            // For uploaded files, call backend API to delete the source content
            const response = await fetch('/api/mindmapnode/delete_source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_id: id })
            });
            
            if (response.ok) {
                // Remove from UI
                const item = document.getElementById(id);
                if (item) item.remove();
                
                // Remove from local data
                delete sourcesData[id];
                
                sourceCount--;
                updateSourceCount();
                
                if (sourceCount === 0) {
                    if (sourceEmptyState) sourceEmptyState.style.display = 'flex';
                    if (sourcesList) sourcesList.style.display = 'none';
                }
                
                // If it was being previewed, close preview
                const pdfTab = document.querySelector('.stage-tab[data-target="pdfPreviewStage"]');
                if (pdfTab && pdfTab.classList.contains('active') && pdfPreviewTitle && pdfPreviewTitle.textContent.includes(id)) {
                    switchStage('chatStage');
                }
            } else {
                alert('删除失败');
            }
        } catch (err) {
            alert('请求失败: ' + err.message);
        }
    };
    
    // Preview logic
    window.previewSource = function(id, searchKeyword = null) {
        if (id === 'loading-source') return;
        
        // Remove active class from all
        document.querySelectorAll('.source-item').forEach(el => el.classList.remove('active'));
        // Add active class to clicked
        const item = document.getElementById(id);
        if (item) item.classList.add('active');
        
        const source = sourcesData[id];
        if (source) {
            // Check and create PDF Preview Tab
            let tab = document.querySelector('.stage-tab[data-target="pdfPreviewStage"]');
            if (!tab) {
                const stageTabs = document.getElementById('stageTabs');
                tab = document.createElement('div');
                tab.className = 'stage-tab';
                tab.setAttribute('data-target', 'pdfPreviewStage');
                tab.innerHTML = `
                    <i class="fa-solid fa-file-lines"></i> <span class="tab-label">来源内容</span>
                    <div class="stage-tab-close" onclick="closeStage(event, 'pdfPreviewStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                `;
                tab.onclick = () => switchStage('pdfPreviewStage');
                stageTabs.appendChild(tab);
            }
            
            // Update Tab and Header title
            const tabLabel = tab.querySelector('.tab-label');
            if (tabLabel) tabLabel.textContent = source.title;
            if (pdfPreviewTitle) {
                pdfPreviewTitle.textContent = source.title;
                const icon = pdfPreviewTitle.previousElementSibling;
                if (icon) {
                    if (source.type === 'pdf') {
                        icon.className = 'fa-solid fa-file-pdf';
                        icon.style.color = '#ef4444';
                    } else if (id.startsWith('web_')) {
                        icon.className = 'fa-solid fa-globe';
                        icon.style.color = 'var(--primary)';
                    } else {
                        icon.className = 'fa-solid fa-file-lines';
                        icon.style.color = 'var(--text-muted)';
                    }
                }
            }
            
            // Switch to PDF Preview Stage
            switchStage('pdfPreviewStage');
            
            if (source.type === 'pdf' && source.fileUrl && previewIframe) {
                // Show PDF in iframe
                if (previewMarkdown) previewMarkdown.style.display = 'none';
                previewIframe.style.display = 'block';
                
                let finalUrl = source.fileUrl + '#view=FitH';
                if (searchKeyword) {
                    let safeSearch = searchKeyword.replace(/[\r\n\s]+/g, ' ').trim();
                    if (safeSearch.length > 20) {
                        safeSearch = safeSearch.substring(0, 20);
                    }
                    safeSearch = safeSearch.replace(/["']/g, '');
                    finalUrl += `&search=${encodeURIComponent(safeSearch)}`;
                }
                
                // Always set src to blank first to force the PDF viewer to jump to the new search highlight
                if (searchKeyword) {
                    previewIframe.src = 'about:blank';
                    setTimeout(() => {
                        previewIframe.src = finalUrl;
                    }, 50);
                } else {
                    previewIframe.src = finalUrl;
                }
                
            } else if (previewMarkdown) {
                // Render text content
                if (previewIframe) previewIframe.style.display = 'none';
                previewMarkdown.style.display = 'block';
                if (typeof marked !== 'undefined') {
                    previewMarkdown.innerHTML = marked.parse(source.content || '*暂无详细内容*');
                } else {
                    previewMarkdown.textContent = source.content || '暂无详细内容';
                }
                
                // Highlight text logic could be added here for non-pdf content if needed
                if (searchKeyword) {
                     // Simple text highlighting for markdown preview
                     setTimeout(() => {
                         const regex = new RegExp(`(${searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                         previewMarkdown.innerHTML = previewMarkdown.innerHTML.replace(regex, '<mark style="background-color: #fef08a; padding: 0.2em; border-radius: 2px;">$1</mark>');
                     }, 100);
                }
            }
        }
    };

    function removeLoadingSource() {
        const loader = document.getElementById('loading-source');
        if (loader) loader.remove();
    }

    // --- AI Textbook Generation & Rendering (BOPPPS) ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function getTextbookIconClass(type) {
        let iconClass = 'fa-file-lines';
        if(type === 'hook') iconClass = 'fa-fish';
        else if(type === 'objective') iconClass = 'fa-bullseye';
        else if(type === 'pre-assessment') iconClass = 'fa-clipboard-question';
        else if(type === 'participatory') iconClass = 'fa-users-viewfinder';
        else if(type === 'post-assessment') iconClass = 'fa-list-check';
        else if(type === 'summary') iconClass = 'fa-flag-checkered';
        return iconClass;
    }

    function getTextbookConfigFromUI() {
        const styleEl = document.getElementById('tbStyle');
        const diffEl = document.getElementById('tbDifficulty');
        const imgEl = document.getElementById('tbImageMode');
        const streamEl = document.getElementById('tbStreamChapters');
        const extraEl = document.getElementById('tbExtra');

        return {
            style: styleEl ? styleEl.value : 'balanced',
            difficulty: diffEl ? diffEl.value : 'medium',
            image_mode: imgEl ? imgEl.value : 'auto',
            stream_chapters: streamEl ? !!streamEl.checked : true,
            extra: extraEl ? (extraEl.value || '') : ''
        };
    }

    function openTextbookConfig() {
        const modal = document.getElementById('textbookConfigModal');
        if (modal) modal.style.display = 'flex';
        const startBtn = document.getElementById('startTextbookGenerationBtn');
        if (startBtn) {
            const ok = sourceCount > 0;
            startBtn.disabled = !ok;
            startBtn.style.opacity = ok ? '1' : '0.6';
            startBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
            startBtn.innerHTML = ok ? "<i class='fa-solid fa-play'></i> 开始生成" : "<i class='fa-solid fa-circle-exclamation'></i> 请先添加来源";
        }
    }

    function closeTextbookConfig() {
        const modal = document.getElementById('textbookConfigModal');
        if (modal) modal.style.display = 'none';
    }

    function looksLikeDiagramPrompt(promptText) {
        const p = (promptText || '').toLowerCase();
        return /流程|流程图|示意图|结构图|框图|关系图|对比图|图表|chart|diagram|flow|->|→|⇒/.test(p);
    }

    function renderLocalDiagram(containerId, promptText) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const raw = (promptText || '').replace(/\s+/g, ' ').trim();
        const normalized = raw.replace(/→/g, '->').replace(/⇒/g, '->');
        const branchMatch = normalized.match(/^(.+?)\s*->\s*[\{\(]([^\}\)]+)[\}\)]/);
        let diagram = null;
        if (branchMatch) {
            const from = (branchMatch[1] || '').trim();
            const tos = (branchMatch[2] || '')
                .split(/[,，;；、\/|]/)
                .map(s => s.trim())
                .filter(Boolean)
                .slice(0, 5);
            if (from && tos.length) diagram = { type: 'branch', from, tos };
        } else if (normalized.includes('->')) {
            const nodes = normalized
                .split('->')
                .map(s => s.trim())
                .filter(Boolean)
                .slice(0, 6);
            if (nodes.length >= 2) diagram = { type: 'linear', nodes };
        }

        const headerText = escapeHtml(raw.slice(0, 90));
        const title = "示意图（本地绘制）";
        let body = '';
        if (diagram && diagram.type === 'linear') {
            const n = diagram.nodes.length;
            const w = 860;
            const startX = 40;
            const y = 180;
            const boxW = Math.max(160, Math.min(220, Math.floor((w - (n - 1) * 30) / n)));
            const boxH = 86;
            const gap = Math.floor((w - boxW * n) / Math.max(1, n - 1));
            const rects = diagram.nodes.map((t, i) => {
                const x = startX + i * (boxW + gap);
                const cx = x + boxW / 2;
                const text = escapeHtml(t);
                return `
                    <g>
                        <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="14" fill="#ffffff"/>
                        <text x="${cx}" y="${y + 50}" font-size="15" font-weight="700" fill="#0f172a" text-anchor="middle">${text}</text>
                    </g>
                `;
            }).join('');
            const arrows = diagram.nodes.slice(0, -1).map((_, i) => {
                const x1 = startX + (i + 1) * boxW + i * gap;
                const x2 = x1 + gap;
                const midY = y + boxH / 2;
                const ax = x2 - 10;
                return `
                    <path d="M${x1} ${midY} L${x2} ${midY}" stroke="#4f46e5" stroke-width="3" stroke-linecap="round"/>
                    <path d="M${ax} ${midY} L${ax - 10} ${midY - 6} L${ax - 10} ${midY + 6} Z" fill="#4f46e5"/>
                `;
            }).join('');
            body = `<g filter="url(#shadow)">${rects}</g>${arrows}`;
        } else if (diagram && diagram.type === 'branch') {
            const from = escapeHtml(diagram.from);
            const tos = diagram.tos.map(t => escapeHtml(t));
            const leftX = 70;
            const leftY = 168;
            const boxW = 240;
            const boxH = 92;
            const rightX = 560;
            const startY = 120;
            const stepY = 90;
            const toRects = tos.map((t, i) => {
                const y = startY + i * stepY;
                return `
                    <g>
                        <rect x="${rightX}" y="${y}" width="${boxW}" height="${boxH}" rx="14" fill="#ffffff"/>
                        <text x="${rightX + boxW / 2}" y="${y + 54}" font-size="15" font-weight="700" fill="#0f172a" text-anchor="middle">${t}</text>
                    </g>
                `;
            }).join('');
            const fromRect = `
                <g>
                    <rect x="${leftX}" y="${leftY}" width="${boxW}" height="${boxH}" rx="14" fill="#ffffff"/>
                    <text x="${leftX + boxW / 2}" y="${leftY + 54}" font-size="15" font-weight="800" fill="#0f172a" text-anchor="middle">${from}</text>
                </g>
            `;
            const lines = tos.map((_, i) => {
                const y2 = startY + i * stepY + boxH / 2;
                const y1 = leftY + boxH / 2;
                const x1 = leftX + boxW;
                const x2 = rightX;
                const mx = (x1 + x2) / 2;
                const ax = x2 - 10;
                return `
                    <path d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" stroke="#4f46e5" stroke-width="3" fill="none" stroke-linecap="round"/>
                    <path d="M${ax} ${y2} L${ax - 10} ${y2 - 6} L${ax - 10} ${y2 + 6} Z" fill="#4f46e5"/>
                `;
            }).join('');
            body = `<g filter="url(#shadow)">${fromRect}${toRects}</g>${lines}`;
        } else {
            const parts = raw
                .split(/[,，;；、。]/)
                .map(s => s.trim())
                .filter(Boolean)
                .slice(0, 3);
            const a = parts[0] || '概念 A';
            const b = parts[1] || '概念 B';
            const c = parts[2] || '概念 C';
            body = `
                <g filter="url(#shadow)">
                    <rect x="70" y="140" width="220" height="96" rx="14" fill="#ffffff"/>
                    <rect x="340" y="140" width="220" height="96" rx="14" fill="#ffffff"/>
                    <rect x="610" y="140" width="220" height="96" rx="14" fill="#ffffff"/>
                </g>
                <text x="180" y="196" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">${escapeHtml(a)}</text>
                <text x="450" y="196" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">${escapeHtml(b)}</text>
                <text x="720" y="196" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">${escapeHtml(c)}</text>
                <path d="M295 188 L335 188" stroke="#4f46e5" stroke-width="3" stroke-linecap="round"/>
                <path d="M565 188 L605 188" stroke="#4f46e5" stroke-width="3" stroke-linecap="round"/>
                <path d="M330 188 L320 182 L320 194 Z" fill="#4f46e5"/>
                <path d="M600 188 L590 182 L590 194 Z" fill="#4f46e5"/>
            `;
        }

        const svg = `
            <svg viewBox="0 0 900 420" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.12"/>
                        <stop offset="100%" stop-color="#e8864a" stop-opacity="0.10"/>
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.12"/>
                    </filter>
                </defs>
                <rect x="16" y="16" width="868" height="388" rx="18" fill="url(#g1)" />
                <text x="40" y="62" font-size="20" font-weight="800" fill="#0f172a">${title}</text>
                <text x="40" y="92" font-size="13" fill="#64748b">${headerText}</text>
                ${body}
            </svg>
        `;

        container.innerHTML = `
            <div style="padding: 1.25rem 1.25rem 0.75rem 1.25rem; background: white;">
                ${svg}
            </div>
            <div class="textbook-img-caption"><i class="fa-solid fa-compass-drafting"></i> 本地 JS 示意图</div>
        `;
    }

    window.generateTextbook = async function(configOverride) {
        if (sourceCount === 0) {
            alert('请先添加知识来源！');
            return;
        }

        const config = configOverride || window.textbookConfigCurrent || getTextbookConfigFromUI();
        window.textbookConfigCurrent = config;
        
        const loader = document.getElementById('textbookLoader');
        const contentArea = document.getElementById('textbookContent');
        const tocArea = document.getElementById('textbookToc');

        if (contentArea) contentArea.innerHTML = '';
        if (tocArea) tocArea.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; margin-top: 2rem; font-style: italic;">生成中...</div>`;
        
        loader.style.display = 'block';
        loader.classList.remove('minimized');
        loader.innerHTML = `
            <div class="mn-progress-card">
                <div class="mn-progress-head">
                    <div class="mn-progress-title">
                        <i class="fa-solid fa-book-open-reader"></i>
                        <span>生成进度</span>
                    </div>
                    <button type="button" class="mn-progress-toggle" id="textbookProgressToggle" title="折叠/展开">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                </div>
                <div class="mn-progress-body">
                    <div id="textbookProgressText" style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 0.75rem; min-height: 1.5rem;">初始化中...</div>
                    <div style="width: 100%; background: #e2e8f0; height: 8px; border-radius: 999px; overflow: hidden;">
                        <div id="textbookProgressBar" style="width: 0%; height: 100%; background: var(--primary); transition: width 0.3s ease;"></div>
                    </div>
                    <ul id="textbookProgressList" style="list-style: none; padding: 0; margin-top: 0.85rem; text-align: left; font-size: 0.85rem; color: var(--text-muted); max-height: 140px; overflow-y: auto;"></ul>
                </div>
            </div>
        `;
        
        const progressText = document.getElementById('textbookProgressText');
        const progressBar = document.getElementById('textbookProgressBar');
        const progressList = document.getElementById('textbookProgressList');
        const toggleBtn = document.getElementById('textbookProgressToggle');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                loader.classList.toggle('minimized');
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = loader.classList.contains('minimized') ? 'fa-solid fa-plus' : 'fa-solid fa-minus';
            };
        }
        
        function addProgressItem(text, isDone = false) {
            const li = document.createElement('li');
            li.style.marginBottom = '0.5rem';
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '0.5rem';
            if (isDone) {
                li.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> ${text}`;
            } else {
                li.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--primary);"></i> ${text}`;
                // Remove previous spinner if exists
                const prev = progressList.querySelector('.fa-spin');
                if (prev && prev.parentElement !== li) {
                    prev.className = 'fa-solid fa-circle-check';
                    prev.style.color = '#10b981';
                }
            }
            progressList.appendChild(li);
            progressList.scrollTop = progressList.scrollHeight;
        }
        
        try {
            const response = await fetch('/api/mindmapnode/generate_textbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let outline = null;
            let textbookData = { title: '', chapters: [] };
            let scrollSpyBound = false;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // Keep incomplete chunk in buffer
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (data.status === 'error') {
                                throw new Error(data.message);
                            } else if (data.status === 'progress') {
                                progressText.textContent = data.message;
                                
                                if (data.step === 'outline') {
                                    progressBar.style.width = '10%';
                                    addProgressItem('分析材料并规划大纲');
                                } else if (data.step === 'outline_done') {
                                    progressBar.style.width = '20%';
                                    addProgressItem('大纲规划完成', true);
                                    outline = data.outline || null;
                                    if (outline && tocArea) {
                                        textbookData.title = outline.title || 'AI 沉浸式课本';
                                        let tocHtml = '';
                                        (outline.chapters || []).forEach((c, i) => {
                                            const iconClass = getTextbookIconClass(c.type);
                                            tocHtml += `
                                                <div class="toc-item pending ${i === 0 ? 'active' : ''}" data-target="${c.id}" onclick="scrollToChapter('${c.id}')">
                                                    <div class="toc-icon"><i class="fa-solid ${iconClass}"></i></div>
                                                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.title || '')}</span>
                                                </div>
                                            `;
                                        });
                                        tocArea.innerHTML = tocHtml || `<div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; margin-top: 2rem; font-style: italic;">目录生成失败</div>`;
                                    }
                                    if (contentArea) {
                                        const title = escapeHtml((outline && outline.title) || 'AI 沉浸式课本');
                                        contentArea.innerHTML = `<h1 style="font-size: 2.5rem; color: var(--text-main); text-align: center; margin-bottom: 4rem; padding-bottom: 2rem; border-bottom: 2px solid rgba(0,0,0,0.05);">${title}</h1>`;
                                    }
                                } else if (data.step === 'chapter') {
                                    const percent = 20 + (data.current / data.total) * 75;
                                    progressBar.style.width = `${percent}%`;
                                    addProgressItem(`正在撰写: ${data.chapter_title}`);
                                } else if (data.step === 'chapter_done' && config.stream_chapters) {
                                    const chap = data.chapter;
                                    if (chap) {
                                        textbookData.chapters.push(chap);
                                        if (tocArea) {
                                            const tocItem = tocArea.querySelector(`.toc-item[data-target="${chap.id}"]`);
                                            if (tocItem) tocItem.classList.remove('pending');
                                        }

                                        let processedContent = chap.content || '';
                                        const imgRegex = /<img\b[^>]*\bprompt=['"]([^'"]+)['"][^>]*>/gi;
                                        processedContent = processedContent.replace(imgRegex, (match, promptText) => {
                                            const kindMatch = match.match(/\bkind=['"]([^'"]+)['"]/i);
                                            const kind = kindMatch ? kindMatch[1] : '';
                                            const imgId = 'img_' + Math.random().toString(36).substr(2, 9);
                                            generateImageForTextbook(imgId, promptText, kind);
                                            return `
                                                <div class="textbook-img-wrapper" id="${imgId}">
                                                    <div style="padding: 3rem 2rem; text-align: center; background: #f1f5f9; color: var(--text-muted);">
                                                        <i class="fa-solid fa-paintbrush fa-bounce fa-2x" style="margin-bottom: 1rem; color: var(--primary);"></i>
                                                        <p>图片处理中...</p>
                                                        <small>Prompt: ${escapeHtml(promptText)}</small>
                                                    </div>
                                                </div>
                                            `;
                                        });

                                        const iconClass = getTextbookIconClass(chap.type);
                                        const sectionHtml = `
                                            <div class="textbook-section" id="${chap.id}">
                                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(232, 134, 74, 0.1); color: #e8864a; display: flex; align-items: center; justify-content: center;">
                                                        <i class="fa-solid ${iconClass}"></i>
                                                    </div>
                                                    <h2 style="margin: 0; border: none; padding: 0; font-size: 1.75rem;">${escapeHtml(chap.title)}</h2>
                                                </div>
                                                <div class="markdown-body" style="background: transparent; padding: 0;">
                                                    ${processedContent}
                                                </div>
                                            </div>
                                        `;
                                        if (contentArea) contentArea.insertAdjacentHTML('beforeend', sectionHtml);
                                        if (!scrollSpyBound) {
                                            setupTextbookScrollSpy();
                                            scrollSpyBound = true;
                                        }
                                        setupQuizInteractions();
                                    }
                                }
                            } else if (data.status === 'success') {
                                progressBar.style.width = '100%';
                                progressText.textContent = '课本生成完毕！正在渲染...';
                                addProgressItem('课本组装完成', true);
                                
                                setTimeout(() => {
                                    window.textbookData = data.data;
                                    if (!config.stream_chapters) {
                                        renderTextbook(data.data);
                                    }
                                    loader.style.display = 'none';
                                }, 800);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (err) {
            alert('生成失败: ' + err.message);
            loader.style.display = 'none';
        }
    };
    
    function renderTextbook(data) {
        const contentArea = document.getElementById('textbookContent');
        const tocArea = document.getElementById('textbookToc');
        const config = window.textbookConfigCurrent || {};
        
        if (!data || !data.chapters || data.chapters.length === 0) {
            contentArea.innerHTML = '<div style="text-align: center; color: var(--danger); margin-top: 2rem;">生成的数据结构异常</div>';
            return;
        }
        
        let tocHtml = '';
        let contentHtml = `<h1 style="font-size: 2.5rem; color: var(--text-main); text-align: center; margin-bottom: 4rem; padding-bottom: 2rem; border-bottom: 2px solid rgba(0,0,0,0.05);">${escapeHtml(data.title || 'AI 沉浸式课本')}</h1>`;
        
        data.chapters.forEach((chap, index) => {
            const iconClass = getTextbookIconClass(chap.type);
            
            // Generate TOC Item
            tocHtml += `
                <div class="toc-item ${index === 0 ? 'active' : ''}" data-target="${chap.id}" onclick="scrollToChapter('${chap.id}')">
                    <div class="toc-icon"><i class="fa-solid ${iconClass}"></i></div>
                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(chap.title)}</span>
                </div>
            `;
            
            // Process Content: Find Image Prompts
            let processedContent = chap.content || '';
            
            const imgRegex = /<img\b[^>]*\bprompt=['"]([^'"]+)['"][^>]*>/gi;
            processedContent = processedContent.replace(imgRegex, (match, promptText) => {
                const kindMatch = match.match(/\bkind=['"]([^'"]+)['"]/i);
                const kind = kindMatch ? kindMatch[1] : '';
                const imgId = 'img_' + Math.random().toString(36).substr(2, 9);
                generateImageForTextbook(imgId, promptText, kind);
                const mode = (config.image_mode || 'auto');
                const label = mode === 'wiki' ? '百科图检索中...' : (mode === 'none' ? '图片已关闭' : '图片处理中...');
                return `
                    <div class="textbook-img-wrapper" id="${imgId}">
                        <div style="padding: 4rem 2rem; text-align: center; background: #f1f5f9; color: var(--text-muted);">
                            <i class="fa-solid fa-paintbrush fa-bounce fa-2x" style="margin-bottom: 1rem; color: var(--primary);"></i>
                            <p>${label}</p>
                            <small>Prompt: ${escapeHtml(promptText)}</small>
                        </div>
                    </div>
                `;
            });
            
            // Generate Content Section
            contentHtml += `
                <div class="textbook-section" id="${chap.id}">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(232, 134, 74, 0.1); color: #e8864a; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid ${iconClass}"></i>
                        </div>
                        <h2 style="margin: 0; border: none; padding: 0; font-size: 1.75rem;">${escapeHtml(chap.title)}</h2>
                    </div>
                    <div class="markdown-body" style="background: transparent; padding: 0;">
                        ${processedContent}
                    </div>
                </div>
            `;
        });
        
        tocArea.innerHTML = tocHtml;
        contentArea.innerHTML = contentHtml;
        
        // Setup scroll spy for TOC
        setupTextbookScrollSpy();
        
        // Setup Quiz Interactions
        setupQuizInteractions();
    }
    
    async function generateImageForTextbook(containerId, promptText, kind) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.dataset.prompt = promptText || '';
            container.dataset.kind = kind || '';

            const config = window.textbookConfigCurrent || {};
            const mode = (config.image_mode || 'auto').toLowerCase();

            if (mode === 'none') {
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: #f8fafc;">图片已关闭</div>
                `;
                return;
            }

            if (mode === 'auto' && (kind === 'diagram' || looksLikeDiagramPrompt(promptText))) {
                renderLocalDiagram(containerId, promptText);
                return;
            }

            const tryWiki = async () => {
                const res = await fetch('/api/mindmapnode/generate_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptText, mode: 'wiki' })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.status === 'success' && data.image_url) {
                    container.innerHTML = `
                        <img src="${data.image_url}" alt="Reference Illustration" />
                        <div class="textbook-img-caption"><i class="fa-solid fa-book"></i> 百科图</div>
                    `;
                    return true;
                }
                return false;
            };

            const tryAI = async (attempt) => {
                const res = await fetch('/api/mindmapnode/generate_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptText, mode: 'ai' })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.status === 'success' && data.image_url) {
                    container.innerHTML = `
                        <img src="${data.image_url}" alt="AI Generated Illustration" />
                        <div class="textbook-img-caption"><i class="fa-solid fa-wand-magic-sparkles"></i> AI 智能配图</div>
                    `;
                    return true;
                }

                if (attempt < 2) {
                    container.innerHTML = `
                        <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: #f8fafc;">
                            图片生成遇到网络波动，正在重试（${attempt + 1}/2）...
                        </div>
                    `;
                    await new Promise(r => setTimeout(r, 900 * (attempt + 1)));
                    return await tryAI(attempt + 1);
                }

                return false;
            };

            if (mode === 'wiki') {
                const ok = await tryWiki();
                if (!ok) {
                    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--danger); background: #fef2f2;">百科图检索失败</div>`;
                }
                return;
            }

            if (mode === 'ai') {
                const ok = await tryAI(0);
                if (!ok) {
                    container.innerHTML = `
                        <div style="padding: 2rem; text-align: center; color: var(--danger); background: #fef2f2;">
                            AI 生图失败（网络错误或服务不可用）
                        </div>
                        <div class="img-actions">
                            <button class="secondary-btn" onclick="window.retryTextbookImage && window.retryTextbookImage('${containerId}')">重试</button>
                            <button class="primary-btn" onclick="window.fallbackTextbookImageToWiki && window.fallbackTextbookImageToWiki('${containerId}')">试试百科图</button>
                        </div>
                    `;
                }
                return;
            }

            if (mode === 'auto') {
                const wikiOk = await tryWiki();
                if (wikiOk) return;
                const aiOk = await tryAI(0);
                if (aiOk) return;
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--danger); background: #fef2f2;">
                        图片生成失败（已尝试百科图与 AI）
                    </div>
                `;
                return;
            }
        } catch (err) {
            console.error("Image generation failed", err);
        }
    }

    window.retryTextbookImage = function(containerId) {
        const el = document.getElementById(containerId);
        const promptText = el ? (el.dataset.prompt || '') : '';
        const kind = el ? (el.dataset.kind || '') : '';
        generateImageForTextbook(containerId, promptText, kind);
    };

    window.fallbackTextbookImageToWiki = async function(containerId) {
        const el = document.getElementById(containerId);
        const promptText = el ? (el.dataset.prompt || '') : '';
        const kind = el ? (el.dataset.kind || '') : '';
        const prev = window.textbookConfigCurrent || {};
        window.textbookConfigCurrent = { ...prev, image_mode: 'wiki' };
        await generateImageForTextbook(containerId, promptText, kind);
        window.textbookConfigCurrent = prev;
    };
    
    window.scrollToChapter = function(chapterId) {
        const el = document.getElementById(chapterId);
        const scrollArea = document.getElementById('textbookScrollArea');
        if (el && scrollArea) {
            // Update TOC active state immediately
            document.querySelectorAll('.toc-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === chapterId) {
                    item.classList.add('active');
                }
            });
            
            // Scroll to element
            scrollArea.scrollTo({
                top: el.offsetTop - scrollArea.offsetTop,
                behavior: 'smooth'
            });
        }
    };
    
    function setupTextbookScrollSpy() {
        const scrollArea = document.getElementById('textbookScrollArea');
        if (!scrollArea) return;
        if (scrollArea.dataset.scrollSpyBound) return;
        scrollArea.dataset.scrollSpyBound = '1';
        
        scrollArea.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('.textbook-section');
            let currentSectionId = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - scrollArea.offsetTop;
                if (scrollArea.scrollTop >= sectionTop - 100) {
                    currentSectionId = section.getAttribute('id');
                }
            });
            
            if (currentSectionId) {
                document.querySelectorAll('.toc-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-target') === currentSectionId) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }
    
    // Bind regenerate button
    const regenBtn = document.getElementById('regenerateTextbookBtn');
    if (regenBtn) {
        regenBtn.addEventListener('click', openTextbookConfig);
    }

    const openCfgBtn = document.getElementById('openTextbookConfigBtn');
    if (openCfgBtn) {
        openCfgBtn.addEventListener('click', openTextbookConfig);
    }

    const startTbBtn = document.getElementById('startTextbookGenerationBtn');
    if (startTbBtn) {
        startTbBtn.addEventListener('click', () => {
            if (startTbBtn.disabled) return;
            const cfg = getTextbookConfigFromUI();
            window.textbookConfigCurrent = cfg;
            closeTextbookConfig();
            generateTextbook(cfg);
        });
    }

    const cancelTbBtn = document.getElementById('cancelTextbookConfigBtn');
    if (cancelTbBtn) cancelTbBtn.addEventListener('click', closeTextbookConfig);

    const closeTbBtn = document.getElementById('closeTextbookConfigBtn');
    if (closeTbBtn) closeTbBtn.addEventListener('click', closeTextbookConfig);

    function setupQuizInteractions() {
        document.querySelectorAll('.textbook-quiz-box').forEach(box => {
            // Prevent multiple bindings if setup is called again
            if (box.dataset.quizInitialized) return;
            box.dataset.quizInitialized = 'true';

            const options = box.querySelectorAll('.quiz-option');
            const explanation = box.querySelector('.quiz-explanation');
            const correctAnswer = box.getAttribute('data-correct-answer');
            
            options.forEach(opt => {
                opt.addEventListener('click', function() {
                    // Disable all options after selection
                    options.forEach(o => o.style.pointerEvents = 'none');
                    
                    const selectedValue = this.getAttribute('data-value');
                    if (selectedValue === correctAnswer) {
                        this.style.backgroundColor = '#dcfce7';
                        this.style.borderColor = '#22c55e';
                        this.style.color = '#166534';
                        this.innerHTML += ' <i class="fa-solid fa-check" style="float: right; margin-top: 4px;"></i>';
                    } else {
                        this.style.backgroundColor = '#fee2e2';
                        this.style.borderColor = '#ef4444';
                        this.style.color = '#991b1b';
                        this.innerHTML += ' <i class="fa-solid fa-xmark" style="float: right; margin-top: 4px;"></i>';
                        // Highlight the correct one
                        const correctOpt = Array.from(options).find(o => o.getAttribute('data-value') === correctAnswer);
                        if (correctOpt) {
                            correctOpt.style.backgroundColor = '#dcfce7';
                            correctOpt.style.borderColor = '#22c55e';
                            correctOpt.style.color = '#166534';
                        }
                    }
                    
                    if (explanation) {
                        explanation.style.display = 'block';
                    }
                });
            });
        });
    }

    // --- Infinity City ---
    const icConfigForm = document.getElementById('infinityCityConfigForm');
    const icDisplayArea = document.getElementById('infinityCityDisplayArea');
    const icLoader = document.getElementById('infinityCityLoader');
    const icLoadingText = document.getElementById('icLoadingText');
    const icImage = document.getElementById('infinityCityImage');
    const icHotspots = document.getElementById('infinityCityHotspots');
    const icBreadcrumbs = document.getElementById('icBreadcrumbs');
    const icCurrentTitle = document.getElementById('icCurrentTitle');
    const icCurrentSummary = document.getElementById('icCurrentSummary');
    const icClickInfo = document.getElementById('icClickInfo');
    const icHotspotList = document.getElementById('icHotspotList');
    const icOverlayHint = document.getElementById('icOverlayHint');
    const icClickPulse = document.getElementById('infinityCityClickPulse');
    const icBackBtn = document.getElementById('icBackBtn');
    const icGenerateBtn = document.getElementById('icGenerateBtn');
    const icOpenConfigBtn = document.getElementById('icOpenConfigBtn');
    const icResetBtn = document.getElementById('icResetBtn');
    const icRegenerateCurrentBtn = document.getElementById('icRegenerateCurrentBtn');

    window.infinityCityState = {
        nodes: {},
        rootId: null,
        currentId: null,
        generating: false,
        lastConfig: null
    };

    function buildInfinityCityNodeId() {
        return `ic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function getInfinityCityConfig() {
        return {
            topic: (document.getElementById('icTopic')?.value || '').trim(),
            metaphor: document.getElementById('icMetaphor')?.value || 'auto',
            visual_style: document.getElementById('icVisualStyle')?.value || 'cinematic',
            size: document.getElementById('icSize')?.value || '1280x1280',
            extra: (document.getElementById('icExtra')?.value || '').trim()
        };
    }

    function setInfinityCityRootLoading(isLoading, text) {
        if (!icLoader || !icConfigForm || !icDisplayArea) return;
        icConfigForm.style.display = isLoading ? 'none' : icConfigForm.style.display;
        icLoader.style.display = isLoading ? 'block' : 'none';
        if (text && icLoadingText) icLoadingText.textContent = text;
        if (isLoading) icDisplayArea.style.display = 'none';
    }

    function setInfinityCityBusy(isBusy, hintText) {
        window.infinityCityState.generating = isBusy;
        if (icOverlayHint && hintText) icOverlayHint.textContent = hintText;
        if (icImage) icImage.style.cursor = isBusy ? 'progress' : 'crosshair';
        if (icRegenerateCurrentBtn) icRegenerateCurrentBtn.disabled = isBusy;
        if (icBackBtn) icBackBtn.disabled = isBusy || !window.infinityCityState.currentId || !window.infinityCityState.nodes[window.infinityCityState.currentId]?.parentId;
    }

    function removeInfinityCitySubtree(nodeId) {
        const state = window.infinityCityState;
        const node = state.nodes[nodeId];
        if (!node) return;
        (node.children || []).forEach(childId => removeInfinityCitySubtree(childId));
        delete state.nodes[nodeId];
    }

    function resetInfinityCityState(showForm = true) {
        window.infinityCityState = {
            nodes: {},
            rootId: null,
            currentId: null,
            generating: false,
            lastConfig: window.infinityCityState?.lastConfig || null
        };
        if (icImage) {
            icImage.removeAttribute('src');
            icImage.style.display = 'none';
        }
        if (icHotspots) icHotspots.innerHTML = '';
        if (icBreadcrumbs) icBreadcrumbs.innerHTML = '';
        if (icCurrentTitle) icCurrentTitle.textContent = '尚未生成';
        if (icCurrentSummary) icCurrentSummary.textContent = '这里会显示当前层的知识情境说明。';
        if (icClickInfo) icClickInfo.textContent = '尚未点击任何区域';
        if (icHotspotList) icHotspotList.innerHTML = `<div class="ic-hotspot-empty">当前层还没有已缓存的细节入口</div>`;
        if (icOverlayHint) icOverlayHint.textContent = '点击图中的任意位置，向内生成更细致的一层世界';
        if (icDisplayArea) icDisplayArea.style.display = 'none';
        if (icLoader) icLoader.style.display = 'none';
        if (icClickPulse) icClickPulse.style.display = 'none';
        if (icResetBtn) icResetBtn.style.display = 'none';
        if (showForm && icConfigForm) icConfigForm.style.display = 'block';
    }

    function ensureInfinityCityConfigVisible() {
        if (!icConfigForm) return;
        icConfigForm.style.display = 'block';
        icConfigForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderInfinityCityBreadcrumbs(node) {
        if (!icBreadcrumbs) return;
        const state = window.infinityCityState;
        const chain = [];
        let cur = node;
        while (cur) {
            chain.unshift(cur);
            cur = cur.parentId ? state.nodes[cur.parentId] : null;
        }
        icBreadcrumbs.innerHTML = chain.map((item, index) => {
            const safeTitle = escapeHtml(item.title || `第 ${index + 1} 层`);
            return `<button type="button" class="ic-breadcrumb" data-ic-node="${item.id}">${safeTitle}</button>`;
        }).join('');
        icBreadcrumbs.querySelectorAll('[data-ic-node]').forEach(btn => {
            btn.addEventListener('click', () => navigateInfinityCityTo(btn.getAttribute('data-ic-node')));
        });
    }

    function renderInfinityCityHotspots(node) {
        if (!icHotspots || !icHotspotList) return;
        const state = window.infinityCityState;
        const children = (node.children || []).map(id => state.nodes[id]).filter(Boolean);

        icHotspots.innerHTML = children.map(child => {
            const xPct = child.click?.xPct || 50;
            const yPct = child.click?.yPct || 50;
            const label = escapeHtml(child.hotspotLabel || child.title || '细节');
            return `
                <button type="button" class="ic-hotspot" data-child-id="${child.id}" style="left:${xPct}%; top:${yPct}%;">
                    <span class="ic-hotspot-label">${label}</span>
                </button>
            `;
        }).join('');

        icHotspots.querySelectorAll('.ic-hotspot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateInfinityCityTo(btn.getAttribute('data-child-id'));
            });
        });

        if (!children.length) {
            icHotspotList.innerHTML = `<div class="ic-hotspot-empty">当前层还没有已缓存的细节入口</div>`;
            return;
        }

        icHotspotList.innerHTML = children.map((child, index) => {
            const label = escapeHtml(child.hotspotLabel || child.title || `细节 ${index + 1}`);
            const clickText = child.click ? `坐标 (${child.click.x}, ${child.click.y})` : '已生成';
            return `
                <div class="ic-hotspot-item" data-child-id="${child.id}">
                    <div style="font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem;">${label}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${clickText}</div>
                </div>
            `;
        }).join('');

        icHotspotList.querySelectorAll('[data-child-id]').forEach(item => {
            item.addEventListener('click', () => navigateInfinityCityTo(item.getAttribute('data-child-id')));
        });
    }

    function renderInfinityCityNode(nodeId) {
        const state = window.infinityCityState;
        const node = state.nodes[nodeId];
        if (!node) return;

        state.currentId = nodeId;
        if (icConfigForm) icConfigForm.style.display = 'none';
        if (icLoader) icLoader.style.display = 'none';
        if (icDisplayArea) icDisplayArea.style.display = 'flex';
        if (icResetBtn) icResetBtn.style.display = 'inline-flex';

        renderInfinityCityBreadcrumbs(node);
        renderInfinityCityHotspots(node);

        if (icCurrentTitle) icCurrentTitle.textContent = node.title || '无限城';
        if (icCurrentSummary) icCurrentSummary.textContent = node.summary || '当前层已生成，可继续点击任意位置向内探索。';
        if (icClickInfo) {
            if (node.click) {
                icClickInfo.textContent = `来自父层点击：(${node.click.x}, ${node.click.y})，归一化 ${node.click.xPct.toFixed(2)}% / ${node.click.yPct.toFixed(2)}%`;
            } else {
                icClickInfo.textContent = '当前是根场景，尚未有进入坐标。';
            }
        }
        if (icBackBtn) icBackBtn.disabled = !node.parentId || state.generating;
        if (icOverlayHint) {
            icOverlayHint.textContent = node.children?.length
                ? '点击新区域继续深入，或直接点击已有热点返回已生成细节'
                : '点击图中的任意位置，向内生成更细致的一层世界';
        }
        if (icClickPulse) icClickPulse.style.display = 'none';

        if (icImage) {
            icImage.style.display = 'block';
            icImage.onload = () => {
                renderInfinityCityHotspots(node);
            };
            icImage.src = node.imageUrl;
        }
    }

    function navigateInfinityCityTo(nodeId) {
        if (!nodeId) return;
        renderInfinityCityNode(nodeId);
    }

    function findInfinityCityExistingChild(node, xPct, yPct) {
        const state = window.infinityCityState;
        const children = (node.children || []).map(id => state.nodes[id]).filter(Boolean);
        return children.find(child => {
            if (!child.click) return false;
            const dx = child.click.xPct - xPct;
            const dy = child.click.yPct - yPct;
            return Math.sqrt(dx * dx + dy * dy) <= 3.2;
        }) || null;
    }

    function showInfinityCityClickPulse(renderX, renderY) {
        if (!icClickPulse) return;
        icClickPulse.style.display = 'block';
        icClickPulse.style.left = `${renderX}px`;
        icClickPulse.style.top = `${renderY}px`;
    }

    async function generateInfinityCityRoot(reuseConfig) {
        const config = reuseConfig || getInfinityCityConfig();
        if (!config.topic && sourceCount === 0) {
            alert('请先添加来源，或至少填写一个主题。');
            ensureInfinityCityConfigVisible();
            return;
        }

        window.infinityCityState.lastConfig = config;
        setInfinityCityRootLoading(true, 'AI 正在构建可探索的知识世界，请稍候...');
        setInfinityCityBusy(true, '正在构建无限城...');

        try {
            const response = await fetch('/api/mindmapnode/infinity_city/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await response.json();
            if (!response.ok || data.status !== 'success' || !data.data) {
                throw new Error(data.error || '无限城生成失败');
            }

            const nodeId = buildInfinityCityNodeId();
            window.infinityCityState.nodes = {
                [nodeId]: {
                    id: nodeId,
                    parentId: null,
                    depth: 0,
                    title: data.data.title || config.topic || '无限城',
                    summary: data.data.scene_brief || '根场景已生成。',
                    imageUrl: data.data.image_url,
                    prompt: data.data.prompt || '',
                    topic: data.data.topic || config.topic || '',
                    metaphor: data.data.metaphor || config.metaphor || 'auto',
                    visualStyle: data.data.visual_style || config.visual_style || 'cinematic',
                    size: data.data.size || config.size || '1280x1280',
                    extra: data.data.extra || config.extra || '',
                    children: [],
                    click: null,
                    hotspotLabel: '根场景'
                }
            };
            window.infinityCityState.rootId = nodeId;
            window.infinityCityState.currentId = nodeId;
            renderInfinityCityNode(nodeId);
        } catch (err) {
            alert('生成失败: ' + err.message);
            if (icConfigForm) icConfigForm.style.display = 'block';
        } finally {
            setInfinityCityRootLoading(false);
            setInfinityCityBusy(false, '点击图中的任意位置，向内生成更细致的一层世界');
        }
    }

    async function zoomInfinityCityAtPoint(node, x, y, xPct, yPct, renderX, renderY) {
        const existingChild = findInfinityCityExistingChild(node, xPct, yPct);
        if (existingChild) {
            navigateInfinityCityTo(existingChild.id);
            return;
        }

        if (!icImage || !icImage.naturalWidth || !icImage.naturalHeight) return;
        setInfinityCityBusy(true, 'AI 正在向该区域深入解析...');
        showInfinityCityClickPulse(renderX, renderY);

        const requestPayload = {
            image_url: node.imageUrl,
            current_title: node.title,
            current_prompt: node.prompt,
            topic: node.topic,
            metaphor: node.metaphor,
            visual_style: node.visualStyle,
            extra: node.extra,
            size: node.size,
            depth: node.depth,
            x,
            y,
            image_width: icImage.naturalWidth,
            image_height: icImage.naturalHeight
        };

        try {
            const response = await fetch('/api/mindmapnode/infinity_city/zoom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });
            const data = await response.json();
            if (!response.ok || data.status !== 'success' || !data.data) {
                throw new Error(data.error || '局部放大失败');
            }

            const childId = buildInfinityCityNodeId();
            window.infinityCityState.nodes[childId] = {
                id: childId,
                parentId: node.id,
                depth: node.depth + 1,
                title: data.data.title || `细节层 ${node.depth + 1}`,
                summary: data.data.summary || '已生成局部细节层。',
                imageUrl: data.data.image_url,
                prompt: data.data.prompt || '',
                topic: node.topic,
                metaphor: node.metaphor,
                visualStyle: node.visualStyle,
                size: node.size,
                extra: node.extra,
                children: [],
                hotspotLabel: data.data.hotspot_label || data.data.title || '细节',
                click: { x, y, xPct, yPct },
                requestPayload
            };
            node.children = node.children || [];
            node.children.push(childId);
            renderInfinityCityNode(childId);
        } catch (err) {
            alert('放大失败: ' + err.message);
            if (icClickPulse) icClickPulse.style.display = 'none';
        } finally {
            setInfinityCityBusy(false, '点击图中的任意位置，向内生成更细致的一层世界');
        }
    }

    async function regenerateInfinityCityCurrent() {
        const state = window.infinityCityState;
        const node = state.nodes[state.currentId];
        if (!node || state.generating) return;

        if (!node.parentId) {
            await generateInfinityCityRoot(state.lastConfig || getInfinityCityConfig());
            return;
        }

        setInfinityCityBusy(true, 'AI 正在重生成当前层...');
        try {
            const response = await fetch('/api/mindmapnode/infinity_city/zoom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(node.requestPayload)
            });
            const data = await response.json();
            if (!response.ok || data.status !== 'success' || !data.data) {
                throw new Error(data.error || '重生成失败');
            }

            (node.children || []).forEach(childId => removeInfinityCitySubtree(childId));
            node.children = [];
            node.title = data.data.title || node.title;
            node.summary = data.data.summary || node.summary;
            node.imageUrl = data.data.image_url || node.imageUrl;
            node.prompt = data.data.prompt || node.prompt;
            node.hotspotLabel = data.data.hotspot_label || node.hotspotLabel;
            renderInfinityCityNode(node.id);
        } catch (err) {
            alert('重生成失败: ' + err.message);
        } finally {
            setInfinityCityBusy(false, '点击图中的任意位置，向内生成更细致的一层世界');
        }
    }

    if (icImage) {
        icImage.addEventListener('click', (event) => {
            const state = window.infinityCityState;
            const node = state.nodes[state.currentId];
            if (!node || state.generating) return;

            const rect = icImage.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            const xPct = (clickX / rect.width) * 100;
            const yPct = (clickY / rect.height) * 100;
            const x = Math.round((clickX / rect.width) * icImage.naturalWidth);
            const y = Math.round((clickY / rect.height) * icImage.naturalHeight);
            zoomInfinityCityAtPoint(node, x, y, xPct, yPct, clickX, clickY);
        });
    }

    if (icGenerateBtn) icGenerateBtn.addEventListener('click', () => generateInfinityCityRoot());
    if (icOpenConfigBtn) icOpenConfigBtn.addEventListener('click', ensureInfinityCityConfigVisible);
    if (icResetBtn) icResetBtn.addEventListener('click', () => resetInfinityCityState(true));
    if (icBackBtn) icBackBtn.addEventListener('click', () => {
        const state = window.infinityCityState;
        const node = state.nodes[state.currentId];
        if (node?.parentId) navigateInfinityCityTo(node.parentId);
    });
    if (icRegenerateCurrentBtn) icRegenerateCurrentBtn.addEventListener('click', regenerateInfinityCityCurrent);

    // --- Mind Map Generation & Rendering ---
    let myChart = null;
    
    window.generateMindmap = async function() {
        if (sourceCount === 0) {
            alert('请先添加知识来源！');
            return;
        }
        
        const loader = document.getElementById('mindmapLoader');
        const canvas = document.getElementById('echartsMain');
        const exportBtn = document.getElementById('exportMindmapBtn');
        const detailPanel = document.getElementById('nodeDetailsPanel');
        
        loader.style.display = 'block';
        canvas.style.opacity = '0.3';
        exportBtn.style.display = 'none';
        detailPanel.style.display = 'none';
        
        try {
            const response = await fetch('/api/mindmapnode/generate_mindmap', { method: 'POST' });
            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
                window.mindmapData = data.data;
                renderMindmap(window.mindmapData);
                exportBtn.style.display = 'block';
            } else {
                alert('生成失败: ' + (data.error || '未知错误'));
            }
        } catch (err) {
            alert('请求失败: ' + err.message);
        } finally {
            loader.style.display = 'none';
            canvas.style.opacity = '1';
        }
    };
    
    function renderMindmap(data) {
        if (!myChart) {
            myChart = echarts.init(document.getElementById('echartsMain'));
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (myChart) myChart.resize();
            });
            
            // Handle node click
            myChart.on('click', function(params) {
                if (params.data) {
                    showNodeDetails(params.data);
                }
            });
        }
        
        const option = {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove'
            },
            series: [
                {
                    type: 'tree',
                    roam: true,
                    data: [data],
                    top: '5%',
                    left: '10%',
                    bottom: '5%',
                    right: '20%',
                    symbolSize: 10,
                    label: {
                        position: 'left',
                        verticalAlign: 'middle',
                        align: 'right',
                        fontSize: 14,
                        color: '#0f172a',
                        backgroundColor: '#fff',
                        padding: [6, 10],
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        shadowColor: 'rgba(0,0,0,0.05)',
                        shadowBlur: 10
                    },
                    leaves: {
                        label: {
                            position: 'right',
                            verticalAlign: 'middle',
                            align: 'left'
                        }
                    },
                    emphasis: {
                        focus: 'descendant'
                    },
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750,
                    initialTreeDepth: 3,
                    lineStyle: {
                        color: '#cbd5e1',
                        width: 2,
                        curveness: 0.5
                    }
                }
            ]
        };
        
        myChart.setOption(option);
    }
    
    document.getElementById('regenerateMindmapBtn').addEventListener('click', generateMindmap);
    
    document.getElementById('exportMindmapBtn').addEventListener('click', () => {
        if (myChart) {
            const url = myChart.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#f8fafc'
            });
            const a = document.createElement('a');
            a.download = '思维导图.png';
            a.href = url;
            a.click();
        }
    });

    function showNodeDetails(nodeData) {
        const detailPanel = document.getElementById('nodeDetailsPanel');
        const keywordEl = document.getElementById('nodeKeyword');
        const sourceTextEl = document.getElementById('nodeSourceText');
        const webLinksEl = document.getElementById('nodeWebLinks');
        const loader = document.getElementById('nodeLinksLoader');
        const locateBtn = document.getElementById('locatePdfBtn');
        
        detailPanel.style.display = 'flex';
        keywordEl.textContent = nodeData.keyword || nodeData.name;
        sourceTextEl.textContent = nodeData.source_text || '暂无来源摘录';
        
        // Show locate button only if there's source text
        if (nodeData.source_text) {
            locateBtn.style.display = 'block';
            locateBtn.onclick = () => {
                // Find a PDF source to open
                let pdfSourceId = null;
                for (const [id, data] of Object.entries(sourcesData)) {
                    if (data.type === 'pdf') {
                        pdfSourceId = id;
                        break;
                    }
                }
                
                if (pdfSourceId) {
                    previewSource(pdfSourceId, nodeData.source_text);
                } else {
                    alert('未找到可用的PDF来源。');
                }
            };
        } else {
            locateBtn.style.display = 'none';
        }
        
        // Fetch web links
        webLinksEl.innerHTML = '';
        loader.style.display = 'block';
        
        const query = nodeData.keyword || nodeData.name;
        fetch('/api/mindmapnode/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        })
        .then(res => res.json())
        .then(data => {
            loader.style.display = 'none';
            if (data.status === 'success' && data.results && data.results.search_result) {
                data.results.search_result.slice(0, 4).forEach(item => {
                    webLinksEl.innerHTML += `
                        <a href="${item.link}" target="_blank" style="text-decoration: none; padding: 0.75rem; background: white; border: 1px solid var(--border-color); border-radius: 8px; transition: var(--transition); display: block;">
                            <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.25rem;">${item.title}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.content}</div>
                        </a>
                    `;
                });
            } else {
                webLinksEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">未找到相关链接</div>';
            }
        })
        .catch(err => {
            loader.style.display = 'none';
            webLinksEl.innerHTML = `<div style="color: #ef4444; font-size: 0.85rem;">搜索失败: ${err.message}</div>`;
        });
    }

    // --- Report Generation & Interaction ---
    async function generateReport(isFirst = false, userMessage = "") {
        if (sourceCount === 0 && isFirst) {
            alert('请先添加知识来源！');
            return;
        }

        const loader = document.getElementById('reportLoader');
        const container = document.getElementById('reportHtmlContainer');
        const exportBtn = document.getElementById('exportReportPdfBtn');
        const reportInput = document.getElementById('reportInput');

        if (isFirst) {
            loader.style.display = 'block';
            container.innerHTML = '';
            exportBtn.style.display = 'none';
            userMessage = "请开始撰写研究报告。";
        } else {
            // Append a user interaction marker
            const userMsgDiv = document.createElement('div');
            userMsgDiv.style.cssText = "margin: 2rem 0; padding: 1rem; background: #e0e7ff; border-radius: 8px; border-left: 4px solid #4f46e5; color: #3730a3; font-weight: 600;";
            userMsgDiv.innerHTML = `<i class="fa-solid fa-user"></i> 用户要求：${userMessage}`;
            container.appendChild(userMsgDiv);
            
            const aiThinkingDiv = document.createElement('div');
            aiThinkingDiv.id = 'aiReportThinking';
            aiThinkingDiv.style.cssText = "color: #6366f1; font-style: italic; margin-bottom: 1rem;";
            aiThinkingDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI 正在补充内容...';
            container.appendChild(aiThinkingDiv);
            
            // Scroll to bottom
            const reportStageContainer = document.querySelector('#reportStage > div:nth-child(2)');
            if (reportStageContainer) reportStageContainer.scrollTop = reportStageContainer.scrollHeight;
        }

        if (reportInput) reportInput.disabled = true;

        try {
            const response = await fetch('/api/mindmapnode/report_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, is_first: isFirst })
            });

            if (!response.ok) throw new Error('网络请求失败');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            if (isFirst) loader.style.display = 'none';
            const thinkingEl = document.getElementById('aiReportThinking');
            if (thinkingEl) thinkingEl.remove();

            // Create a new div for this chunk of generation
            const chunkDiv = document.createElement('div');
            chunkDiv.className = 'report-section';
            container.appendChild(chunkDiv);

            let accumulatedHtml = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') break;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.error) {
                                accumulatedHtml += `<div style="color: red;">${data.error}</div>`;
                            } else if (data.content) {
                                accumulatedHtml += data.content;
                            }
                            chunkDiv.innerHTML = accumulatedHtml;
                            
                            // Scroll to bottom as it generates
                            const reportStageContainer = document.querySelector('#reportStage > div:nth-child(2)');
                            if (reportStageContainer) reportStageContainer.scrollTop = reportStageContainer.scrollHeight;
                        } catch (e) {
                            console.error('SSE Parse error in report', e, dataStr);
                        }
                    }
                }
            }
            
            exportBtn.style.display = 'block';
            
            // --- Parse and Generate Images ---
            const aiImages = chunkDiv.querySelectorAll('ai-image');
            aiImages.forEach(async (el) => {
                const prompt = el.getAttribute('prompt');
                if (!prompt) return;
                
                el.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: rgba(79, 70, 229, 0.05); border: 1px dashed rgba(79, 70, 229, 0.3); border-radius: 12px; margin: 1.5rem 0;">
                        <i class="fa-solid fa-palette fa-bounce" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                        <div style="color: var(--primary); font-size: 0.9rem; font-weight: 600;">AI 正在绘制配图...</div>
                        <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.25rem;">Prompt: ${prompt}</div>
                    </div>
                `;
                
                try {
                    const res = await fetch('/api/mindmapnode/generate_image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: prompt })
                    });
                    const data = await res.json();
                    if (data.status === 'success' && data.url) {
                        const proxyUrl = `/api/mindmapnode/proxy_image?url=${encodeURIComponent(data.url)}`;
                        el.outerHTML = `
                            <figure style="margin: 2rem 0; text-align: center;">
                                <img src="${proxyUrl}" crossorigin="anonymous" style="max-width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);" alt="${prompt}" />
                                <figcaption style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted); font-style: italic;">AI 配图: ${prompt}</figcaption>
                            </figure>
                        `;
                    } else {
                        el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red;">图片生成失败</div>`;
                    }
                } catch (e) {
                    el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red;">图片生成失败: ${e.message}</div>`;
                }
            });
            // ---------------------------------
            
        } catch (err) {
            alert('报告生成失败: ' + err.message);
        } finally {
            if (isFirst) loader.style.display = 'none';
            const thinkingEl = document.getElementById('aiReportThinking');
            if (thinkingEl) thinkingEl.remove();
            if (reportInput) reportInput.disabled = false;
        }
    }

    const reportSendBtn = document.getElementById('reportSendBtn');
    const reportInput = document.getElementById('reportInput');
    
    if (reportSendBtn) {
        reportSendBtn.addEventListener('click', () => {
            const msg = reportInput.value.trim();
            if (msg) {
                reportInput.value = '';
                generateReport(false, msg);
            }
        });
    }
    
    if (reportInput) {
        reportInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const msg = reportInput.value.trim();
                if (msg) {
                    reportInput.value = '';
                    generateReport(false, msg);
                }
            }
        });
    }

    const exportReportPdfBtn = document.getElementById('exportReportPdfBtn');
    if (exportReportPdfBtn) {
        exportReportPdfBtn.addEventListener('click', () => {
            const element = document.getElementById('reportContent');
            
            // Set consistent width for export to prevent right side cutoff
            const originalWidth = element.style.width;
            const originalMaxWidth = element.style.maxWidth;
            const originalPadding = element.style.padding;
            const originalMargin = element.style.margin;
            
            element.style.width = '1000px';
            element.style.maxWidth = '1000px';
            element.style.padding = '4rem 6rem'; // Match the web view padding
            element.style.margin = '0'; // Reset margin to avoid offset in PDF
            
            const opt = {
              margin:       [0, 0, 0, 0], // Remove margin to use element's padding
              filename:     'AI研究报告.pdf',
              image:        { type: 'jpeg', quality: 1 },
              html2canvas:  { 
                  scale: 2, 
                  useCORS: true,
                  windowWidth: 1000, // Force canvas to render at exact width
                  x: 0,
                  y: 0,
                  scrollX: 0,
                  scrollY: 0
              },
              jsPDF:        { unit: 'px', format: [1000, 1414], orientation: 'portrait' } // Use custom format matching width
            };
            
            html2pdf().set(opt).from(element).save().then(() => {
                // Restore original styles
                element.style.width = originalWidth;
                element.style.maxWidth = originalMaxWidth;
                element.style.padding = originalPadding;
                element.style.margin = originalMargin;
            });
        });
    }

    document.getElementById('regenerateReportBtn').addEventListener('click', () => generateReport(true));
    
    // --- Concept Explain ---
    // Cache for storing already explained concepts
    window.conceptCache = window.conceptCache || {};

    document.getElementById('reportHtmlContainer').addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('concept-link')) {
            const concept = e.target.textContent;
            explainConcept(concept);
        }
    });

    const backToReportBtn = document.getElementById('backToReportBtn');
    if (backToReportBtn) {
        backToReportBtn.addEventListener('click', () => {
            switchStage('reportStage');
        });
    }

    async function explainConcept(concept) {
        // Create tab if not exists
        let tab = document.querySelector('.stage-tab[data-target="conceptStage"]');
        if (!tab) {
            const stageTabs = document.getElementById('stageTabs');
            tab = document.createElement('div');
            tab.className = 'stage-tab';
            tab.setAttribute('data-target', 'conceptStage');
            tab.innerHTML = `
                <i class="fa-solid fa-lightbulb"></i> 概念解析
                <div class="stage-tab-close" onclick="closeStage(event, 'conceptStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
            `;
            tab.onclick = () => switchStage('conceptStage');
            stageTabs.appendChild(tab);
        }
        
        switchStage('conceptStage');
        
        const loader = document.getElementById('conceptLoader');
        const container = document.getElementById('conceptHtmlContainer');
        
        // Check cache first
        if (window.conceptCache[concept]) {
            container.innerHTML = window.conceptCache[concept];
            loader.style.display = 'none';
            return;
        }
        
        loader.style.display = 'block';
        container.innerHTML = '';

        try {
            const response = await fetch('/api/mindmapnode/explain_concept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept: concept })
            });

            if (!response.ok) throw new Error('网络请求失败');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            loader.style.display = 'none';

            let accumulatedHtml = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') break;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.error) {
                                accumulatedHtml += `<div style="color: red;">${data.error}</div>`;
                            } else if (data.content) {
                                accumulatedHtml += data.content;
                            }
                            container.innerHTML = accumulatedHtml;
                            
                            const conceptStageContainer = document.querySelector('#conceptStage > div:nth-child(2)');
                            if (conceptStageContainer) conceptStageContainer.scrollTop = conceptStageContainer.scrollHeight;
                        } catch (e) {
                            console.error('SSE Parse error in concept', e, dataStr);
                        }
                    }
                }
            }
            
            // Save to cache before generating images (images will update cache when done)
            window.conceptCache[concept] = container.innerHTML;
            
            // Generate images for concept
            const aiImages = container.querySelectorAll('ai-image');
            let imagesProcessed = 0;
            const totalImages = aiImages.length;
            
            if (totalImages === 0) {
                window.conceptCache[concept] = container.innerHTML;
            }
            
            aiImages.forEach(async (el) => {
                const prompt = el.getAttribute('prompt');
                if (!prompt) {
                    imagesProcessed++;
                    return;
                }
                
                el.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: rgba(234, 179, 8, 0.05); border: 1px dashed rgba(234, 179, 8, 0.3); border-radius: 12px; margin: 1.5rem 0;">
                        <i class="fa-solid fa-palette fa-bounce" style="color: #eab308; font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                        <div style="color: #ca8a04; font-size: 0.9rem; font-weight: 600;">AI 正在绘制科普插图...</div>
                    </div>
                `;
                
                try {
                    const res = await fetch('/api/mindmapnode/generate_image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: prompt })
                    });
                    const data = await res.json();
                    if (data.status === 'success' && data.url) {
                        const proxyUrl = `/api/mindmapnode/proxy_image?url=${encodeURIComponent(data.url)}`;
                        el.outerHTML = `
                            <figure style="margin: 2rem 0; text-align: center;">
                                <img src="${proxyUrl}" crossorigin="anonymous" style="max-width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);" alt="${prompt}" />
                            </figure>
                        `;
                    } else {
                        el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red;">图片生成失败</div>`;
                    }
                } catch (e) {
                    el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red;">图片生成失败: ${e.message}</div>`;
                } finally {
                    imagesProcessed++;
                    // Update cache after all images are processed
                    if (imagesProcessed === totalImages) {
                        window.conceptCache[concept] = container.innerHTML;
                    }
                }
            });
            
        } catch (err) {
            alert('概念解析失败: ' + err.message);
        } finally {
            loader.style.display = 'none';
        }
    }
    
    // --- Middle Panel: Chat Stream ---
    async function handleChatSend() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Hide empty state
        if (chatEmptyState) chatEmptyState.style.display = 'none';
        
        // Append user message
        appendChatMessage(message, 'user');
        chatInput.value = '';
        
        // Create AI message container
        const aiMessageDiv = appendChatMessage('', 'ai');
        const contentDiv = aiMessageDiv.querySelector('.message-bubble');
        contentDiv.innerHTML = '<i class="fa-solid fa-ellipsis fa-fade"></i> 正在思考...';
        
        try {
            const response = await fetch('/api/mindmapnode/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            
            if (!response.ok) throw new Error('网络请求失败');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            contentDiv.innerHTML = ''; // Clear loading
            
            let accumulatedText = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') break;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.error) {
                                accumulatedText += `\n<span style="color:#ef4444">${data.error}</span>`;
                            } else if (data.content) {
                                accumulatedText += data.content;
                            }
                            
                            // Render with marked.js
                            if (typeof marked !== 'undefined') {
                                // For AI messages, use markdown-body class
                                contentDiv.className = 'message-bubble markdown-body';
                                contentDiv.innerHTML = marked.parse(accumulatedText);
                            } else {
                                contentDiv.innerHTML = accumulatedText.replace(/\n/g, '<br>');
                            }
                            
                            chatContent.scrollTop = chatContent.scrollHeight;
                        } catch (e) {
                            console.error('SSE Parse error', e, dataStr);
                        }
                    }
                }
            }
        } catch (err) {
            contentDiv.innerHTML = `<span style="color:#ef4444">发生错误: ${err.message}</span>`;
        }
    }
    
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', handleChatSend);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSend();
        });
    }
    
    // --- Fullscreen and Split View ---
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    let isFullscreen = false;
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            isFullscreen = !isFullscreen;
            if (isFullscreen) {
                document.body.classList.add('fullscreen-active');
                fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
                fullscreenBtn.title = '还原';
            } else {
                document.body.classList.remove('fullscreen-active');
                fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
                fullscreenBtn.title = '全屏';
            }
            setTimeout(() => {
                if (myChart) myChart.resize();
            }, 300);
        });
    }

    window.isSplitView = false;
    const splitViewBtn = document.getElementById('splitViewBtn');
    if (splitViewBtn) {
        splitViewBtn.addEventListener('click', () => {
            window.isSplitView = !window.isSplitView;
            
            if (window.isSplitView) {
                splitViewBtn.innerHTML = '<i class="fa-solid fa-columns"></i> 关闭并排';
                
                // Show PDF preview if it exists
                const pdfStage = document.getElementById('pdfPreviewStage');
                if (pdfStage) {
                    pdfStage.style.display = 'flex';
                    // Check and create PDF Preview Tab if not exists
                    let pdfTab = document.querySelector('.stage-tab[data-target="pdfPreviewStage"]');
                    if (!pdfTab) {
                        const stageTabs = document.getElementById('stageTabs');
                        pdfTab = document.createElement('div');
                        pdfTab.className = 'stage-tab';
                        pdfTab.setAttribute('data-target', 'pdfPreviewStage');
                        pdfTab.innerHTML = `
                            <i class="fa-solid fa-file-lines"></i> <span class="tab-label">文档预览</span>
                            <div class="stage-tab-close" onclick="closeStage(event, 'pdfPreviewStage')"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></div>
                        `;
                        pdfTab.onclick = () => switchStage('pdfPreviewStage');
                        stageTabs.appendChild(pdfTab);
                    }
                    pdfTab.classList.add('active');
                }
            } else {
                splitViewBtn.innerHTML = '<i class="fa-solid fa-columns"></i> 开启并排PDF';
                switchStage('mindmapStage'); // Revert back to mindmap only
            }
            
            setTimeout(() => {
                if (myChart) myChart.resize();
            }, 300);
        });
    }

    function appendChatMessage(text, role) {
        const div = document.createElement('div');
        div.className = `chat-message ${role}-message`;
        
        const avatarIcon = role === 'user' ? 'fa-user' : 'fa-brain';
        
        div.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid ${avatarIcon}"></i>
            </div>
            <div class="message-bubble">
                ${text.replace(/\n/g, '<br>')}
            </div>
        `;
        
        chatContent.appendChild(div);
        chatContent.scrollTop = chatContent.scrollHeight;
        return div;
    }

    // --- Flashcard Logic ---
    const generateFlashcardsBtn = document.getElementById('generateFlashcardsBtn');
    const flashcardConfigForm = document.getElementById('flashcardConfigForm');
    const flashcardLoader = document.getElementById('flashcardLoader');
    const flashcardDisplayArea = document.getElementById('flashcardDisplayArea');
    const newFlashcardBtn = document.getElementById('newFlashcardBtn');
    
    let currentFlashcards = [];
    let currentFcIndex = 0;

    if (generateFlashcardsBtn) {
        generateFlashcardsBtn.addEventListener('click', async () => {
            if (sourceCount === 0) {
                alert('请先添加知识来源！');
                return;
            }

            const count = parseInt(document.getElementById('fcCount').value) || 5;
            const difficulty = document.getElementById('fcDifficulty').value;
            const extra = document.getElementById('fcExtra').value;

            flashcardConfigForm.style.display = 'none';
            flashcardLoader.style.display = 'block';

            try {
                const response = await fetch('/api/mindmapnode/generate_flashcards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ count, difficulty, extra })
                });
                
                const data = await response.json();
                
                if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
                    currentFlashcards = data.data;
                    currentFcIndex = 0;
                    
                    flashcardLoader.style.display = 'none';
                    flashcardDisplayArea.style.display = 'flex';
                    if (newFlashcardBtn) newFlashcardBtn.style.display = 'block';
                    
                    renderCurrentFlashcard();
                } else {
                    throw new Error(data.error || '生成失败，返回数据为空');
                }
            } catch (err) {
                alert('请求失败: ' + err.message);
                flashcardLoader.style.display = 'none';
                flashcardConfigForm.style.display = 'block';
            }
        });
    }

    if (newFlashcardBtn) {
        newFlashcardBtn.addEventListener('click', () => {
            flashcardDisplayArea.style.display = 'none';
            newFlashcardBtn.style.display = 'none';
            flashcardConfigForm.style.display = 'block';
        });
    }

    function renderCurrentFlashcard() {
        if (!currentFlashcards || currentFlashcards.length === 0) return;
        
        const card = currentFlashcards[currentFcIndex];
        const frontContent = document.getElementById('fcFrontContent');
        const backContent = document.getElementById('fcBackContent');
        const progressFill = document.getElementById('fcProgressFill');
        const progressText = document.getElementById('fcProgressText');
        const prevBtn = document.getElementById('fcPrevBtn');
        const nextBtn = document.getElementById('fcNextBtn');
        const flipCard = document.getElementById('currentFlashcard');
        
        // Reset flip state before changing content
        flipCard.classList.remove('flipped');
        
        // Wait for flip animation to finish before updating text (if it was flipped)
        setTimeout(() => {
            frontContent.innerHTML = card.front;
            backContent.innerHTML = card.back;
            
            progressText.textContent = `${currentFcIndex + 1} / ${currentFlashcards.length}`;
            progressFill.style.width = `${((currentFcIndex + 1) / currentFlashcards.length) * 100}%`;
            
            prevBtn.disabled = currentFcIndex === 0;
            
            if (currentFcIndex === currentFlashcards.length - 1) {
                nextBtn.innerHTML = '<i class="fa-solid fa-check"></i> 完成复习';
            } else {
                nextBtn.innerHTML = '下一张 <i class="fa-solid fa-chevron-right"></i>';
            }
        }, 150); // slight delay for visual smoothness
    }

    const currentFlashcard = document.getElementById('currentFlashcard');
    if (currentFlashcard) {
        currentFlashcard.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    }

    const fcPrevBtn = document.getElementById('fcPrevBtn');
    const fcNextBtn = document.getElementById('fcNextBtn');

    if (fcPrevBtn) {
        fcPrevBtn.addEventListener('click', () => {
            if (currentFcIndex > 0) {
                currentFcIndex--;
                renderCurrentFlashcard();
            }
        });
    }

    if (fcNextBtn) {
        fcNextBtn.addEventListener('click', () => {
            if (currentFcIndex < currentFlashcards.length - 1) {
                currentFcIndex++;
                renderCurrentFlashcard();
            } else {
                // Done
                alert('太棒了！您已完成本组闪卡的复习。');
            }
        });
    }

    // --- Quiz Logic ---
    const generateQuizBtn = document.getElementById('generateQuizBtn');
    const quizConfigForm = document.getElementById('quizConfigForm');
    const quizLoader = document.getElementById('quizLoader');
    const quizDisplayArea = document.getElementById('quizDisplayArea');
    const quizQuestionsContainer = document.getElementById('quizQuestionsContainer');
    const quizSubmitBtn = document.getElementById('quizSubmitBtn');
    const newQuizBtn = document.getElementById('newQuizBtn');
    const quizScoreDisplay = document.getElementById('quizScoreDisplay');
    const quizScoreValue = document.getElementById('quizScoreValue');
    
    let currentQuizData = [];
    let currentQuizMode = 'batch'; // 'instant' or 'batch'
    let userAnswers = {};

    if (generateQuizBtn) {
        generateQuizBtn.addEventListener('click', async () => {
            if (sourceCount === 0) {
                alert('请先添加知识来源！');
                return;
            }

            const singleCount = parseInt(document.getElementById('quizSingleCount').value) || 0;
            const multiCount = parseInt(document.getElementById('quizMultiCount').value) || 0;
            const fillCount = parseInt(document.getElementById('quizFillCount').value) || 0;
            const essayCount = parseInt(document.getElementById('quizEssayCount').value) || 0;
            currentQuizMode = document.getElementById('quizMode').value;

            if (singleCount + multiCount + fillCount + essayCount === 0) {
                alert('题目总数不能为0！');
                return;
            }

            quizConfigForm.style.display = 'none';
            quizLoader.style.display = 'block';

            try {
                const response = await fetch('/api/mindmapnode/generate_quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        single_count: singleCount,
                        multi_count: multiCount,
                        fill_count: fillCount,
                        essay_count: essayCount
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.status === 'success' && data.data && data.data.length > 0) {
                    currentQuizData = data.data;
                    userAnswers = {};
                    
                    quizLoader.style.display = 'none';
                    quizDisplayArea.style.display = 'flex';
                    if (newQuizBtn) newQuizBtn.style.display = 'block';
                    
                    renderQuiz();
                } else {
                    throw new Error(data.error || '生成测验失败');
                }
            } catch (err) {
                alert('请求失败: ' + err.message);
                quizLoader.style.display = 'none';
                quizConfigForm.style.display = 'block';
            }
        });
    }

    if (newQuizBtn) {
        newQuizBtn.addEventListener('click', () => {
            quizDisplayArea.style.display = 'none';
            newQuizBtn.style.display = 'none';
            quizConfigForm.style.display = 'block';
            quizScoreDisplay.style.display = 'none';
            quizSubmitBtn.style.display = 'none';
        });
    }

    function renderQuiz() {
        quizQuestionsContainer.innerHTML = '';
        quizScoreDisplay.style.display = 'none';
        
        let totalScore = 0;
        currentQuizData.forEach((q, index) => {
            totalScore += q.score || 0;
            const qDiv = document.createElement('div');
            qDiv.className = 'quiz-question-card';
            qDiv.id = `qcard_${q.id}`;
            
            let typeLabel = '';
            if (q.type === 'single_choice') typeLabel = '单选题';
            else if (q.type === 'multiple_choice') typeLabel = '多选题';
            else if (q.type === 'fill_blanks') typeLabel = '填空题';
            else if (q.type === 'essay') typeLabel = '简答题';
            
            let inputHtml = '';
            if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                const isMulti = q.type === 'multiple_choice';
                const inputType = isMulti ? 'checkbox' : 'radio';
                if (q.options) {
                    q.options.forEach((opt, optIdx) => {
                        // Assume opt starts with "A. "
                        const val = opt.charAt(0);
                        inputHtml += `
                            <label class="quiz-option">
                                <input type="${inputType}" name="ans_${q.id}" value="${val}">
                                <span>${opt}</span>
                            </label>
                        `;
                    });
                }
            } else if (q.type === 'fill_blanks') {
                inputHtml = `<input type="text" class="quiz-text-input" placeholder="请输入答案，多个答案用逗号分隔" id="ans_${q.id}">`;
            } else if (q.type === 'essay') {
                inputHtml = `<textarea class="quiz-textarea" rows="4" placeholder="请输入您的回答" id="ans_${q.id}"></textarea>`;
            }

            const actionHtml = currentQuizMode === 'instant' ? 
                `<button class="secondary-btn instant-submit-btn" onclick="evaluateSingleQuestion('${q.id}')">确认答案</button>` : '';

            qDiv.innerHTML = `
                <div class="quiz-q-header">
                    <span class="quiz-q-badge">${index + 1}</span>
                    <span class="quiz-q-type">${typeLabel}</span>
                    <span class="quiz-q-score">(${q.score}分)</span>
                </div>
                <div class="quiz-q-body">${q.question.replace(/\n/g, '<br>')}</div>
                <div class="quiz-q-inputs" id="inputs_${q.id}">
                    ${inputHtml}
                </div>
                ${actionHtml}
                <div class="quiz-analysis" id="analysis_${q.id}" style="display: none;">
                    <div class="quiz-analysis-header"><i class="fa-solid fa-lightbulb" style="color:#eab308"></i> 解析</div>
                    <div class="quiz-correct-ans" id="correct_ans_${q.id}">正确答案：${Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}</div>
                    <div class="quiz-analysis-content">${q.analysis}</div>
                    
                    <div class="quiz-qa-section">
                        <div class="quiz-qa-title"><i class="fa-solid fa-robot"></i> AI 智能答疑 (联网搜索支持)</div>
                        <div class="quiz-qa-chat" id="qa_chat_${q.id}"></div>
                        <div class="quiz-qa-input-box">
                            <input type="text" id="qa_input_${q.id}" placeholder="对这道题还有疑问？输入问题问AI...">
                            <button onclick="askQuizAI('${q.id}')"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            `;
            quizQuestionsContainer.appendChild(qDiv);
        });

        document.getElementById('quizMetaInfo').textContent = `共 ${currentQuizData.length} 题 | 总分: ${totalScore}分`;
        
        if (currentQuizMode === 'batch') {
            quizSubmitBtn.style.display = 'block';
        } else {
            quizSubmitBtn.style.display = 'none';
        }
    }

    // Extract user answer for a specific question
    function getUserAnswer(qId) {
        const q = currentQuizData.find(item => item.id === qId);
        if (!q) return null;
        
        if (q.type === 'single_choice') {
            const el = document.querySelector(`input[name="ans_${q.id}"]:checked`);
            return el ? el.value : null;
        } else if (q.type === 'multiple_choice') {
            const els = document.querySelectorAll(`input[name="ans_${q.id}"]:checked`);
            return Array.from(els).map(el => el.value);
        } else {
            const el = document.getElementById(`ans_${q.id}`);
            return el ? el.value.trim() : '';
        }
    }

    // Evaluate a single question (used in instant mode) - Kept for reference but disabled in UI
    window.evaluateSingleQuestion = function(qId) {
        const q = currentQuizData.find(item => item.id === qId);
        const ans = getUserAnswer(qId);
        
        let isCorrect = false;
        if (q.type === 'single_choice') {
            isCorrect = ans === q.answer;
        } else if (q.type === 'multiple_choice') {
            const correctArr = Array.isArray(q.answer) ? q.answer : [q.answer];
            isCorrect = ans && ans.length === correctArr.length && ans.every(v => correctArr.includes(v));
        } else {
            // Fuzzy match for fill_blanks and essay
            isCorrect = ans && ans.length > 0; // Simplified for now
        }

        const qCard = document.getElementById(`qcard_${q.id}`);
        const inputsDiv = document.getElementById(`inputs_${q.id}`);
        
        if (isCorrect) {
            qCard.classList.add('correct');
        } else {
            qCard.classList.add('wrong');
        }
        
        // Disable inputs
        const inputs = inputsDiv.querySelectorAll('input, textarea');
        inputs.forEach(inp => inp.disabled = true);
        
        // Hide submit button for this question
        const btn = qCard.querySelector('.instant-submit-btn');
        if (btn) btn.style.display = 'none';

        // Show analysis
        document.getElementById(`analysis_${q.id}`).style.display = 'block';
    };

    // Evaluate all questions (batch mode)
    if (quizSubmitBtn) {
        quizSubmitBtn.addEventListener('click', () => {
            let totalEarned = 0;
            
            currentQuizData.forEach(q => {
                const ans = getUserAnswer(q.id);
                let isCorrect = false;
                
                if (q.type === 'single_choice') {
                    isCorrect = ans === q.answer;
                } else if (q.type === 'multiple_choice') {
                    const correctArr = Array.isArray(q.answer) ? q.answer : [q.answer];
                    isCorrect = ans && ans.length === correctArr.length && ans.every(v => correctArr.includes(v));
                } else {
                    isCorrect = ans && ans.length > 0; // Simplified
                }
                
                if (isCorrect) totalEarned += (q.score || 0);
                
                const qCard = document.getElementById(`qcard_${q.id}`);
                const inputsDiv = document.getElementById(`inputs_${q.id}`);
                
                if (isCorrect) qCard.classList.add('correct');
                else qCard.classList.add('wrong');
                
                inputsDiv.querySelectorAll('input, textarea').forEach(inp => inp.disabled = true);
                document.getElementById(`analysis_${q.id}`).style.display = 'block';
            });
            
            quizScoreValue.textContent = totalEarned;
            quizScoreDisplay.style.display = 'block';
            quizSubmitBtn.style.display = 'none';
            
            // Scroll to top to see score
            document.querySelector('#quizStage > div:nth-child(2)').scrollTo({top: 0, behavior: 'smooth'});
        });
    }

    // AI QA Logic for Quiz
    window.askQuizAI = async function(qId) {
        const inputEl = document.getElementById(`qa_input_${qId}`);
        const chatBox = document.getElementById(`qa_chat_${qId}`);
        const query = inputEl.value.trim();
        
        if (!query) return;
        inputEl.value = '';
        
        const q = currentQuizData.find(item => item.id === qId);
        
        // Append user msg
        chatBox.innerHTML += `<div class="qa-msg user-msg">${query}</div>`;
        
        // Append AI loading msg
        const aiMsgId = `qa_aimsg_${Date.now()}`;
        chatBox.innerHTML += `<div class="qa-msg ai-msg markdown-body" id="${aiMsgId}"><i class="fa-solid fa-spinner fa-spin"></i> 正在检索知识并解答...</div>`;
        
        // Scroll to bottom of chat
        chatBox.scrollTop = chatBox.scrollHeight;
        
        try {
            const response = await fetch('/api/mindmapnode/quiz_qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q.question,
                    analysis: q.analysis,
                    query: query
                })
            });
            
            if (!response.ok) throw new Error('网络请求失败');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const aiMsgEl = document.getElementById(aiMsgId);
            aiMsgEl.innerHTML = '';
            let accumulatedText = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') break;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.error) {
                                accumulatedText += `<span style="color:red">${data.error}</span>`;
                            } else if (data.content) {
                                accumulatedText += data.content;
                            }
                            
                            if (typeof marked !== 'undefined') {
                                aiMsgEl.innerHTML = marked.parse(accumulatedText);
                            } else {
                                aiMsgEl.innerHTML = accumulatedText.replace(/\n/g, '<br>');
                            }
                            chatBox.scrollTop = chatBox.scrollHeight;
                        } catch (e) {
                            console.error('SSE Parse error', e);
                        }
                    }
                }
            }
        } catch (err) {
            document.getElementById(aiMsgId).innerHTML = `<span style="color:red">请求失败: ${err.message}</span>`;
        }
    };

    // --- Group Discussion Logic ---
    const initDiscussionBtn = document.getElementById('initDiscussionBtn');
    const discussionConfigForm = document.getElementById('discussionConfigForm');
    const discussionLoader = document.getElementById('discussionLoader');
    const discussionChatArea = document.getElementById('discussionChatArea');
    const newDiscussionBtn = document.getElementById('newDiscussionBtn');
    const discussionAgentList = document.getElementById('discussionAgentList');
    const discussionMessages = document.getElementById('discussionMessages');
    const discussionInput = document.getElementById('discussionInput');
    const discussionSendBtn = document.getElementById('discussionSendBtn');
    
    let discussionAgents = [];
    let discussionAutoTrigger;

    window.showAgentPrompt = function(idx) {
        const agent = discussionAgents[idx];
        if (!agent) return;
        document.getElementById('modalAgentAvatar').src = agent.avatar;
        document.getElementById('modalAgentName').textContent = agent.name;
        document.getElementById('modalAgentPersonality').textContent = agent.personality;
        document.getElementById('modalAgentPrompt').textContent = agent.system_prompt;
        document.getElementById('agentPromptModal').style.display = 'flex';
    };

    if (initDiscussionBtn) {
        initDiscussionBtn.addEventListener('click', async () => {
            if (sourceCount === 0) {
                alert('请先添加知识来源！');
                return;
            }

            const count = document.getElementById('discussionCount').value;
            
            discussionConfigForm.style.display = 'none';
            discussionLoader.style.display = 'block';

            try {
                const response = await fetch('/api/mindmapnode/init_discussion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ count: count })
                });
                
                const data = await response.json();
                
                if (response.ok && data.status === 'success') {
                    discussionAgents = data.data;
                    
                    // Render agent list
                    discussionAgentList.innerHTML = '';
                    discussionAgents.forEach((agent, idx) => {
                        discussionAgentList.innerHTML += `
                            <div class="discussion-agent-avatar" onclick="showAgentPrompt(${idx})">
                                <img src="${agent.avatar}" alt="${agent.name}">
                                <span>${agent.name}</span>
                            </div>
                        `;
                    });
                    
                    discussionMessages.innerHTML = '';
                    
                    discussionLoader.style.display = 'none';
                    discussionChatArea.style.display = 'flex';
                    newDiscussionBtn.style.display = 'block';
                    
                    // Start pseudo-proactive loop
                    startDiscussionTrigger();
                    
                    // Trigger first greeting
                    appendDiscussionMsg("系统", "ai", "同学们已加入群聊，大家可以开始讨论了！");
                    sendDiscussionMessage("", true);
                } else {
                    throw new Error(data.error || '初始化失败');
                }
            } catch (err) {
                alert('请求失败: ' + err.message);
                discussionLoader.style.display = 'none';
                discussionConfigForm.style.display = 'block';
            }
        });
    }

    if (newDiscussionBtn) {
        newDiscussionBtn.addEventListener('click', () => {
            stopDiscussionTrigger();
            discussionChatArea.style.display = 'none';
            newDiscussionBtn.style.display = 'none';
            discussionConfigForm.style.display = 'block';
        });
    }

        // Initial function definition is completely replaced by the new one above
        // We need to delete the old appendDiscussionMsg definition to prevent conflicts


    async function sendDiscussionMessage(msg, isTrigger = false) {
        stopDiscussionTrigger(); // pause trigger while waiting
        
        if (msg) {
            appendDiscussionMsg("我", "user", msg);
        }
        
        // 如果是伪随机触发，我们随机挑选一位同学来发言，而不是所有人
        let triggerAgentName = null;
        if (isTrigger && discussionAgents && discussionAgents.length > 0) {
            const randomAgent = discussionAgents[Math.floor(Math.random() * discussionAgents.length)];
            triggerAgentName = randomAgent.name;
        }
        
        const loadingId = 'disc_loading_' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'disc-msg-container ai';
        loadingDiv.innerHTML = `
            <div class="disc-msg-avatar"><img src="https://ui-avatars.com/api/?name=AI&background=e2e8f0&color=64748b"></div>
            <div class="disc-msg-bubble" style="background:transparent; border:none; box-shadow:none; padding: 0.5rem;">
                <span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-ellipsis fa-fade fa-xl"></i> 有人正在输入...</span>
            </div>
        `;
        discussionMessages.appendChild(loadingDiv);
        discussionMessages.scrollTop = discussionMessages.scrollHeight;
        
        try {
            const response = await fetch('/api/mindmapnode/discussion_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: msg, 
                    is_trigger: isTrigger,
                    trigger_agent_name: triggerAgentName
                })
            });
            
            const data = await response.json();
            const loaderEl = document.getElementById(loadingId);
            if (loaderEl) loaderEl.remove();
            
            if (response.ok && data.status === 'success') {
                const msgs = data.data;
                for (let i = 0; i < msgs.length; i++) {
                    await new Promise(r => setTimeout(r, 800)); // Simulate typing delay
                    // Replace <br> safely allowing img tags to render
                    const contentHtml = msgs[i].content.replace(/\n/g, '<br>');
                    appendDiscussionMsg(msgs[i].name, "ai", contentHtml, true);
                }
                startDiscussionTrigger(); // resume trigger only on success
            } else {
                appendDiscussionMsg("系统", "ai", `<span style="color:red">请求失败: ${data.error}</span>`);
                // 如果遇到未初始化错误，强制退回到配置页面
                if (data.error && data.error.includes("未初始化讨论组")) {
                    setTimeout(() => {
                        discussionChatArea.style.display = 'none';
                        newDiscussionBtn.style.display = 'none';
                        discussionConfigForm.style.display = 'block';
                    }, 2000);
                }
            }
        } catch (err) {
            const loaderEl = document.getElementById(loadingId);
            if (loaderEl) loaderEl.remove();
            appendDiscussionMsg("系统", "ai", `<span style="color:red">请求失败: ${err.message}</span>`);
        }
    }

    // 更新 appendDiscussionMsg 允许原生 HTML 渲染（为了显示表情包）
    function appendDiscussionMsg(name, role, content, isHtml = false) {
        const div = document.createElement('div');
        div.className = `disc-msg-container ${role}`;
        
        let avatarHtml = '';
        let agentIdx = -1;
        
        if (role === 'user') {
            avatarHtml = `<div class="disc-msg-avatar"><img src="https://ui-avatars.com/api/?name=User&background=4f46e5&color=fff"></div>`;
        } else {
            const agent = discussionAgents.find(a => a.name === name);
            if (agent) {
                agentIdx = discussionAgents.indexOf(agent);
                avatarHtml = `<div class="disc-msg-avatar" onclick="showAgentPrompt(${agentIdx})"><img src="${agent.avatar}"></div>`;
            } else {
                avatarHtml = `<div class="disc-msg-avatar"><img src="https://ui-avatars.com/api/?name=${name}&background=a855f7&color=fff"></div>`;
            }
        }
        
        const displayContent = isHtml ? content : content.replace(/\n/g, '<br>');
        
        div.innerHTML = `
            ${avatarHtml}
            <div class="disc-msg-bubble">
                <div class="disc-msg-name">${name}</div>
                <div class="disc-msg-content">${displayContent}</div>
            </div>
        `;
        discussionMessages.appendChild(div);
        discussionMessages.scrollTop = discussionMessages.scrollHeight;
    }

    if (discussionSendBtn) {
        discussionSendBtn.addEventListener('click', () => {
            const msg = discussionInput.value.trim();
            if (msg) {
                discussionInput.value = '';
                sendDiscussionMessage(msg, false);
            }
        });
    }

    if (discussionInput) {
        discussionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const msg = discussionInput.value.trim();
                if (msg) {
                    discussionInput.value = '';
                    sendDiscussionMessage(msg, false);
                }
            }
        });
    }

    function startDiscussionTrigger() {
        if (discussionAutoTrigger) clearInterval(discussionAutoTrigger);
        // Random trigger between 15s and 25s
        const delay = Math.floor(Math.random() * 10000) + 15000;
        discussionAutoTrigger = setTimeout(() => {
            sendDiscussionMessage("", true);
        }, delay);
    }
    
    function stopDiscussionTrigger() {
        if (discussionAutoTrigger) {
            clearTimeout(discussionAutoTrigger);
            discussionAutoTrigger = null;
        }
    }

    // --- Classroom Logic ---
    const generateClassBtn = document.getElementById('generateClassBtn');
    const classroomConfigForm = document.getElementById('classroomConfigForm');
    const classroomLoader = document.getElementById('classroomLoader');
    const classroomDisplayArea = document.getElementById('classroomDisplayArea');
    const newClassroomBtn = document.getElementById('newClassroomBtn');
    const classProgressText = document.getElementById('classProgressText');
    const classPrevBtn = document.getElementById('classPrevBtn');
    const classNextBtn = document.getElementById('classNextBtn');
    const classPlayPauseBtn = document.getElementById('classPlayPauseBtn');
    const pptSlideContent = document.getElementById('pptSlideContent');
    const teacherSubtitle = document.getElementById('teacherSubtitle');
    const classAudioPlayer = document.getElementById('classAudioPlayer');
    const audioVisualizer = document.getElementById('audioVisualizer');
    
    let currentLesson = null;
    let currentSlideIndex = 0;
    let isPlaying = false;
    
    // 初始化可视化条
    for(let i=0; i<10; i++) {
        audioVisualizer.innerHTML += '<div class="audio-bar" style="animation-play-state: paused;"></div>';
    }

    if (generateClassBtn) {
        generateClassBtn.addEventListener('click', async () => {
            if (sourceCount === 0) {
                alert('请先添加知识来源！');
                return;
            }

            const topic = document.getElementById('classTopic').value;
            const style = document.getElementById('classStyle').value;

            classroomConfigForm.style.display = 'none';
            classroomLoader.style.display = 'block';

            try {
                const response = await fetch('/api/mindmapnode/generate_classroom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, style })
                });
                
                const data = await response.json();
                
                if (response.ok && data.status === 'success' && data.data && data.data.slides) {
                    currentLesson = data.data;
                    currentSlideIndex = 0;
                    
                    classroomLoader.style.display = 'none';
                    classroomDisplayArea.style.display = 'flex';
                    newClassroomBtn.style.display = 'block';
                    
                    renderSlide(currentSlideIndex);
                } else {
                    throw new Error(data.error || '生成课程失败');
                }
            } catch (err) {
                alert('请求失败: ' + err.message);
                classroomLoader.style.display = 'none';
                classroomConfigForm.style.display = 'block';
            }
        });
    }

    if (newClassroomBtn) {
        newClassroomBtn.addEventListener('click', () => {
            classAudioPlayer.pause();
            isPlaying = false;
            updateVisualizer(false);
            classroomDisplayArea.style.display = 'none';
            newClassroomBtn.style.display = 'none';
            classroomConfigForm.style.display = 'block';
        });
    }

    async function renderSlide(index) {
        if (!currentLesson || !currentLesson.slides || index < 0 || index >= currentLesson.slides.length) return;
        
        const slide = currentLesson.slides[index];
        classProgressText.textContent = `第 ${index + 1} / ${currentLesson.slides.length} 页`;
        
        classPrevBtn.disabled = index === 0;
        classNextBtn.disabled = index === currentLesson.slides.length - 1;
        
        // 渲染 PPT HTML (处理潜在的图片生成标签)
        let htmlContent = slide.html_content;
        pptSlideContent.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> 正在渲染幻灯片...</div>';
        
        // 解析 <img image_keyword="...">
        const imgRegex = /<img\s+image_keyword="([^"]+)">/g;
        let match;
        while ((match = imgRegex.exec(htmlContent)) !== null) {
            const keyword = match[1];
            // 我们在前端构造详细的 prompt 避免后端 JSON 截断
            const detailedPrompt = `横版信息图表风格图像，关于主题：${keyword}，高质量，教育类插图，色彩丰富，排版精美`;
            try {
                const imgRes = await fetch('/api/mindmapnode/proxy_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: detailedPrompt, size: "16:9" })
                });
                const imgData = await imgRes.json();
                if (imgData.status === 'success') {
                    htmlContent = htmlContent.replace(match[0], `<img src="${imgData.image_url}" alt="${keyword}">`);
                } else {
                    htmlContent = htmlContent.replace(match[0], `<div style="padding:1rem; background:#fee2e2; color:#ef4444; border-radius:8px;">[图片生成失败]</div>`);
                }
            } catch (e) {
                htmlContent = htmlContent.replace(match[0], '');
            }
        }
        
        pptSlideContent.innerHTML = htmlContent;
        
        // 渲染并播放语音
        teacherSubtitle.textContent = slide.speech_text;
        playSlideAudio(slide.speech_text, index);
    }

    async function playSlideAudio(text, slideIndex) {
        classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        classPlayPauseBtn.disabled = true;
        updateVisualizer(false);
        classAudioPlayer.pause();
        
        try {
            // 检查缓存中是否已有该页的音频
            if (currentLesson.slides[slideIndex].audio_url) {
                classAudioPlayer.src = currentLesson.slides[slideIndex].audio_url;
            } else {
                // 异步请求当前页的语音
                const audioRes = await fetch('/api/mindmapnode/generate_audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });
                const audioData = await audioRes.json();
                if (audioData.status === 'success' && audioData.audio_url) {
                    currentLesson.slides[slideIndex].audio_url = audioData.audio_url; // 存入缓存
                    classAudioPlayer.src = audioData.audio_url;
                } else {
                    throw new Error("Failed to generate audio via API.");
                }
            }
        } catch (e) {
            console.warn("Fallback to Web Speech API:", e.message);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 1.0;
            
            utterance.onstart = () => {
                isPlaying = true;
                classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                classPlayPauseBtn.disabled = false;
                updateVisualizer(true);
            };
            utterance.onend = () => {
                handleAudioEnd();
            };
            window.speechSynthesis.cancel(); // clear queue
            window.speechSynthesis.speak(utterance);
            return; // 退出，因为我们使用了 Web API
        }
        
        // 如果使用 Audio 标签播放
        classAudioPlayer.onloadedmetadata = () => {
            classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            classPlayPauseBtn.disabled = false;
            
            classAudioPlayer.play().then(() => {
                isPlaying = true;
                updateVisualizer(true);
            }).catch(e => {
                console.error("Audio playback failed:", e);
                // 自动播放可能被浏览器拦截，恢复UI状态
                classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                isPlaying = false;
                updateVisualizer(false);
            });
        };
        
        classAudioPlayer.onended = () => {
            handleAudioEnd();
        };
    }
    
    function handleAudioEnd() {
        isPlaying = false;
        classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        updateVisualizer(false);
        
        // 自动翻页逻辑
        if (currentSlideIndex < currentLesson.slides.length - 1) {
            setTimeout(() => {
                currentSlideIndex++;
                renderSlide(currentSlideIndex);
            }, 1500); // 讲完停顿 1.5 秒后翻页
        } else {
            teacherSubtitle.innerHTML += ' <span style="color:var(--primary); font-weight:bold;">(课程结束，同学们下课！)</span>';
        }
    }

    function updateVisualizer(active) {
        const bars = audioVisualizer.querySelectorAll('.audio-bar');
        bars.forEach(bar => {
            bar.style.animationPlayState = active ? 'running' : 'paused';
            if (!active) bar.style.height = '4px';
        });
    }

    if (classPlayPauseBtn) {
        classPlayPauseBtn.addEventListener('click', () => {
            if (isPlaying) {
                classAudioPlayer.pause();
                window.speechSynthesis.pause();
                isPlaying = false;
                classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                updateVisualizer(false);
            } else {
                classAudioPlayer.play();
                window.speechSynthesis.resume();
                isPlaying = true;
                classPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                updateVisualizer(true);
            }
        });
    }

    if (classPrevBtn) {
        classPrevBtn.addEventListener('click', () => {
            if (currentSlideIndex > 0) {
                window.speechSynthesis.cancel();
                currentSlideIndex--;
                renderSlide(currentSlideIndex);
            }
        });
    }

    if (classNextBtn) {
        classNextBtn.addEventListener('click', () => {
            if (currentSlideIndex < currentLesson.slides.length - 1) {
                window.speechSynthesis.cancel();
                currentSlideIndex++;
                renderSlide(currentSlideIndex);
            }
        });
    }

    // PPT Fullscreen Logic
    const pptFullscreenBtn = document.getElementById('pptFullscreenBtn');
    const pptSlideContainer = document.getElementById('pptSlideContainer');
    
    if (pptFullscreenBtn && pptSlideContainer) {
        pptFullscreenBtn.addEventListener('click', () => {
            pptSlideContainer.classList.toggle('fullscreen');
            const icon = pptFullscreenBtn.querySelector('i');
            if (pptSlideContainer.classList.contains('fullscreen')) {
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
                pptFullscreenBtn.title = "退出全屏";
            } else {
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
                pptFullscreenBtn.title = "全屏演示";
            }
        });
        
        // Escape key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && pptSlideContainer.classList.contains('fullscreen')) {
                pptSlideContainer.classList.remove('fullscreen');
                const icon = pptFullscreenBtn.querySelector('i');
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
                pptFullscreenBtn.title = "全屏演示";
            }
        });
    }
});

// --- Save Notes to Knowledge Base ---
window.saveNotesToKnowledgeBase = async function() {
    try {
        const saveBtn = document.querySelector('.floating-action-btn');
        const originalContent = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 保存中...';
        saveBtn.disabled = true;

        // Collect all sources and parsed content
        
        // --- Core Idea: Capture the current DOM state of important elements ---
        const workspaceGrid = document.querySelector('.workspace-grid');
        let htmlSnapshot = '';
        if (workspaceGrid) {
            // Clone the grid to strip out interactive elements we don't want to save
            const clone = workspaceGrid.cloneNode(true);
            
            // Remove some purely UI elements that don't need to be in the snapshot
            const toRemove = clone.querySelectorAll('.stage-tab-close, .studio-footer, .message-input-area, .knowledge-upload-btn, .file-input, .concept-card');
            toRemove.forEach(el => el.remove());

            // Special fix: Remove dynamic classes that might hide elements by default when not in app context
            const dynamicHidden = clone.querySelectorAll('[style*="display: none"]');
            dynamicHidden.forEach(el => {
                // If it's the right panel or active stage, we might want to make sure it's visible if it was visible
                // Actually it's better to just leave inline styles as is since they represent the CURRENT state
            });
            
            // For inputs/textareas, we need to bake their current value into an attribute or text so it persists in innerHTML
            const inputs = workspaceGrid.querySelectorAll('input, textarea');
            const clonedInputs = clone.querySelectorAll('input, textarea');
            inputs.forEach((input, index) => {
                if (clonedInputs[index]) {
                    if (input.tagName === 'TEXTAREA') {
                        clonedInputs[index].textContent = input.value;
                    } else if (input.type === 'checkbox' || input.type === 'radio') {
                        if (input.checked) clonedInputs[index].setAttribute('checked', 'checked');
                    } else {
                        clonedInputs[index].setAttribute('value', input.value);
                    }
                }
            });
            
            htmlSnapshot = clone.outerHTML;
        }

        const notesData = {
            sources: Object.values(window.sourcesData || {}).map(s => ({ title: s.title, type: s.type, content: s.content })),
            chatHistory: Array.from(document.querySelectorAll('.message-bubble')).map(el => el.innerText).join('\n\n'),
            htmlSnapshot: htmlSnapshot
        };

        const response = await fetch('/api/mindmapnode/save_note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notesData)
        });

        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            alert('笔记及解析内容已成功保存至您的知识库！');
        } else {
            alert('保存失败: ' + (result.error || '未知错误'));
        }
        
        saveBtn.innerHTML = originalContent;
        saveBtn.disabled = false;
    } catch (err) {
        alert('请求失败: ' + err.message);
        const saveBtn = document.querySelector('.floating-action-btn');
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 保存笔记';
        saveBtn.disabled = false;
    }
};
