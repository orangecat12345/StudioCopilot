document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const landingView = document.getElementById('landingView');
    const chatView = document.getElementById('chatView');
    const knowledgeView = document.getElementById('knowledgeView');
    const socialView = document.getElementById('socialView');
    const analysisView = document.getElementById('analysisView');
    const settingsView = document.getElementById('settingsView');
    const journalView = document.getElementById('journalView');
    const superSearchView = document.getElementById('superSearchView');
    const aiMarketView = document.getElementById('aiMarketView');
    const aiStudioView = document.getElementById('aiStudioView');
    const pptBlogLabView = document.getElementById('pptBlogLabView');
    const myAppsView = document.getElementById('myAppsView');
    const appPlayerView = document.getElementById('appPlayerView');
    const learningQuestView = document.getElementById('learningQuestView');
    const memoryLabView = document.getElementById('memoryLabView');
    const userCenterView = document.getElementById('userCenterView');
    const views = {
        'ai': [landingView, chatView],
        'knowledge': [knowledgeView],
        'super-search': [superSearchView],
        'ai-market': [aiMarketView],
        'ai-studio': [aiStudioView],
        'ppt-blog-lab': [pptBlogLabView],
        'my-apps': [myAppsView],
        'app-player': [appPlayerView],
        'user-center': [userCenterView],
        'learning-quest': [learningQuestView],
        'memory-lab': [memoryLabView],
        'social': [socialView],
        'analysis': [analysisView],
        'settings': [settingsView],
        'journal': [journalView]
    };

    const chatContainer = document.getElementById('chatContainer');
    const discoveryGrid = document.getElementById('discoveryGrid');
    const discoverySection = document.getElementById('discoverySection');
    const heroSection = document.getElementById('heroSection');
    
    const landingInput = document.getElementById('landingInput');
    const landingSendBtn = document.getElementById('landingSendBtn');
    
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const thinkingToggleBtn = document.getElementById('thinkingToggleBtn');

    const scrollTrigger = document.getElementById('scrollTrigger');
    const backToTopBtn = document.getElementById('backToTopBtn');

    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const navItems = document.querySelectorAll('.nav-item');
    const userProfileEntry = document.getElementById('userProfileEntry');

    // KB Elements
    const saveCurrentCourseBtn = document.getElementById('saveCurrentCourseBtn');
    const refreshKnowledgeHubBtn = document.getElementById('refreshKnowledgeHubBtn');
    const knowledgeHubStatus = document.getElementById('knowledgeHubStatus');
    const favArticleTitleInput = document.getElementById('favArticleTitleInput');
    const favArticleUrlInput = document.getElementById('favArticleUrlInput');
    const favArticleSummaryInput = document.getElementById('favArticleSummaryInput');
    const saveFavArticleBtn = document.getElementById('saveFavArticleBtn');
    const knowledgeTabBtns = document.querySelectorAll('.knowledge-tab');
    const knowledgeHubMine = document.getElementById('knowledgeHubMine');
    const knowledgeHubNotes = document.getElementById('knowledgeHubNotes');
    const knowledgeHubFavorites = document.getElementById('knowledgeHubFavorites');
    const knowledgeHubPublic = document.getElementById('knowledgeHubPublic');
    const knowledgeHubFeatured = document.getElementById('knowledgeHubFeatured');
    const aiAppsGrid = document.getElementById('aiAppsGrid');
    const createAiAppBtn = document.getElementById('createAiAppBtn');
    const marketStats = document.getElementById('marketStats');
    const marketSearchInput = document.getElementById('marketSearchInput');
    const marketSortSelect = document.getElementById('marketSortSelect');
    const marketFeaturedOnlyBtn = document.getElementById('marketFeaturedOnlyBtn');
    const marketResetBtn = document.getElementById('marketResetBtn');
    const marketCategoryFilters = document.getElementById('marketCategoryFilters');
    const marketResultMeta = document.getElementById('marketResultMeta');
    const openAiStudioBtn = document.getElementById('openAiStudioBtn');
    const openMyAppsBtn = document.getElementById('openMyAppsBtn');
    const studioChatList = document.getElementById('studioChatList');
    const studioInput = document.getElementById('studioInput');
    const studioSendBtn = document.getElementById('studioSendBtn');
    const studioLearningTopic = document.getElementById('studioLearningTopic');
    const studioLearningGoal = document.getElementById('studioLearningGoal');
    const studioTargetAudience = document.getElementById('studioTargetAudience');
    const studioInteractionStyle = document.getElementById('studioInteractionStyle');
    const studioReadiness = document.getElementById('studioReadiness');
    const studioGenerateBtn = document.getElementById('studioGenerateBtn');
    const studioGoMyAppsBtn = document.getElementById('studioGoMyAppsBtn');
    const studioLoadingMask = document.getElementById('studioLoadingMask');
    const studioLoaderPhase = document.getElementById('studioLoaderPhase');
    const studioNotice = document.getElementById('studioNotice');
    const studioThinkingState = document.getElementById('studioThinkingState');
    const studioLogList = document.getElementById('studioLogList');
    const pptBlogUrlInput = document.getElementById('pptBlogUrlInput');
    const pptBlogPdfInput = document.getElementById('pptBlogPdfInput');
    const pptBlogModelSelect = document.getElementById('pptBlogModelSelect');
    const pptBlogStyleInput = document.getElementById('pptBlogStyleInput');
    const pptBlogGenerateBtn = document.getElementById('pptBlogGenerateBtn');
    const saveCurrentCourseInLabBtn = document.getElementById('saveCurrentCourseInLabBtn');
    const pptBlogStatus = document.getElementById('pptBlogStatus');
    const pptBlogModelChip = document.getElementById('pptBlogModelChip');
    const pptBlogTtsChip = document.getElementById('pptBlogTtsChip');
    const pptBlogTitle = document.getElementById('pptBlogTitle');
    const pptSlideList = document.getElementById('pptSlideList');
    const pptBlogMarkdown = document.getElementById('pptBlogMarkdown');
    const pptSourceTypeRadios = document.querySelectorAll('input[name="pptSourceType"]');
    const pptFocusModeBtn = document.getElementById('pptFocusModeBtn');
    const pptCardGridBtn = document.getElementById('pptCardGridBtn');
    const pptCardListBtn = document.getElementById('pptCardListBtn');
    const pptFontScaleRange = document.getElementById('pptFontScaleRange');
    const pptThemeSelect = document.getElementById('pptThemeSelect');
    const copyBlogMarkdownBtn = document.getElementById('copyBlogMarkdownBtn');
    const downloadBlogMarkdownBtn = document.getElementById('downloadBlogMarkdownBtn');
    const refreshMyAppsBtn = document.getElementById('refreshMyAppsBtn');
    const myAppsGrid = document.getElementById('myAppsGrid');
    const appPlayerTitle = document.getElementById('appPlayerTitle');
    const appPlayerMeta = document.getElementById('appPlayerMeta');
    const appPlayerContent = document.getElementById('appPlayerContent');
    const appPlayerBackBtn = document.getElementById('appPlayerBackBtn');
    const loginEmailInput = document.getElementById('loginEmailInput');
    const loginPasswordInput = document.getElementById('loginPasswordInput');
    const loginBtn = document.getElementById('loginBtn');
    const registerNameInput = document.getElementById('registerNameInput');
    const registerEmailInput = document.getElementById('registerEmailInput');
    const registerPasswordInput = document.getElementById('registerPasswordInput');
    const registerBtn = document.getElementById('registerBtn');
    const authStatusPanel = document.getElementById('authStatusPanel');
    const userRoleChip = document.getElementById('userRoleChip');
    const refreshMeBtn = document.getElementById('refreshMeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const assetNameInput = document.getElementById('assetNameInput');
    const assetValueInput = document.getElementById('assetValueInput');
    const addAssetBtn = document.getElementById('addAssetBtn');
    const reloadAssetsBtn = document.getElementById('reloadAssetsBtn');
    const assetsList = document.getElementById('assetsList');
    const devAppTitleInput = document.getElementById('devAppTitleInput');
    const devAppDescInput = document.getElementById('devAppDescInput');
    const createDevAppBtn = document.getElementById('createDevAppBtn');
    const reloadAppsBtn = document.getElementById('reloadAppsBtn');
    const devAppsList = document.getElementById('devAppsList');
    const socialBioInput = document.getElementById('socialBioInput');
    const socialSkillsInput = document.getElementById('socialSkillsInput');
    const allowCollabInput = document.getElementById('allowCollabInput');
    const saveSocialProfileBtn = document.getElementById('saveSocialProfileBtn');
    const socialProfileInfo = document.getElementById('socialProfileInfo');
    const reloadLearningSnapshotBtn = document.getElementById('reloadLearningSnapshotBtn');
    const learningHoursValue = document.getElementById('learningHoursValue');
    const learningStreakValue = document.getElementById('learningStreakValue');
    const learningCompletedValue = document.getElementById('learningCompletedValue');
    const learningSubjectSummary = document.getElementById('learningSubjectSummary');
    const quickSettingEmailDigest = document.getElementById('quickSettingEmailDigest');
    const quickSettingNewCourse = document.getElementById('quickSettingNewCourse');
    const zhipuApiKeyInput = document.getElementById('zhipuApiKeyInput');
    const zhipuApiKeyHint = document.getElementById('zhipuApiKeyHint');
    const saveQuickSettingsBtn = document.getElementById('saveQuickSettingsBtn');
    const quickSettingsStatus = document.getElementById('quickSettingsStatus');
    const questGoalInput = document.getElementById('questGoalInput');
    const questDaysInput = document.getElementById('questDaysInput');
    const questStyleSelect = document.getElementById('questStyleSelect');
    const generateQuestPlanBtn = document.getElementById('generateQuestPlanBtn');
    const generateQuestReviewBtn = document.getElementById('generateQuestReviewBtn');
    const askQuestCoachBtn = document.getElementById('askQuestCoachBtn');
    const questBootstrapMeta = document.getElementById('questBootstrapMeta');
    const questStrategyContent = document.getElementById('questStrategyContent');
    const questMissionList = document.getElementById('questMissionList');
    const questCoachInput = document.getElementById('questCoachInput');
    const questCoachOutput = document.getElementById('questCoachOutput');
    const questProgressChip = document.getElementById('questProgressChip');
    const questCountChip = document.getElementById('questCountChip');
    const questNotesInput = document.getElementById('questNotesInput');
    const questBlockersInput = document.getElementById('questBlockersInput');
    const questReviewContent = document.getElementById('questReviewContent');
    const questResourcePool = document.getElementById('questResourcePool');
    const memoryTopicInput = document.getElementById('memoryTopicInput');
    const memoryModeSelect = document.getElementById('memoryModeSelect');
    const memoryDifficultySelect = document.getElementById('memoryDifficultySelect');
    const memoryCountInput = document.getElementById('memoryCountInput');
    const generateMemoryDeckBtn = document.getElementById('generateMemoryDeckBtn');
    const buildMemorySummaryBtn = document.getElementById('buildMemorySummaryBtn');
    const memoryBootstrapMeta = document.getElementById('memoryBootstrapMeta');
    const memoryStrategyContent = document.getElementById('memoryStrategyContent');
    const memoryCardBoard = document.getElementById('memoryCardBoard');
    const memoryAnswerInput = document.getElementById('memoryAnswerInput');
    const memoryCoachContent = document.getElementById('memoryCoachContent');
    const memoryNextReview = document.getElementById('memoryNextReview');
    const memoryReportContent = document.getElementById('memoryReportContent');
    const memoryProgressChip = document.getElementById('memoryProgressChip');
    const memoryWeakChip = document.getElementById('memoryWeakChip');
    const memoryResourceList = document.getElementById('memoryResourceList');
    const memoryRateBtns = document.querySelectorAll('.memory-rate-btn');

    // State
    let isChatActive = false;
    let isSearchEnabled = false;
    let currentModelMode = 'balanced'; // balanced, deep_thinking, fast
    let currentView = 'ai';
    let questBootstrapped = false;
    let questPlan = [];
    let questGoal = '';
    let questCompleted = new Set();
    let marketAllApps = [];
    let marketCurrentCategory = 'all';
    let marketFeaturedOnly = false;
    let marketSearchKeyword = '';
    let marketSortBy = 'featured';
    let currentUser = null;
    let studioRequirement = {
        learning_topic: '',
        learning_goal: '',
        target_audience: '',
        interaction_style: ''
    };
    let studioHistory = [];
    let studioLoadingTicker = null;
    let studioRequestPending = false;
    let currentOpenedAppId = null;
    let appRuntimeState = {};
    let appBridgeInited = false;
    let memoryBootstrapped = false;
    let memoryCards = [];
    let memoryIndex = 0;
    let memoryRecords = [];
    let memoryTopic = '';
    let latestGeneratedCourse = null;
    let pptFocusMode = false;
    let pptCardLayoutMode = 'grid';
    let pptFontScale = 100;
    let pptThemeOverride = 'auto';
    let knowledgeHubCache = {
        my_courses: [],
        my_favorites: [],
        public_courses: [],
        public_apps: [],
        featured_recommendations: []
    };

    // Model Selection Logic
    const modelSelectorWrapper = document.querySelector('.model-selector-wrapper');
    const thinkingBtn = document.getElementById('thinkingToggleBtn');
    const modelOptions = document.querySelectorAll('.model-option');

    // Show dropdown on hover (CSS handles display, JS handles selection)
    modelOptions.forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            currentModelMode = mode;
            
            // Update UI
            modelOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Update Trigger Button Icon
            const icon = option.querySelector('i').className;
            thinkingBtn.querySelector('i').className = icon;
            
            if (mode === 'deep_thinking') {
                thinkingBtn.classList.add('active');
                thinkingBtn.title = "当前模式：深度思考 (Expert)";
            } else {
                thinkingBtn.classList.remove('active');
                if (mode === 'balanced') thinkingBtn.title = "当前模式：平衡型";
                if (mode === 'fast') thinkingBtn.title = "当前模式：极速型";
            }
        });
    });

    // Toggle dropdown on click as well for better mobile support
    if (thinkingBtn) {
        thinkingBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            // The CSS :hover handles desktop, but for click we might want to toggle a class
            // For now, let's keep the cycling logic if clicked directly, 
            // OR better: do nothing on click if we want it to be just a hover menu, 
            // BUT user asked for "mouse hover select", so let's ensure the previous click logic doesn't interfere.
            
            // Actually, let's make click cycle through modes for convenience if dropdown is ignored
            /* 
            if (currentModelMode === 'balanced') document.querySelector('[data-mode="deep_thinking"]').click();
            else if (currentModelMode === 'deep_thinking') document.querySelector('[data-mode="fast"]').click();
            else document.querySelector('[data-mode="balanced"]').click();
            */
        });
    }
    
    // ... (rest of code)

    // Navigation Logic
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.dataset.target) {
                // If there's no data-target, let the default navigation happen (e.g. href="/leetcode")
                return;
            }
            e.preventDefault();
            const target = item.dataset.target;

            // Update Active State
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch View
            switchView(target);
        });
    });

    function switchView(target) {
        currentView = target;
        
        // Hide all views first
        landingView.style.display = 'none';
        chatView.style.display = 'none';
        knowledgeView.style.display = 'none';
        socialView.style.display = 'none';
        analysisView.style.display = 'none';
        settingsView.style.display = 'none';
        journalView.style.display = 'none';
        superSearchView.style.display = 'none';
        aiMarketView.style.display = 'none';
        aiStudioView.style.display = 'none';
        myAppsView.style.display = 'none';
        appPlayerView.style.display = 'none';
        learningQuestView.style.display = 'none';
        memoryLabView.style.display = 'none';
        userCenterView.style.display = 'none';
        const myNotesView = document.getElementById('myNotesView');
        if(myNotesView) myNotesView.style.display = 'none';
        const resourcesView = document.getElementById('resourcesView');
        if(resourcesView) resourcesView.style.display = 'none';

        if (target === 'ai') {
            breadcrumbCurrent.textContent = 'StudioCopilot';
            if (isChatActive) {
                chatView.style.display = 'flex';
            } else {
                landingView.style.display = 'block'; // Or flex/grid based on CSS
            }
        } else if (target === 'my-notes') {
            breadcrumbCurrent.textContent = '我的笔记';
            if(myNotesView) {
                myNotesView.style.display = 'block';
                loadMyNotes();
            }
        } else if (target === 'super-search') {
            breadcrumbCurrent.textContent = '超级搜索';
            superSearchView.style.display = 'flex';
        } else if (target === 'ai-market') {
            breadcrumbCurrent.textContent = 'AI 教育应用市场';
            aiMarketView.style.display = 'flex';
            loadAiMarketApps();
        } else if (target === 'ai-studio') {
            breadcrumbCurrent.textContent = 'AI 应用创造控制台';
            aiStudioView.style.display = 'block';
            initStudioSession();
        } else if (target === 'my-apps') {
            breadcrumbCurrent.textContent = '我的 AI 应用';
            myAppsView.style.display = 'block';
            loadMyGeneratedApps();
        } else if (target === 'app-player') {
            breadcrumbCurrent.textContent = '应用运行页';
            appPlayerView.style.display = 'block';
        } else if (target === 'user-center') {
            breadcrumbCurrent.textContent = '用户中心';
            userCenterView.style.display = 'block';
            loadUserCenterData();
        } else if (target === 'learning-quest') {
            breadcrumbCurrent.textContent = 'AI 学习闯关工坊';
            learningQuestView.style.display = 'block';
            loadLearningQuestBootstrap();
        } else if (target === 'memory-lab') {
            breadcrumbCurrent.textContent = 'AI 反遗忘作战舱';
            memoryLabView.style.display = 'block';
            loadMemoryLabBootstrap();
        } else if (target === 'resources') {
            breadcrumbCurrent.textContent = '资源大厅';
            if(resourcesView) {
                resourcesView.style.display = 'block';
                if (!window._resourcesLoaded) {
                    renderResourceHub();
                    window._resourcesLoaded = true;
                } else {
                    // Always show hub view when navigating from sidebar
                    document.getElementById('resourcesHubView').style.display = 'block';
                    document.getElementById('resourcesDetailView').style.display = 'none';
                }
            }
        } else if (target === 'social') {
            breadcrumbCurrent.textContent = '学习圈';
            socialView.style.display = 'flex';
            loadSocialFeed();
        } else if (target === 'analysis') {
            breadcrumbCurrent.textContent = '学习分析';
            analysisView.style.display = 'flex';
            loadAnalytics();
        } else if (target === 'settings') {
            breadcrumbCurrent.textContent = '设置';
            settingsView.style.display = 'flex';
            loadSettings();
        }
    }

    // Auto-resize textarea
    function autoResize(el) {
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
        if (el.value === '') {
            el.style.height = 'auto';
        }
    }

    const inputs = []; if(landingInput) inputs.push(landingInput); if(chatInput) inputs.push(chatInput); inputs.forEach(input => {
        input.addEventListener('input', function() {
            autoResize(this);
        });
    });

    // Scroll Logic
    if (scrollTrigger) {
        scrollTrigger.addEventListener('click', () => {
            discoverySection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            heroSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Toggle Back to Top Button Visibility
    if (landingView) {
        landingView.addEventListener('scroll', () => {
            // Show button when scrolled past 300px (approx out of hero)
            if (landingView.scrollTop > 300) {
                if (backToTopBtn) backToTopBtn.classList.add('visible');
            } else {
                if (backToTopBtn) backToTopBtn.classList.remove('visible');
            }
        });
    }

    // Configure marked
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // Helper to render markdown properly
    function renderMarkdown(text) {
        // Ensure marked is available
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        }
        return text.replace(/\n/g, '<br>');
    }

    function renderReferenceLinks(links) {
        if (!Array.isArray(links) || links.length === 0) return '';
        const items = links.slice(0, 10).map((item, idx) => {
            const url = (item?.url || '').trim();
            if (!url) return '';
            const title = escapeHtml(item?.title || `参考链接 ${idx + 1}`);
            return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${title}</a></li>`;
        }).filter(Boolean).join('');
        if (!items) return '';
        return `<div class="ppt-reference-box"><h4>🔗 参考链接</h4><ol>${items}</ol></div>`;
    }

    // Main Send Logic
    function handleSend(source) {
        const inputEl = source === 'landing' ? landingInput : chatInput;
        const message = inputEl.value.trim();
        
        if (!message) return;

        // Transition logic
        if (!isChatActive) {
            landingView.style.display = 'none';
            chatView.style.display = 'flex';
            isChatActive = true;
            
            // Clear landing input
            landingInput.value = '';
        }

        // Add User Message
        appendMessage(message, 'user');
        
        // Clear input and reset height
        inputEl.value = '';
        inputEl.style.height = 'auto';

        // Create AI Message Placeholder
        const aiMessageDiv = appendMessage('', 'ai');
        
        // Add visual mode indicators
        if (currentModelMode === 'fast') {
            aiMessageDiv.classList.add('turbo-mode');
        } else if (currentModelMode === 'deep_thinking') {
            aiMessageDiv.classList.add('deep-mode');
        }

        const aiContentDiv = aiMessageDiv.querySelector('.message-content');
        
        // Structure for Status and Content
        const statusContainer = document.createElement('div');
        statusContainer.className = 'search-status-container';
        aiContentDiv.appendChild(statusContainer);
        
        // Structure for Reasoning (Deep Thinking)
        const reasoningContainer = document.createElement('div');
        reasoningContainer.className = 'reasoning-container';
        reasoningContainer.style.display = 'none'; // Hidden by default until content arrives
        aiContentDiv.appendChild(reasoningContainer);

        const textContainer = document.createElement('div');
        textContainer.className = 'markdown-body';
        aiContentDiv.appendChild(textContainer);

        // Add a typing cursor effect to text container
        textContainer.classList.add('typing-effect');

        // API Call with Streaming
        fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: message,
                enable_search: isSearchEnabled,
                thinking_mode: currentModelMode
            })
        })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = "";
            let reasoningText = "";
            let reasoningStartTime = null;
            let reasoningTimerInterval = null;

            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        textContainer.classList.remove('typing-effect');
                        if (reasoningTimerInterval) clearInterval(reasoningTimerInterval);
                        return;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    lines.forEach(line => {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.slice(6);
                            if (jsonStr.trim() === '[DONE]') return;
                            
                            try {
                                const data = JSON.parse(jsonStr);
                                
                                if (data.type === 'search_status') {
                                    if (data.status === 'searching') {
                                        statusContainer.innerHTML = `
                                            <div class="search-status-message">
                                                <div class="search-status-icon search-spinner"><i class="fa-solid fa-circle-notch"></i></div>
                                                <span>正在搜索: "${data.query}"</span>
                                            </div>
                                        `;
                                    } else if (data.status === 'found') {
                                        // Generate results list HTML
                                        let resultsListHtml = '';
                                        if (data.results && data.results.length > 0) {
                                            resultsListHtml = '<div class="search-results-list" style="display:none;">';
                                            data.results.forEach((item, idx) => {
                                                resultsListHtml += `
                                                    <a href="${item.link}" target="_blank" class="search-result-item">
                                                        <span class="result-index">${idx + 1}.</span>
                                                        <div class="result-info">
                                                            <div class="result-title">${item.title}</div>
                                                            <div class="result-link">${new URL(item.link).hostname}</div>
                                                        </div>
                                                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                                    </a>
                                                `;
                                            });
                                            resultsListHtml += '</div>';
                                        }

                                        statusContainer.innerHTML = `
                                            <div class="search-status-wrapper">
                                                <div class="search-status-message clickable" onclick="this.parentElement.querySelector('.search-results-list').style.display = this.parentElement.querySelector('.search-results-list').style.display === 'none' ? 'flex' : 'none'">
                                                    <div class="search-status-icon"><i class="fa-solid fa-check"></i></div>
                                                    <span>搜索完成</span>
                                                    <span class="search-results-pill">找到 ${data.count} 条结果 <i class="fa-solid fa-chevron-down" style="font-size:0.7em; margin-left:4px;"></i></span>
                                                </div>
                                                ${resultsListHtml}
                                            </div>
                                        `;
                                    } else if (data.status === 'failed') {
                                        statusContainer.innerHTML = `
                                            <div class="search-status-message">
                                                <div class="search-status-icon" style="color:var(--secondary)"><i class="fa-solid fa-triangle-exclamation"></i></div>
                                                <span>搜索失败</span>
                                            </div>
                                        `;
                                    }
                                }
                                
                                if (data.type === 'reasoning') {
                                    // Make container visible if it was hidden
                                    if (reasoningContainer.style.display === 'none') {
                                        reasoningContainer.style.display = 'block';
                                        reasoningStartTime = Date.now();
                                        
                                        // Initialize with loading state or first chunk
                                        reasoningContainer.innerHTML = `
                                            <div class="reasoning-header" onclick="this.parentElement.classList.toggle('collapsed')">
                                                <i class="fa-solid fa-brain fa-pulse" style="--fa-animation-duration: 2s;"></i> 
                                                <span>深度思考中...</span>
                                                <span class="reasoning-timer" style="margin-left:8px; font-size:0.9em; opacity:0.8; font-family:monospace;">0.0s</span>
                                                <i class="fa-solid fa-chevron-down toggle-icon" style="margin-left:auto;"></i>
                                            </div>
                                            <div class="reasoning-content markdown-body">
                                                <span class="reasoning-text"></span><span class="cursor-blink">▋</span>
                                            </div>
                                        `;
                                        
                                        // Start Timer
                                        reasoningTimerInterval = setInterval(() => {
                                            const elapsed = ((Date.now() - reasoningStartTime) / 1000).toFixed(1);
                                            const timerEl = reasoningContainer.querySelector('.reasoning-timer');
                                            if (timerEl) timerEl.textContent = `${elapsed}s`;
                                        }, 100);
                                    }
                                    
                                    reasoningText += data.content;
                                    // Update content dynamically
                                    const contentEl = reasoningContainer.querySelector('.reasoning-text');
                                    if (contentEl) {
                                        // Simple markdown or text update
                                        contentEl.innerHTML = renderMarkdown(reasoningText);
                                        // Apply highlighting to new blocks
                                        contentEl.querySelectorAll('pre code').forEach((block) => {
                                            hljs.highlightElement(block);
                                        });
                                        // Render MathJax if available
                                        if (window.MathJax) {
                                            window.MathJax.typesetPromise([contentEl]).catch(() => {});
                                        }
                                    }
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                }

                                if (data.type === 'content' || (data.content && !data.type)) { 
                                    // When main content starts, ensure reasoning cursor is removed
                                    const cursor = reasoningContainer.querySelector('.cursor-blink');
                                    if (cursor) cursor.remove();
                                    
                                    // Stop Timer & Update Header
                                    if (reasoningTimerInterval) {
                                        clearInterval(reasoningTimerInterval);
                                        reasoningTimerInterval = null;
                                        
                                        const header = reasoningContainer.querySelector('.reasoning-header');
                                        if (header) {
                                            // Update icon and text to show completion
                                            const icon = header.querySelector('.fa-brain');
                                            if (icon) {
                                                icon.classList.remove('fa-pulse');
                                                icon.style.color = '#10b981'; // Green
                                            }
                                            const textSpan = header.querySelector('span:not(.reasoning-timer)');
                                            if (textSpan) textSpan.textContent = '深度思考完成';
                                            
                                            const timerEl = header.querySelector('.reasoning-timer');
                                            if (timerEl) {
                                                timerEl.style.color = '#10b981';
                                                timerEl.style.fontWeight = 'bold';
                                            }
                                        }
                                    }
                                    
                                    const content = data.content || data;
                                    if (typeof content === 'string') {
                                        aiText += content;
                                        // Use marked to render markdown
                                        textContainer.innerHTML = renderMarkdown(aiText);
                                        // Apply highlighting to new blocks
                                        textContainer.querySelectorAll('pre code').forEach((block) => {
                                            hljs.highlightElement(block);
                                        });
                                        // Render MathJax if available
                                        if (window.MathJax) {
                                            window.MathJax.typesetPromise([textContainer]).catch(() => {});
                                        }
                                        chatContainer.scrollTop = chatContainer.scrollHeight;
                                    }
                                }
                                
                                if (data.recommended_materials) {
                                    // ... existing recommendation logic ...
                                    const grid = document.createElement('div');
                                    grid.classList.add('materials-grid-container');
                                    grid.style.marginTop = '1.5rem';

                                    data.recommended_materials.forEach((item, index) => {
                                        const card = createCard(item);
                                        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;
                                        grid.appendChild(card);
                                    });
                                    
                                    // Append grid to the content wrapper (parent of content div)
                                    aiContentDiv.parentNode.appendChild(grid);
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                }
                            } catch (e) {
                                console.error('Error parsing stream:', e);
                            }
                        }
                    });
                    read();
                });
            }
            read();
        })
        .catch(error => {
            console.error('Error:', error);
            textContainer.innerHTML = '抱歉，连接服务器失败。';
            textContainer.classList.remove('typing-effect');
        });
    }

    // Event Listeners
    if(landingSendBtn) landingSendBtn.addEventListener('click', () => handleSend('landing'));
    if (chatSendBtn) chatSendBtn.addEventListener('click', () => handleSend('chat'));

    if(landingInput) landingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend('landing');
        }
    });

    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend('chat');
        }
    });

    // Chip click handlers
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            landingInput.value = chip.textContent.trim();
            handleSend('landing');
        });
    });

    // Load Discovery Content
    function loadDiscoveryContent() {
        fetch('/api/discovery')
        .then(response => response.json())
        .then(data => {
            discoveryGrid.innerHTML = ''; // Clear loading state
            
            if (data.length === 0) {
                discoveryGrid.innerHTML = '<p style="color:var(--text-secondary); text-align:center; width:100%;">暂无推荐内容</p>';
                return;
            }

            data.forEach((item, index) => {
                const card = createCard(item);
                // Staggered animation
                card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;
                discoveryGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error loading discovery content:', error);
            discoveryGrid.innerHTML = '<p style="color:var(--text-secondary);">加载失败</p>';
        });
    }

    function loadAiMarketApps() {
        fetch('/api/ai-apps')
        .then(response => response.json())
        .then(data => {
            marketAllApps = data || [];
            initMarketCategoryFilters(marketAllApps);
            applyAiMarketFilters();
            updateAiMarketStats(marketAllApps);
        })
        .catch(error => {
            console.error('Error loading AI market apps:', error);
            aiAppsGrid.innerHTML = '<p style="color:var(--text-secondary);">应用加载失败</p>';
        });
    }

    function initMarketCategoryFilters(apps) {
        if (!marketCategoryFilters) return;
        const categories = Array.from(new Set((apps || []).map(item => item.category).filter(Boolean)));
        const chips = ['all', ...categories];
        marketCategoryFilters.innerHTML = chips.map(category => {
            const label = category === 'all' ? '全部应用' : category;
            const active = category === marketCurrentCategory ? 'active' : '';
            return `<button class="market-category-chip ${active}" data-category="${category}">${label}</button>`;
        }).join('');
        marketCategoryFilters.querySelectorAll('.market-category-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                marketCurrentCategory = btn.dataset.category || 'all';
                marketCategoryFilters.querySelectorAll('.market-category-chip').forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                applyAiMarketFilters();
            });
        });
    }

    function applyAiMarketFilters() {
        const keyword = (marketSearchKeyword || '').toLowerCase();
        let list = [...marketAllApps];

        if (marketCurrentCategory !== 'all') {
            list = list.filter(app => app.category === marketCurrentCategory);
        }
        if (marketFeaturedOnly) {
            list = list.filter(app => app.featured);
        }
        if (keyword) {
            list = list.filter(app => {
                const tags = (app.tags || []).join(' ');
                const source = `${app.name || ''} ${app.description || ''} ${app.category || ''} ${app.mode || ''} ${tags}`;
                return source.toLowerCase().includes(keyword);
            });
        }

        if (marketSortBy === 'name') {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));
        } else if (marketSortBy === 'category') {
            list.sort((a, b) => (a.category || '').localeCompare(b.category || '', 'zh-Hans-CN'));
        } else {
            list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
        }

        renderAiMarketApps(list);
        updateAiMarketResultMeta(list.length, marketAllApps.length);
    }

    function renderAiMarketApps(apps) {
        aiAppsGrid.innerHTML = '';
        if (!apps || apps.length === 0) {
            aiAppsGrid.innerHTML = '<div class="market-empty"><i class="fa-regular fa-face-sad-tear"></i><p>未找到符合条件的应用，试试更换筛选项</p></div>';
            return;
        }

        const gradients = [
            'linear-gradient(135deg, rgba(99,102,241,0.13), rgba(59,130,246,0.13))',
            'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(14,165,233,0.12))',
            'linear-gradient(135deg, rgba(236,72,153,0.13), rgba(249,115,22,0.12))',
            'linear-gradient(135deg, rgba(168,85,247,0.13), rgba(59,130,246,0.12))'
        ];
        apps.forEach((app, index) => {
            const card = document.createElement('article');
            card.className = 'ai-market-card';
            card.style.animation = `fadeInUp 0.45s ease-out ${index * 0.06}s backwards`;
            card.style.background = gradients[index % gradients.length];

            const tagsHtml = (app.tags || []).map(tag => `<span class="market-tag">${tag}</span>`).join('');
            const featuredHtml = app.featured ? '<span class="featured-badge"><i class="fa-solid fa-crown"></i> 推荐</span>' : '';
            const mode = app.mode || '标准';
            const category = app.category || '通用';

            card.innerHTML = `
                <div class="market-card-glow"></div>
                <div class="market-card-top">
                    <div class="market-app-icon"><i class="fa-solid ${app.icon || 'fa-robot'}"></i></div>
                    ${featuredHtml}
                </div>
                <div class="market-title-wrap">
                    <h3>${app.name}</h3>
                    <p>${app.description || ''}</p>
                </div>
                <div class="market-kpi-row">
                    <span class="market-kpi"><i class="fa-solid fa-layer-group"></i> ${category}</span>
                    <span class="market-kpi"><i class="fa-solid fa-bolt"></i> ${mode}</span>
                    <span class="market-kpi"><i class="fa-solid fa-wand-magic-sparkles"></i> AI驱动</span>
                </div>
                <div class="market-tags">${tagsHtml}</div>
                <div class="market-card-actions">
                    <button class="market-open-btn">立即使用</button>
                    <button class="market-ghost-btn">查看亮点</button>
                </div>
            `;

            const openBtn = card.querySelector('.market-open-btn');
            const ghostBtn = card.querySelector('.market-ghost-btn');
            card.addEventListener('mousemove', (event) => {
                const rect = card.getBoundingClientRect();
                const px = (event.clientX - rect.left) / Math.max(1, rect.width);
                const py = (event.clientY - rect.top) / Math.max(1, rect.height);
                const rx = (py - 0.5) * -6;
                const ry = (px - 0.5) * 8;
                card.style.setProperty('--mx', px.toFixed(3));
                card.style.setProperty('--my', py.toFixed(3));
                card.style.setProperty('--rx', `${rx.toFixed(3)}deg`);
                card.style.setProperty('--ry', `${ry.toFixed(3)}deg`);
            });
            card.addEventListener('mouseleave', () => {
                card.style.removeProperty('--mx');
                card.style.removeProperty('--my');
                card.style.removeProperty('--rx');
                card.style.removeProperty('--ry');
            });
            openBtn.addEventListener('click', () => {
                const route = app.route_target || '';
                const appId = Number(app.public_app_id || String(app.id || '').replace('user-app-', ''));
                if (route === 'app' && appId > 0) {
                    fetch(`/api/public/apps/${appId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        const virtualApp = {
                            id: appId,
                            title: data.title || app.name || '公开应用',
                            description: data.description || '',
                            learning_topic: data.learning_topic || '通用学习',
                            generation_model: data.generation_model || 'glm-5',
                            status: 'published',
                            blueprint: data.blueprint || {}
                        };
                        renderAppPlayer(virtualApp);
                        switchView('app-player');
                        const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
                        navItems.forEach(nav => nav.classList.remove('active'));
                        if (navTarget) navTarget.classList.add('active');
                    })
                    .catch(error => alert(error.message || '打开应用失败'));
                    return;
                }
                if (app.target) {
                    switchView(app.target);
                    const navTarget = document.querySelector(`.nav-item[data-target="${app.target}"]`);
                    if (navTarget) {
                        navItems.forEach(nav => nav.classList.remove('active'));
                        navTarget.classList.add('active');
                    }
                }
            });
            ghostBtn.addEventListener('click', () => {
                alert(`${app.name}\n\n${app.description || '这是一个AI驱动应用。'}\n\n模式：${mode} ｜ 分类：${category}`);
            });
            aiAppsGrid.appendChild(card);
        });
        const cards = aiAppsGrid.querySelectorAll('.ai-market-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { root: null, threshold: 0.18 });
        cards.forEach((card, idx) => {
            card.style.setProperty('--entry-delay', `${Math.min(0.05 * idx, 0.5)}s`);
            card.classList.add('reveal-ready');
            observer.observe(card);
        });
    }

    function updateAiMarketStats(apps) {
        if (!marketStats) return;
        const total = apps.length;
        const categoryCount = new Set(apps.map(item => item.category)).size;
        const featuredCount = apps.filter(item => item.featured).length;
        marketStats.innerHTML = `
            <span class="market-stat-chip"><i class="fa-solid fa-cubes"></i> 应用 ${total}</span>
            <span class="market-stat-chip"><i class="fa-solid fa-layer-group"></i> 分类 ${categoryCount}</span>
            <span class="market-stat-chip"><i class="fa-solid fa-star"></i> 推荐 ${featuredCount}</span>
        `;
        marketStats.classList.remove('pulse');
        void marketStats.offsetWidth;
        marketStats.classList.add('pulse');
    }

    function updateAiMarketResultMeta(filteredCount, totalCount) {
        if (!marketResultMeta) return;
        marketResultMeta.textContent = `当前展示 ${filteredCount} / ${totalCount} 个应用`;
    }

    function appendStudioMessage(role, content) {
        if (!studioChatList) return;
        const item = document.createElement('div');
        item.className = `studio-msg ${role}`;
        item.innerHTML = `<div class="studio-msg-bubble">${renderMarkdown(content || '')}</div>`;
        studioChatList.appendChild(item);
        studioChatList.scrollTop = studioChatList.scrollHeight;
    }

    function getPptSourceType() {
        const selected = Array.from(pptSourceTypeRadios || []).find(item => item.checked);
        return selected ? selected.value : 'url';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setPptBlogStatus(text, type = 'normal') {
        if (!pptBlogStatus) return;
        pptBlogStatus.textContent = text;
        pptBlogStatus.classList.remove('success', 'error');
        if (type === 'success') {
            pptBlogStatus.classList.add('success');
        }
        if (type === 'error') {
            pptBlogStatus.classList.add('error');
        }
    }

    function applyPptLabPresentation() {
        if (!pptSlideList) return;
        const pptBlogLayout = document.querySelector('.ppt-blog-layout');
        pptSlideList.classList.toggle('list-mode', pptCardLayoutMode === 'list');
        pptSlideList.style.setProperty('--ppt-font-scale', `${(pptFontScale / 100).toFixed(2)}`);
        pptSlideList.style.setProperty('--ppt-card-font-scale', `${Math.max(90, Math.min(130, pptFontScale))}%`);
        if (pptBlogLayout) {
            pptBlogLayout.classList.toggle('focus-mode', pptFocusMode);
        }
        if (pptFocusModeBtn) {
            pptFocusModeBtn.classList.toggle('active', pptFocusMode);
        }
        if (!pptThemeOverride || pptThemeOverride === 'auto') {
            pptSlideList.removeAttribute('data-theme-override');
        } else {
            pptSlideList.setAttribute('data-theme-override', pptThemeOverride);
        }
    }

    function initPptLabMotion() {
        const cards = document.querySelectorAll('.ppt-slide-card');
        cards.forEach((card, idx) => {
            card.style.animationDelay = `${Math.min(0.06 * idx, 0.42)}s`;
            card.classList.add('reveal-ready');
            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                const px = (event.clientX - rect.left) / Math.max(1, rect.width);
                const py = (event.clientY - rect.top) / Math.max(1, rect.height);
                card.style.setProperty('--mx', px.toFixed(3));
                card.style.setProperty('--my', py.toFixed(3));
            });
            card.addEventListener('pointerleave', () => {
                card.style.removeProperty('--mx');
                card.style.removeProperty('--my');
            });
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { root: pptSlideList, threshold: 0.16 });
        cards.forEach(card => observer.observe(card));
    }

    function speakSlideNote(text) {
        const content = (text || '').trim();
        if (!content) return;
        if (!window.speechSynthesis) {
            setPptBlogStatus('当前浏览器不支持本地朗读，请更换浏览器', 'error');
            return;
        }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(content);
        utter.lang = 'zh-CN';
        utter.rate = 1.0;
        utter.pitch = 1.0;
        window.speechSynthesis.speak(utter);
    }

    function renderPptSlides(slides) {
        if (!pptSlideList) return;
        if (!slides || slides.length === 0) {
            pptSlideList.innerHTML = '<div class="chart-placeholder">未生成到可展示的PPT页</div>';
            return;
        }
        pptSlideList.innerHTML = slides.map(slide => {
            const pointsHtml = (slide.points || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
            const audioHtml = slide.audio_base64
                ? `<audio controls preload="none" src="data:${slide.audio_mime || 'audio/mpeg'};base64,${slide.audio_base64}"></audio>`
                : `<div class="ppt-audio-empty">语音暂未生成成功，可先使用讲解稿口播。<button class="ppt-audio-fallback-btn" type="button" data-note="${escapeHtml(slide.speaker_note || '')}">浏览器朗读</button></div>`;
            return `
                <article class="ppt-slide-card">
                    <div class="ppt-slide-head">
                        <span class="ppt-slide-index">P${slide.index}</span>
                        <h4>${escapeHtml(slide.title || `第${slide.index}页`)}</h4>
                    </div>
                    <ul class="ppt-slide-points">${pointsHtml}</ul>
                    <div class="ppt-speaker-note">
                        <strong>讲解稿</strong>
                        <p>${escapeHtml(slide.speaker_note || '')}</p>
                    </div>
                    <div class="ppt-audio-block">
                        <strong>语音讲解</strong>
                        ${audioHtml}
                    </div>
                </article>
            `;
        }).join('');
        initPptLabMotion();
        pptSlideList.querySelectorAll('.ppt-audio-fallback-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const note = btn.getAttribute('data-note') || '';
                speakSlideNote(note);
            });
        });
    }

    function getUnitAudioSrc(unit) {
        if (!unit || !unit.audio_base64) return '';
        return `data:${unit.audio_mime || 'audio/wav'};base64,${unit.audio_base64}`;
    }

    function openImmersiveLessonPlayer(units, startIndex = 0) {
        if (!units || units.length === 0) return;
        const overlay = document.createElement('div');
        overlay.className = 'immersive-player-overlay';
        let currentIndex = Math.max(0, Math.min(startIndex, units.length - 1));
        let autoPlay = true;

        const render = () => {
            const unit = units[currentIndex] || {};
            const immersiveIcons = ['🌟', '🎯', '🧠', '🚀', '✨', '📌'];
            const pointsHtml = (unit.points || []).map((item, idx) => `<li><span class="point-icon">${immersiveIcons[idx % immersiveIcons.length]}</span>${escapeHtml(item)}</li>`).join('');
            const imageHtml = unit.image_url
                ? `<img class="immersive-hero-image" src="${escapeHtml(unit.image_url)}" alt="${escapeHtml(unit.unit_title || '')}">`
                : `<div class="immersive-image-placeholder"><i class="fa-solid fa-image"></i><span>暂无配图</span></div>`;
            const audioSrc = getUnitAudioSrc(unit);
            const unitTheme = (pptThemeOverride && pptThemeOverride !== 'auto') ? pptThemeOverride : (unit.theme_style || 'aurora');
            const layoutClass = `layout-${unit.layout_style || 'visual-focus'} theme-${unitTheme}`;
            const sourceLinkHtml = unit.source_link ? `<a class="immersive-source-link" href="${escapeHtml(unit.source_link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> 原文链接</a>` : '';
            overlay.innerHTML = `
                <div class="immersive-player-shell">
                    <div class="immersive-toolbar">
                        <button class="immersive-close-btn" type="button"><i class="fa-solid fa-xmark"></i> 退出</button>
                        <div class="immersive-toolbar-center">
                            <span class="immersive-page">${currentIndex + 1} / ${units.length}</span>
                            <label class="immersive-autoplay">
                                <input class="immersive-autoplay-input" type="checkbox" ${autoPlay ? 'checked' : ''}>
                                自动连播语音
                            </label>
                        </div>
                        <button class="immersive-fullscreen-btn" type="button"><i class="fa-solid fa-expand"></i> 全屏</button>
                    </div>
                    <div class="immersive-stage">
                        <button class="immersive-nav prev" type="button"><i class="fa-solid fa-chevron-left"></i></button>
                        <article class="immersive-slide ${layoutClass}">
                            <div class="immersive-hero">
                                ${imageHtml}
                                <div class="immersive-hero-mask"></div>
                                <div class="immersive-hero-content">
                                    <span class="immersive-highlight">${escapeHtml(unit.highlight || unit.key_takeaway || '')}</span>
                                    <h2>${escapeHtml(unit.unit_title || unit.title || '')}</h2>
                                    ${sourceLinkHtml}
                                </div>
                            </div>
                            <div class="immersive-main">
                                <div class="immersive-left">
                                    <h3>关键要点</h3>
                                    <ul class="immersive-points">${pointsHtml}</ul>
                                </div>
                                <div class="immersive-right">
                                    <div><strong>这一页想说：</strong>${escapeHtml(unit.learning_goal || '')}</div>
                                    <div><strong>展开聊聊：</strong>${escapeHtml(unit.explanation || '')}</div>
                                    <div><strong>现实例子：</strong>${escapeHtml(unit.example || '')}</div>
                                    <div><strong>延伸思考：</strong>${escapeHtml(unit.quiz_question || '')}</div>
                                </div>
                            </div>
                            <div class="immersive-audio">
                                ${audioSrc ? `<audio class="immersive-audio-player" controls preload="metadata" src="${audioSrc}"></audio>` : `<button class="immersive-tts-fallback" type="button">浏览器朗读本页讲解</button>`}
                                <div class="immersive-subtitle">
                                    <span>字幕</span>
                                    <p>${escapeHtml(unit.speaker_note || unit.explanation || '')}</p>
                                </div>
                            </div>
                        </article>
                        <button class="immersive-nav next" type="button"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            `;
            overlay.querySelector('.immersive-close-btn')?.addEventListener('click', () => {
                window.speechSynthesis?.cancel?.();
                overlay.remove();
            });
            overlay.querySelector('.immersive-fullscreen-btn')?.addEventListener('click', () => {
                if (overlay.requestFullscreen) {
                    overlay.requestFullscreen().catch(() => {});
                }
            });
            overlay.querySelector('.immersive-autoplay-input')?.addEventListener('change', (evt) => {
                autoPlay = Boolean(evt.target.checked);
            });
            overlay.querySelector('.immersive-nav.prev')?.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + units.length) % units.length;
                render();
            });
            overlay.querySelector('.immersive-nav.next')?.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % units.length;
                render();
            });
            overlay.querySelector('.immersive-tts-fallback')?.addEventListener('click', () => {
                speakSlideNote(unit.speaker_note || unit.explanation || '');
            });
            const player = overlay.querySelector('.immersive-audio-player');
            if (player) {
                player.onended = () => {
                    if (!autoPlay) return;
                    currentIndex = (currentIndex + 1) % units.length;
                    render();
                };
                if (autoPlay) {
                    player.play().catch(() => {});
                }
            } else if (autoPlay) {
                speakSlideNote(unit.speaker_note || unit.explanation || '');
            }
        };
        document.body.appendChild(overlay);
        render();
        if (overlay.requestFullscreen) {
            overlay.requestFullscreen().catch(() => {});
        }
    }

    function renderLessonUnits(units) {
        if (!pptSlideList) return;
        if (!units || units.length === 0) {
            renderPptSlides([]);
            return;
        }
        const cardsHtml = units.map(unit => {
            const pointIcons = ['✨', '🎯', '📌', '💡', '🧠'];
            const pointsHtml = (unit.points || []).map((item, idx) => `<li><span class="point-icon">${pointIcons[idx % pointIcons.length]}</span>${escapeHtml(item)}</li>`).join('');
            const audioHtml = unit.audio_base64
                ? `<audio controls preload="none" src="data:${unit.audio_mime || 'audio/wav'};base64,${unit.audio_base64}"></audio>`
                : `<div class="ppt-audio-empty">语音暂未生成成功，可先使用讲解稿口播。<button class="ppt-audio-fallback-btn" type="button" data-note="${escapeHtml(unit.speaker_note || '')}">浏览器朗读</button></div>`;
            const heroHtml = unit.image_url
                ? `<div class="lesson-card-hero"><img class="lesson-card-image" src="${escapeHtml(unit.image_url)}" alt="${escapeHtml(unit.unit_title || unit.title || '')}"><span class="lesson-highlight-chip">${escapeHtml(unit.highlight || unit.key_takeaway || '')}</span></div>`
                : `<div class="lesson-card-banner">${escapeHtml(unit.highlight || unit.key_takeaway || '✨ 重点讲解')}</div>`;
            const sourceLinkHtml = unit.source_link ? `<a class="lesson-source-link" href="${escapeHtml(unit.source_link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> 原文</a>` : '';
            const unitTheme = (pptThemeOverride && pptThemeOverride !== 'auto') ? pptThemeOverride : (unit.theme_style || 'aurora');
            const layoutClass = `layout-${unit.layout_style || 'visual-focus'} theme-${unitTheme}`;
            let contentHtml = `
                <div class="lesson-meta"><strong>这一页想说：</strong>${escapeHtml(unit.learning_goal || '掌握本单元核心内容')}</div>
                <div class="lesson-meta"><strong>一句话重点：</strong>${escapeHtml(unit.key_takeaway || '')}</div>
                <ul class="ppt-slide-points">${pointsHtml}</ul>
                <div class="lesson-meta"><strong>展开聊聊：</strong>${escapeHtml(unit.explanation || '')}</div>
                <div class="lesson-meta"><strong>现实例子：</strong>${escapeHtml(unit.example || '')}</div>
                <div class="lesson-meta"><strong>容易忽略：</strong>${escapeHtml(unit.misconception || '')}</div>
                <div class="lesson-quiz"><strong>延伸思考：</strong>${escapeHtml(unit.quiz_question || '')}<br><strong>一个参考角度：</strong>${escapeHtml(unit.quiz_answer || '')}</div>
            `;
            if ((unit.layout_style || '') === 'text-focus') {
                contentHtml = `
                    <div class="lesson-meta"><strong>一句话重点：</strong>${escapeHtml(unit.key_takeaway || '')}</div>
                    <div class="lesson-meta"><strong>展开聊聊：</strong>${escapeHtml(unit.explanation || '')}</div>
                    <div class="lesson-meta"><strong>现实例子：</strong>${escapeHtml(unit.example || '')}</div>
                    <ul class="ppt-slide-points">${pointsHtml}</ul>
                    <div class="lesson-quiz"><strong>延伸思考：</strong>${escapeHtml(unit.quiz_question || '')}</div>
                `;
            }
            if ((unit.layout_style || '') === 'card-magazine') {
                contentHtml = `
                    <div class="lesson-quote">${escapeHtml(unit.key_takeaway || '')}</div>
                    <ul class="ppt-slide-points">${pointsHtml}</ul>
                    <div class="lesson-meta"><strong>展开聊聊：</strong>${escapeHtml(unit.explanation || '')}</div>
                    <div class="lesson-meta"><strong>现实例子：</strong>${escapeHtml(unit.example || '')}</div>
                    <div class="lesson-meta"><strong>这一页想说：</strong>${escapeHtml(unit.learning_goal || '')}</div>
                `;
            }
            return `
                <article class="ppt-slide-card lesson-unit-card ${layoutClass}">
                    ${heroHtml}
                    <div class="ppt-slide-head">
                        <span class="ppt-slide-index">U${unit.index || ''}</span>
                        <h4>${escapeHtml(unit.unit_title || unit.title || `单元${unit.index || ''}`)}</h4>
                    </div>
                    ${sourceLinkHtml}
                    ${contentHtml}
                    <div class="ppt-audio-block">
                        <strong>语音讲解</strong>
                        ${audioHtml}
                    </div>
                    <button class="lesson-open-immersive-btn" type="button" data-index="${(unit.index || 1) - 1}"><i class="fa-solid fa-expand"></i> 沉浸式全屏讲解</button>
                </article>
            `;
        }).join('');
        pptSlideList.innerHTML = `
            <div class="lesson-deck-toolbar">
                <button class="lesson-open-immersive-main" type="button"><i class="fa-solid fa-play"></i> 开始沉浸式全屏课程</button>
            </div>
            <div class="lesson-card-grid">${cardsHtml}</div>
        `;
        applyPptLabPresentation();
        initPptLabMotion();
        pptSlideList.querySelector('.lesson-open-immersive-main')?.addEventListener('click', () => openImmersiveLessonPlayer(units, 0));
        pptSlideList.querySelectorAll('.lesson-open-immersive-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-index') || 0);
                openImmersiveLessonPlayer(units, idx);
            });
        });
        pptSlideList.querySelectorAll('.ppt-audio-fallback-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const note = btn.getAttribute('data-note') || '';
                speakSlideNote(note);
            });
        });
    }

    function generatePptBlog() {
        if (!pptBlogGenerateBtn) return;
        const sourceType = getPptSourceType();
        const preferredModel = (pptBlogModelSelect?.value || 'auto').trim();
        const styleHint = (pptBlogStyleInput?.value || '').trim();
        const sourceUrl = (pptBlogUrlInput?.value || '').trim();
        const pdfFile = pptBlogPdfInput?.files?.[0];

        if (sourceType === 'url' && !sourceUrl) {
            setPptBlogStatus('请先输入网址', 'error');
            return;
        }
        if (sourceType === 'pdf' && !pdfFile) {
            setPptBlogStatus('请先选择PDF文件', 'error');
            return;
        }

        pptBlogGenerateBtn.disabled = true;
        pptBlogGenerateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 解析与生成中';
        setPptBlogStatus('正在解析内容并生成PPT、博客和语音...');

        const requestOptions = {
            method: 'POST'
        };
        if (sourceType === 'pdf') {
            const formData = new FormData();
            formData.append('source_type', 'pdf');
            formData.append('pdf_file', pdfFile);
            formData.append('preferred_model', preferredModel);
            formData.append('style_hint', styleHint);
            requestOptions.body = formData;
        } else {
            requestOptions.headers = { 'Content-Type': 'application/json' };
            requestOptions.body = JSON.stringify({
                source_type: 'url',
                source_url: sourceUrl,
                preferred_model: preferredModel,
                style_hint: styleHint
            });
        }

        fetch('/api/ppt-blog/generate', requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            latestGeneratedCourse = data;
            pptBlogTitle.textContent = data.title || '在线PPT预览';
            pptBlogModelChip.textContent = `模型：${data.generation_model || '未知'}`;
            const pageCount = data.page_count || (data.slides || []).length || 0;
            const speed = Number(data.tts_speed || 1).toFixed(2);
            pptBlogTtsChip.textContent = `语音：${data.tts_success_count || 0}/${data.tts_total_count || 0} · 语速：${speed}x · 页数：${pageCount}`;
            if (data.lesson_units && data.lesson_units.length) {
                renderLessonUnits(data.lesson_units);
            } else {
                renderPptSlides(data.slides || []);
            }
            if (pptBlogMarkdown) {
                const linksHtml = renderReferenceLinks(data.reference_links || []);
                pptBlogMarkdown.innerHTML = `${linksHtml}${renderMarkdown(data.blog_markdown || '暂无博客内容')}`;
            }
            if (data.parse_warning) {
                setPptBlogStatus(data.parse_warning, 'error');
            } else if ((data.tts_success_count || 0) === 0) {
                setPptBlogStatus(`语音服务暂不可用，已返回讲解稿文本。${data.tts_warning ? `原因：${data.tts_warning}` : ''}`, 'error');
            } else {
                setPptBlogStatus('生成完成', 'success');
            }
        })
        .catch(error => {
            setPptBlogStatus(error.message || '生成失败，请稍后重试', 'error');
        })
        .finally(() => {
            pptBlogGenerateBtn.disabled = false;
            pptBlogGenerateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 生成课程讲解稿';
        });
    }

    function createStreamingAssistantMessage() {
        if (!studioChatList) return null;
        const item = document.createElement('div');
        item.className = 'studio-msg assistant';
        const bubble = document.createElement('div');
        bubble.className = 'studio-msg-bubble';
        bubble.innerHTML = '';
        item.appendChild(bubble);
        studioChatList.appendChild(item);
        studioChatList.scrollTop = studioChatList.scrollHeight;
        return {
            bubble,
            text: '',
            push(chunk) {
                this.text += chunk;
                bubble.innerHTML = renderMarkdown(this.text);
                studioChatList.scrollTop = studioChatList.scrollHeight;
            },
            finalize() {
                bubble.innerHTML = renderMarkdown(this.text);
                studioChatList.scrollTop = studioChatList.scrollHeight;
            }
        };
    }

    function showStudioNotice(text, isError = false) {
        if (!studioNotice) return;
        studioNotice.textContent = text;
        studioNotice.classList.toggle('error', Boolean(isError));
    }

    function appendStudioLog(message, level = 'info') {
        if (!studioLogList) return;
        const line = document.createElement('div');
        line.className = `studio-log-line ${level}`;
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        line.textContent = `[${ts}] ${message}`;
        studioLogList.appendChild(line);
        studioLogList.scrollTop = studioLogList.scrollHeight;
    }

    function updateStudioThinkingState(text, level = 'normal') {
        if (!studioThinkingState) return;
        studioThinkingState.textContent = `状态：${text}`;
        studioThinkingState.classList.remove('warning', 'active');
        if (level === 'warning') {
            studioThinkingState.classList.add('warning');
        } else if (level === 'active') {
            studioThinkingState.classList.add('active');
        }
    }

    function syncStudioForm(requirement) {
        studioLearningTopic.value = requirement.learning_topic || '';
        studioLearningGoal.value = requirement.learning_goal || '';
        studioTargetAudience.value = requirement.target_audience || '';
        studioInteractionStyle.value = requirement.interaction_style || '';
    }

    function pullStudioForm() {
        return {
            learning_topic: (studioLearningTopic.value || '').trim(),
            learning_goal: (studioLearningGoal.value || '').trim(),
            target_audience: (studioTargetAudience.value || '').trim(),
            interaction_style: (studioInteractionStyle.value || '').trim()
        };
    }

    function initStudioSession() {
        if (!studioChatList || studioChatList.dataset.inited === '1') return;
        studioChatList.dataset.inited = '1';
        appendStudioMessage('assistant', '你好，我是你的 AI 产品顾问。先告诉我你想做什么学习主题的应用，我会通过访谈帮你完善需求。');
        updateStudioThinkingState('待命');
        appendStudioLog('控制台已就绪，等待用户输入。');
    }

    function setStudioLoading(loading, text) {
        if (!studioLoadingMask) return;
        studioLoadingMask.style.display = loading ? 'flex' : 'none';
        const textNode = studioLoadingMask.querySelector('.studio-loader-text');
        const phases = ['阶段：初始化', '阶段：解析需求', '阶段：推理方案', '阶段：结构化输出'];
        if (studioLoadingTicker) {
            clearInterval(studioLoadingTicker);
            studioLoadingTicker = null;
        }
        if (loading) {
            if (textNode) textNode.textContent = text || 'AI 正在构建你的应用蓝图...';
            if (studioLoaderPhase) studioLoaderPhase.textContent = phases[0];
            let idx = 0;
            studioLoadingTicker = setInterval(() => {
                idx = (idx + 1) % phases.length;
                if (studioLoaderPhase) studioLoaderPhase.textContent = phases[idx];
            }, 800);
        } else {
            if (textNode) textNode.textContent = 'AI 正在构建你的应用蓝图...';
            if (studioLoaderPhase) studioLoaderPhase.textContent = '阶段：初始化';
        }
    }

    function updateStudioReadiness(ready, missingFields) {
        if (!studioReadiness) return;
        if (ready) {
            studioReadiness.classList.add('ready');
            studioReadiness.textContent = '需求完整，可生成应用。';
            return;
        }
        studioReadiness.classList.remove('ready');
        const map = {
            learning_topic: '学习主题',
            learning_goal: '学习目标',
            target_audience: '目标人群',
            interaction_style: '交互风格'
        };
        const labels = (missingFields || []).map(key => map[key] || key);
        studioReadiness.textContent = labels.length ? `还缺：${labels.join('、')}` : '继续补充需求以便生成应用。';
    }

    function sendStudioMessage() {
        if (studioRequestPending) return;
        const message = (studioInput.value || '').trim();
        if (!message) return;
        appendStudioMessage('user', message);
        studioInput.value = '';
        const localRequirement = pullStudioForm();
        studioRequestPending = true;
        updateStudioThinkingState('访谈中', 'active');
        appendStudioLog('发送用户消息，开始流式访谈。');
        const streamBubble = createStreamingAssistantMessage();

        fetch('/api/user/apps/studio/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                requirement: localRequirement,
                history: studioHistory
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`访谈请求失败 (${response.status})`);
            }
            if (!response.body) {
                throw new Error('浏览器不支持流式响应');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let finalPayload = null;

            const processPacket = (packet) => {
                const lines = packet.split('\n');
                const dataLine = lines.find(line => line.startsWith('data: '));
                if (!dataLine) return;
                const raw = dataLine.slice(6);
                let payload = null;
                try {
                    payload = JSON.parse(raw);
                } catch {
                    return;
                }
                if (payload.type === 'chunk') {
                    streamBubble?.push(payload.content || '');
                } else if (payload.type === 'reasoning') {
                    appendStudioLog(`推理：${(payload.content || '').slice(0, 60)}`, 'thinking');
                    updateStudioThinkingState('AI 深度思考中', 'active');
                } else if (payload.type === 'log') {
                    appendStudioLog(payload.message || '日志更新', payload.level === 'error' ? 'error' : 'info');
                } else if (payload.type === 'final') {
                    finalPayload = payload;
                } else if (payload.type === 'done') {
                    streamBubble?.finalize();
                }
            };

            const pump = () => reader.read().then(({ done, value }) => {
                if (done) return;
                buffer += decoder.decode(value, { stream: true });
                const packets = buffer.split('\n\n');
                buffer = packets.pop() || '';
                packets.forEach(processPacket);
                return pump();
            }).then(() => {
                if (buffer.trim()) processPacket(buffer);
                streamBubble?.finalize();
                if (finalPayload) {
                    studioRequirement = finalPayload.requirement_update || localRequirement;
                    studioHistory.push({ role: 'user', content: message });
                    studioHistory.push({ role: 'assistant', content: finalPayload.reply || streamBubble?.text || '' });
                    studioHistory = studioHistory.slice(-10);
                    syncStudioForm(studioRequirement);
                    updateStudioReadiness(Boolean(finalPayload.ready), finalPayload.missing_fields || []);
                    showStudioNotice(finalPayload.ready ? '需求已完整，可点击右上角生成应用。' : '继续对话完善需求，完成后即可生成。');
                    appendStudioLog('本轮访谈完成。');
                }
            });
            return pump();
        })
        .catch(error => {
            const messageText = error.message || '访谈暂时失败，请稍后再试。';
            appendStudioMessage('assistant', messageText);
            appendStudioLog(messageText, 'error');
            showStudioNotice(messageText.includes('登录') ? '请先登录后再进行AI应用访谈。' : '访谈暂时失败，请重试。', true);
            updateStudioThinkingState('异常', 'warning');
        })
        .finally(() => {
            studioRequestPending = false;
            if (!studioThinkingState?.classList.contains('warning')) {
                updateStudioThinkingState('待命');
            }
        });
    }

    function loadMyGeneratedApps() {
        fetch('/api/auth/me')
        .then(response => response.json())
        .then(auth => {
            if (!auth.authenticated) {
                myAppsGrid.innerHTML = `
                    <div class="market-empty">
                        <i class="fa-regular fa-user"></i>
                        <p>登录后即可查看你生成的应用。</p>
                    </div>
                `;
                return null;
            }
            return fetch('/api/user/apps?app_type=ai_generated').then(resp => resp.json());
        })
        .then(data => {
            if (data === null) return;
            if (!Array.isArray(data) || !data.length) {
                myAppsGrid.innerHTML = '<div class="market-empty"><i class="fa-regular fa-folder-open"></i><p>还没有 AI 生成应用，去创造控制台生成一个吧。</p></div>';
                return;
            }
            const statusMap = {
                published: '已发布',
                draft: '草稿',
                private: '私有'
            };
            myAppsGrid.innerHTML = data.map(item => `
                <article class="my-app-card">
                    <div class="my-app-top">
                        <h3>${item.title}</h3>
                        <span class="my-app-status ${item.status || 'draft'}">${statusMap[item.status] || item.status || '草稿'}</span>
                    </div>
                    <p>${item.description || ''}</p>
                    <div class="my-app-meta-row">
                        <span class="my-app-meta">${item.learning_topic || '未分类'}</span>
                        <span class="my-app-meta">${item.generation_model || 'glm-5'}</span>
                        <span class="my-app-meta">${item.visibility || 'private'}</span>
                    </div>
                    <div class="my-app-actions">
                        <button class="open-app-btn my-action-primary" data-id="${item.id}"><i class="fa-solid fa-play"></i> 打开</button>
                        <button class="publish-app-btn" data-id="${item.id}"><i class="fa-solid fa-upload"></i> 发布</button>
                        <button class="share-app-btn" data-id="${item.id}"><i class="fa-solid fa-share-nodes"></i> 分享</button>
                        <button class="unshare-app-btn" data-id="${item.id}"><i class="fa-solid fa-link-slash"></i> 取消分享</button>
                        <button class="delete-app-btn" data-id="${item.id}"><i class="fa-solid fa-trash"></i> 删除</button>
                    </div>
                </article>
            `).join('');
            bindAppActions(myAppsGrid, loadMyGeneratedApps);
        })
        .catch(() => {
            myAppsGrid.innerHTML = '<p class="user-empty">加载失败，请稍后重试</p>';
        });
    }

    function renderAppPlayer(app) {
        appPlayerTitle.innerHTML = `<i class="fa-solid fa-rocket"></i> ${app.title || '应用运行页'}`;
        appPlayerMeta.textContent = `${app.learning_topic || '通用学习'} · ${app.generation_model || 'glm-5'} · ${app.status || 'draft'}`;
        const blueprint = app.blueprint || {};
        const runtime = blueprint.runtime_config || {};
        currentOpenedAppId = app.id;
        appRuntimeState = {
            tasks: Array.isArray(runtime.tasks) ? runtime.tasks.map(item => ({ ...item })) : [],
            quizBank: Array.isArray(runtime.quiz_bank) ? runtime.quiz_bank : [],
            topic: app.learning_topic || '通用学习',
            appTitle: app.title || '应用',
            uiBundle: blueprint.ui_bundle || null,
            aiHistory: [],
            activeAction: 'coach',
            pendingTuneBundle: null
        };
        const quickPrompts = [
            `请用一个生活化例子讲解${app.learning_topic || '当前主题'}`,
            `请出3道由浅入深的${app.learning_topic || '当前主题'}练习题`,
            `请总结${app.learning_topic || '当前主题'}常见误区并纠正`,
            `请给我一个10分钟学习冲刺计划`
        ];
        appPlayerContent.innerHTML = `
            <div class="app-player-intro">
                <h4>${blueprint.one_liner || app.description || ''}</h4>
                <p>${blueprint.positioning || ''}</p>
                <div class="app-player-intro-chips">
                    <span class="app-intro-chip"><i class="fa-solid fa-bolt"></i> 主题：${app.learning_topic || '通用学习'}</span>
                    <span class="app-intro-chip"><i class="fa-solid fa-brain"></i> 模型：${app.generation_model || 'glm-5'}</span>
                    <span class="app-intro-chip"><i class="fa-solid fa-chart-line"></i> 状态：${app.status || 'draft'}</span>
                </div>
            </div>
            <section class="app-player-block">
                <div class="app-runtime-toolbar">
                    <h3>AI 生成应用页面</h3>
                    <div class="app-runtime-tools">
                        <button id="appRuntimeRefreshBtn" class="open-app-btn app-tool-btn"><i class="fa-solid fa-rotate-right"></i> 刷新应用</button>
                        <button id="appRuntimeFullscreenBtn" class="open-app-btn app-tool-btn"><i class="fa-solid fa-expand"></i> 全屏体验</button>
                    </div>
                </div>
                <iframe id="appRuntimeFrame" class="app-runtime-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe>
            </section>
            <div class="app-player-runtime-grid">
                <section class="app-player-block app-ai-module-card">
                    <h3>AI 智能互动测验讲解</h3>
                    <p class="app-ai-module-subtitle">选择一种互动模式，输入问题后即可获得即时讲解与测验内容。</p>
                    <div class="app-ai-action-row">
                        <button class="open-app-btn app-ai-action-btn" data-action="coach"><i class="fa-solid fa-life-ring"></i> 教练答疑</button>
                        <button class="open-app-btn app-ai-action-btn" data-action="explain"><i class="fa-solid fa-lightbulb"></i> 讲解知识点</button>
                        <button class="open-app-btn app-ai-action-btn" data-action="practice"><i class="fa-solid fa-pen-ruler"></i> 生成练习题</button>
                    </div>
                    <div class="app-ai-quick-row">
                        ${quickPrompts.map(prompt => `<button class="app-ai-quick-btn" data-prompt="${prompt}">${prompt}</button>`).join('')}
                    </div>
                    <textarea id="appAiInput" class="studio-input app-ai-input" placeholder="输入你的问题或需求，例如：给我3道${app.learning_topic || '该主题'}练习题"></textarea>
                    <div id="appAiOutput" class="app-ai-output">这里会显示 AI 输出结果。</div>
                    <div class="app-ai-footer">
                        <button id="appAiClearBtn" class="open-app-btn app-tool-btn"><i class="fa-solid fa-broom"></i> 清空输出</button>
                        <button id="appAiCopyBtn" class="open-app-btn app-tool-btn"><i class="fa-solid fa-copy"></i> 复制结果</button>
                    </div>
                    <div class="app-ai-history-wrap">
                        <h4><i class="fa-solid fa-clock-rotate-left"></i> 最近互动</h4>
                        <ul id="appAiHistory" class="app-ai-history-list"><li class="app-ai-history-empty">暂无记录，开始一次提问吧。</li></ul>
                    </div>
                </section>
                <section class="app-player-block app-ai-module-card">
                    <h3>应用微调工坊</h3>
                    <p class="app-ai-module-subtitle">直接告诉 AI 你要改什么，先预览再应用到当前应用。</p>
                    <textarea id="appTuneInput" class="studio-input app-ai-input" placeholder="例如：把主色调改成深色科技风，增加步骤进度条，按钮改为圆角胶囊风格"></textarea>
                    <div class="app-ai-footer">
                        <button id="appTunePreviewBtn" class="open-app-btn app-tool-btn"><i class="fa-solid fa-wand-magic-sparkles"></i> 生成预览</button>
                        <button id="appTuneApplyBtn" class="open-app-btn app-tool-btn"><i class="fa-solid fa-check"></i> 应用到当前应用</button>
                    </div>
                    <div id="appTuneStatus" class="app-ai-output">输入微调需求后点击“生成预览”。</div>
                </section>
            </div>
        `;
        bindAppPlayerInteractions();
    }

    function requestAppAiAction(action, userInput, fallbackText) {
        if (!currentOpenedAppId) return Promise.reject(new Error('应用未加载'));
        const normalizeUserInput = (value) => {
            if (typeof value === 'string') return value.trim();
            if (value && typeof value === 'object') {
                try {
                    return JSON.stringify(value);
                } catch (error) {
                    return String(value);
                }
            }
            return value == null ? '' : String(value);
        };
        return fetch(`/api/user/apps/${currentOpenedAppId}/ai-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,
                user_input: normalizeUserInput(userInput || fallbackText)
            })
        })
        .then(async response => {
            const rawText = await response.text();
            let data = null;
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (error) {
                if (!response.ok) {
                    throw new Error(`请求失败（${response.status}），请稍后重试`);
                }
                throw new Error('服务返回异常内容，请稍后重试');
            }
            if (!response.ok) {
                throw new Error(data?.error || `请求失败（${response.status}）`);
            }
            if (data.error) throw new Error(data.error);
            return data.answer || 'AI暂无回复';
        });
    }

    function requestAppTuneAction(instruction, mode) {
        if (!currentOpenedAppId) return Promise.reject(new Error('应用未加载'));
        return fetch(`/api/user/apps/${currentOpenedAppId}/tune`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instruction: String(instruction || '').trim(),
                mode: mode === 'apply' ? 'apply' : 'preview'
            })
        })
        .then(async response => {
            const rawText = await response.text();
            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (error) {
                throw new Error('微调服务返回异常内容，请稍后重试');
            }
            if (!response.ok || data.error) {
                throw new Error(data.error || `微调失败（${response.status}）`);
            }
            return data;
        });
    }

    function initAppBridge() {
        if (appBridgeInited) return;
        appBridgeInited = true;
        window.addEventListener('message', (event) => {
            const payload = event.data || {};
            if (payload.type !== 'app-ai-request') return;
            const requestId = payload.requestId;
            const source = event.source;
            if (!source || typeof source.postMessage !== 'function') return;
            const action = payload.action || 'coach';
            const userInput = payload.user_input || '';
            requestAppAiAction(action, userInput, userInput || '请给出学习建议')
            .then(answer => {
                source.postMessage({
                    type: 'app-ai-response',
                    requestId,
                    answer
                }, '*');
            })
            .catch(error => {
                source.postMessage({
                    type: 'app-ai-response',
                    requestId,
                    error: error.message || 'AI请求失败'
                }, '*');
            });
        });
    }

    function composeRuntimeSrcDoc(uiBundle) {
        const html = String(uiBundle?.html || '');
        const css = String(uiBundle?.css || '');
        const js = String(uiBundle?.js || '').replace(/<\/script>/gi, '<\\/script>');
        const bridgeScript = `
            (() => {
                const pending = new Map();
                window.requestAppAI = (action, input) => new Promise((resolve, reject) => {
                    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2);
                    pending.set(requestId, { resolve, reject });
                    window.parent.postMessage({ type: 'app-ai-request', requestId, action, user_input: input || '' }, '*');
                    setTimeout(() => {
                        if (pending.has(requestId)) {
                            pending.delete(requestId);
                            reject(new Error('AI响应超时，请重试'));
                        }
                    }, 45000);
                });
                window.addEventListener('message', (event) => {
                    const data = event.data || {};
                    if (data.type !== 'app-ai-response') return;
                    const job = pending.get(data.requestId);
                    if (!job) return;
                    pending.delete(data.requestId);
                    if (data.error) {
                        job.reject(new Error(data.error));
                    } else {
                        job.resolve(data.answer || '');
                    }
                });
            })();
        `.replace(/<\/script>/gi, '<\\/script>');
        return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:#f8fafc;font-family:Inter,'Microsoft YaHei',sans-serif;} ${css}</style></head><body>${html}<script>${bridgeScript}</script><script>${js}</script></body></html>`;
    }

    function bindAppPlayerInteractions() {
        initAppBridge();
        const appAiInput = appPlayerContent.querySelector('#appAiInput');
        const appAiOutput = appPlayerContent.querySelector('#appAiOutput');
        const appTuneInput = appPlayerContent.querySelector('#appTuneInput');
        const appTuneStatus = appPlayerContent.querySelector('#appTuneStatus');
        const appAiHistory = appPlayerContent.querySelector('#appAiHistory');
        const quickBtns = appPlayerContent.querySelectorAll('.app-ai-quick-btn');
        const actionNameMap = {
            coach: '教练答疑',
            explain: '讲解知识点',
            practice: '生成练习题'
        };
        const refreshHistory = () => {
            if (!appAiHistory) return;
            if (!appRuntimeState.aiHistory.length) {
                appAiHistory.innerHTML = '<li class="app-ai-history-empty">暂无记录，开始一次提问吧。</li>';
                return;
            }
            appAiHistory.innerHTML = appRuntimeState.aiHistory.slice(0, 6).map(item => `
                <li class="app-ai-history-item">
                    <span>${item.mode}</span>
                    <p>${item.question}</p>
                </li>
            `).join('');
        };
        refreshHistory();
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!appAiInput) return;
                appAiInput.value = btn.dataset.prompt || '';
                appAiInput.focus();
            });
        });
        appPlayerContent.querySelectorAll('.app-ai-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action || 'coach';
                const content = (appAiInput?.value || '').trim();
                appRuntimeState.activeAction = action;
                appPlayerContent.querySelectorAll('.app-ai-action-btn').forEach(item => {
                    item.classList.toggle('active', item === btn);
                });
                appPlayerContent.querySelectorAll('.app-ai-action-btn').forEach(item => {
                    item.disabled = true;
                });
                appAiOutput.innerHTML = '<div class="app-ai-loading"><span></span><span></span><span></span> AI 正在生成中...</div>';
                requestAppAiAction(action, content, `请围绕${appRuntimeState.topic || '当前主题'}给出${action}建议`)
                .then(answer => {
                    appAiOutput.innerHTML = renderMarkdown(answer);
                    const question = content || `围绕${appRuntimeState.topic || '当前主题'}进行${actionNameMap[action] || action}`;
                    appRuntimeState.aiHistory.unshift({ mode: actionNameMap[action] || action, question });
                    refreshHistory();
                })
                .catch(error => {
                    appAiOutput.textContent = error.message || 'AI 输出失败';
                })
                .finally(() => {
                    appPlayerContent.querySelectorAll('.app-ai-action-btn').forEach(item => {
                        item.disabled = false;
                    });
                });
            });
        });

        const appAiClearBtn = appPlayerContent.querySelector('#appAiClearBtn');
        if (appAiClearBtn) {
            appAiClearBtn.addEventListener('click', () => {
                if (appAiOutput) appAiOutput.textContent = '这里会显示 AI 输出结果。';
                if (appAiInput) appAiInput.value = '';
            });
        }
        const appAiCopyBtn = appPlayerContent.querySelector('#appAiCopyBtn');
        if (appAiCopyBtn) {
            appAiCopyBtn.addEventListener('click', () => {
                const plain = (appAiOutput?.textContent || '').trim();
                if (!plain) return;
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(plain);
                }
            });
        }

        const appTunePreviewBtn = appPlayerContent.querySelector('#appTunePreviewBtn');
        if (appTunePreviewBtn) {
            appTunePreviewBtn.addEventListener('click', () => {
                const instruction = (appTuneInput?.value || '').trim();
                if (!instruction) {
                    if (appTuneStatus) appTuneStatus.textContent = '请先输入微调需求';
                    return;
                }
                appTunePreviewBtn.disabled = true;
                if (appTuneStatus) appTuneStatus.innerHTML = '<div class="app-ai-loading"><span></span><span></span><span></span> 正在生成微调预览...</div>';
                requestAppTuneAction(instruction, 'preview')
                .then(result => {
                    if (result.ui_bundle) {
                        appRuntimeState.pendingTuneBundle = result.ui_bundle;
                        const runtimeFrame = appPlayerContent.querySelector('#appRuntimeFrame');
                        if (runtimeFrame) runtimeFrame.srcdoc = composeRuntimeSrcDoc(result.ui_bundle);
                    }
                    if (appTuneStatus) appTuneStatus.textContent = result.message || '已完成预览';
                })
                .catch(error => {
                    if (appTuneStatus) appTuneStatus.textContent = error.message || '微调预览失败';
                })
                .finally(() => {
                    appTunePreviewBtn.disabled = false;
                });
            });
        }
        const appTuneApplyBtn = appPlayerContent.querySelector('#appTuneApplyBtn');
        if (appTuneApplyBtn) {
            appTuneApplyBtn.addEventListener('click', () => {
                const instruction = (appTuneInput?.value || '').trim();
                if (!instruction) {
                    if (appTuneStatus) appTuneStatus.textContent = '请先输入微调需求';
                    return;
                }
                appTuneApplyBtn.disabled = true;
                if (appTuneStatus) appTuneStatus.innerHTML = '<div class="app-ai-loading"><span></span><span></span><span></span> 正在应用微调...</div>';
                requestAppTuneAction(instruction, 'apply')
                .then(result => {
                    if (result.ui_bundle) {
                        appRuntimeState.uiBundle = result.ui_bundle;
                        appRuntimeState.pendingTuneBundle = null;
                        const runtimeFrame = appPlayerContent.querySelector('#appRuntimeFrame');
                        if (runtimeFrame) runtimeFrame.srcdoc = composeRuntimeSrcDoc(result.ui_bundle);
                    }
                    if (appTuneStatus) appTuneStatus.textContent = result.message || '微调已应用';
                })
                .catch(error => {
                    if (appTuneStatus) appTuneStatus.textContent = error.message || '应用微调失败';
                })
                .finally(() => {
                    appTuneApplyBtn.disabled = false;
                });
            });
        }

        const runtimeFrame = appPlayerContent.querySelector('#appRuntimeFrame');
        const appRuntimeRefreshBtn = appPlayerContent.querySelector('#appRuntimeRefreshBtn');
        if (appRuntimeRefreshBtn) {
            appRuntimeRefreshBtn.addEventListener('click', () => {
                if (runtimeFrame && appRuntimeState.uiBundle) {
                    runtimeFrame.srcdoc = composeRuntimeSrcDoc(appRuntimeState.uiBundle);
                }
            });
        }
        const appRuntimeFullscreenBtn = appPlayerContent.querySelector('#appRuntimeFullscreenBtn');
        if (appRuntimeFullscreenBtn) {
            appRuntimeFullscreenBtn.addEventListener('click', () => {
                if (!runtimeFrame) return;
                if (runtimeFrame.requestFullscreen) {
                    runtimeFrame.requestFullscreen();
                }
            });
        }
        if (runtimeFrame && appRuntimeState.uiBundle) {
            runtimeFrame.srcdoc = composeRuntimeSrcDoc(appRuntimeState.uiBundle);
        }
    }

    function bindAppActions(container, reloadFn) {
        if (!container) return;
        container.querySelectorAll('.open-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = '打开中...';
                fetch(`/api/user/apps/${btn.dataset.id}/open`)
                .then(response => response.json())
                .then(result => {
                    if (result.error) throw new Error(result.error);
                    renderAppPlayer(result);
                    switchView('app-player');
                    const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
                    navItems.forEach(nav => nav.classList.remove('active'));
                    if (navTarget) navTarget.classList.add('active');
                })
                .catch(error => alert(error.message || '打开应用失败'))
                .finally(() => {
                    btn.disabled = false;
                    btn.textContent = originalText;
                });
            });
        });
        container.querySelectorAll('.publish-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                fetch(`/api/user/apps/${btn.dataset.id}/publish`, { method: 'POST' })
                .then(response => response.json())
                .then(result => {
                    if (result.error) throw new Error(result.error);
                    reloadFn();
                })
                .catch(error => alert(error.message || '发布失败'));
            });
        });
        container.querySelectorAll('.share-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                fetch(`/api/user/apps/${btn.dataset.id}/share`, { method: 'POST' })
                .then(response => response.json())
                .then(result => {
                    if (result.error) throw new Error(result.error);
                    const fullUrl = `${window.location.origin}${result.share_url}`;
                    if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(fullUrl).then(() => alert(`分享链接已复制：${fullUrl}`)).catch(() => alert(`分享链接：${fullUrl}`));
                    } else {
                        alert(`分享链接：${fullUrl}`);
                    }
                    reloadFn();
                })
                .catch(error => alert(error.message || '分享失败'));
            });
        });
        container.querySelectorAll('.unshare-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                fetch(`/api/user/apps/${btn.dataset.id}/unshare`, { method: 'POST' })
                .then(response => response.json())
                .then(result => {
                    if (result.error) throw new Error(result.error);
                    reloadFn();
                })
                .catch(error => alert(error.message || '取消分享失败'));
            });
        });
        container.querySelectorAll('.delete-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const confirmed = window.confirm('删除后不可恢复，确认删除该应用吗？');
                if (!confirmed) return;
                fetch(`/api/user/apps/${btn.dataset.id}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(result => {
                    if (result.error) throw new Error(result.error);
                    reloadFn();
                })
                .catch(error => alert(error.message || '删除失败'));
            });
        });
    }

    function loadUserCenterData() {
        fetch('/api/auth/me')
        .then(response => response.json())
        .then(data => {
            currentUser = data.authenticated ? data.user : null;
            renderUserSession();
            if (currentUser) {
                loadUserAssets();
                loadUserApps();
                loadSocialProfile();
            } else {
                assetsList.innerHTML = '<p class="user-empty">登录后查看资产</p>';
                devAppsList.innerHTML = '<p class="user-empty">登录后管理应用</p>';
                socialProfileInfo.textContent = '登录后配置社交主页';
            }
            loadLearningSnapshot();
            loadQuickSettings();
        })
        .catch(() => {
            authStatusPanel.textContent = '状态加载失败';
        });
    }

    function renderUserSession() {
        if (!authStatusPanel || !userRoleChip) return;
        if (!currentUser) {
            authStatusPanel.innerHTML = '当前未登录';
            userRoleChip.textContent = '未登录';
            return;
        }
        authStatusPanel.innerHTML = `
            <div><strong>${currentUser.display_name}</strong></div>
            <div>${currentUser.email}</div>
            <div>角色：${currentUser.role}</div>
        `;
        userRoleChip.textContent = currentUser.role === 'admin' ? '管理员' : '普通用户';
    }

    function loadUserAssets() {
        fetch('/api/user/assets')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                assetsList.innerHTML = '<p class="user-empty">资产加载失败</p>';
                return;
            }
            if (!data.length) {
                assetsList.innerHTML = '<p class="user-empty">暂无资产</p>';
                return;
            }
            assetsList.innerHTML = data.map(item => `
                <div class="user-list-item">
                    <div>
                        <h4>${item.asset_name}</h4>
                        <p>${item.asset_type} · ${item.updated_at || ''}</p>
                    </div>
                    <strong>${Number(item.asset_value).toFixed(2)}</strong>
                </div>
            `).join('');
        })
        .catch(() => {
            assetsList.innerHTML = '<p class="user-empty">资产加载失败</p>';
        });
    }

    function loadUserApps() {
        fetch('/api/user/apps')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                devAppsList.innerHTML = '<p class="user-empty">应用加载失败</p>';
                return;
            }
            if (!data.length) {
                devAppsList.innerHTML = '<p class="user-empty">暂无应用草稿</p>';
                return;
            }
            devAppsList.innerHTML = data.map(item => `
                <div class="user-list-item">
                    <div>
                        <h4>${item.title}</h4>
                        <p>${item.status} · ${item.visibility} · ${item.app_type || 'manual'}${item.generation_model ? ` · ${item.generation_model}` : ''}</p>
                    </div>
                    <div class="user-app-actions">
                        <button class="open-app-btn" data-id="${item.id}">打开</button>
                        <button class="publish-app-btn" data-id="${item.id}">发布</button>
                        <button class="share-app-btn" data-id="${item.id}">分享</button>
                        <button class="unshare-app-btn" data-id="${item.id}">取消分享</button>
                        <button class="delete-app-btn" data-id="${item.id}">删除</button>
                    </div>
                </div>
            `).join('');
            bindAppActions(devAppsList, loadUserApps);
        })
        .catch(() => {
            devAppsList.innerHTML = '<p class="user-empty">应用加载失败</p>';
        });
    }

    function openCreateAiAppFlow() {
        switchView('ai-studio');
        const navTarget = document.querySelector('.nav-item[data-target="ai-market"]');
        navItems.forEach(nav => nav.classList.remove('active'));
        if (navTarget) navTarget.classList.add('active');
        showStudioNotice('先描述你要做的学习应用，AI 会引导你补全需求。');
    }

    function loadSocialProfile() {
        fetch('/api/user/social-profile')
        .then(response => response.json())
        .then(data => {
            socialBioInput.value = data.bio || '';
            socialSkillsInput.value = data.skills || '';
            allowCollabInput.checked = Boolean(data.allow_collab);
            socialProfileInfo.textContent = `粉丝 ${data.followers || 0} · 关注 ${data.following || 0}`;
        })
        .catch(() => {
            socialProfileInfo.textContent = '社交主页加载失败';
        });
    }

    function loadLearningSnapshot() {
        fetch('/api/analytics')
        .then(response => response.json())
        .then(data => {
            learningHoursValue.textContent = `${data.total_hours || 0}h`;
            learningStreakValue.textContent = `${data.streak_days || 0}天`;
            learningCompletedValue.textContent = `${data.courses_completed || 0}个`;
            const topSubjects = (data.subject_distribution || [])
                .slice(0, 3)
                .map(item => `${item.name} ${item.value}%`)
                .join(' · ');
            learningSubjectSummary.textContent = topSubjects ? `科目分布：${topSubjects}` : '暂无学习分布数据';
        })
        .catch(() => {
            learningSubjectSummary.textContent = '学习数据加载失败';
        });
    }

    function loadQuickSettings() {
        fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            if (quickSettingEmailDigest) quickSettingEmailDigest.checked = Boolean(data.notifications?.email_digest);
            if (quickSettingNewCourse) quickSettingNewCourse.checked = Boolean(data.notifications?.new_course_alert);
            if (zhipuApiKeyHint) {
                zhipuApiKeyHint.textContent = data.ai?.has_api_key
                    ? `已配置智谱 API Key：${data.ai?.api_key_masked || ''}`
                    : '尚未检测到已保存的 API Key';
            }
            if (zhipuApiKeyInput) zhipuApiKeyInput.value = '';
            quickSettingsStatus.textContent = `当前主题：${data.appearance?.theme || 'light'}`;
        })
        .catch(() => {
            quickSettingsStatus.textContent = '设置加载失败';
        });
    }

    function loadLearningQuestBootstrap() {
        if (questBootstrapped) return;
        fetch('/api/learning-quest/bootstrap')
        .then(response => response.json())
        .then(data => {
            const presets = data.style_presets || [];
            questStyleSelect.innerHTML = presets.map(item => `<option value="${item}">${item}</option>`).join('');
            const topicText = (data.focus_topics || []).map(item => `#${item}`).join(' ');
            const folderText = (data.knowledge_folders || []).join(' / ');
            questBootstrapMeta.innerHTML = `
                <span class="quest-mini-chip"><i class="fa-solid fa-hashtag"></i> 热门主题 ${topicText || '暂无'}</span>
                <span class="quest-mini-chip"><i class="fa-solid fa-folder-open"></i> 资料分区 ${folderText || '暂无'}</span>
            `;
            renderQuestResources(data.resource_pool || []);
            questBootstrapped = true;
        })
        .catch(() => {
            questBootstrapMeta.innerHTML = '<span class="quest-mini-chip">初始化失败，请稍后重试</span>';
        });
    }

    function renderQuestResources(resources) {
        if (!resources || resources.length === 0) {
            questResourcePool.innerHTML = '<p style="color:var(--text-secondary);">暂无推荐资源</p>';
            return;
        }
        questResourcePool.innerHTML = resources.slice(0, 6).map(item => `
            <div class="quest-resource-item">
                <span class="quest-resource-type">${item.type || '资源'}</span>
                <div>
                    <strong>${item.title || ''}</strong>
                    <p>${item.category || '通用分类'}</p>
                </div>
            </div>
        `).join('');
    }

    function renderQuestPlan(list) {
        if (!list || list.length === 0) {
            questMissionList.innerHTML = '<div class="chart-placeholder">暂无任务</div>';
            updateQuestProgress();
            return;
        }
        questMissionList.innerHTML = '';
        list.forEach(item => {
            const card = document.createElement('article');
            card.className = 'quest-mission-card';
            card.innerHTML = `
                <div class="quest-mission-top">
                    <div>
                        <h4>${item.title}</h4>
                        <span>${item.stage} · Day ${item.day} · ${item.minutes} 分钟</span>
                    </div>
                    <label class="quest-check">
                        <input type="checkbox" data-quest-id="${item.id}">
                        <i class="fa-solid fa-check"></i>
                    </label>
                </div>
                <p>${item.objective}</p>
                <div class="quest-mission-foot">
                    <i class="fa-solid fa-book-open"></i>
                    <span>${item.resource_hint}</span>
                </div>
            `;
            const checkbox = card.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    questCompleted.add(item.id);
                    card.classList.add('done');
                } else {
                    questCompleted.delete(item.id);
                    card.classList.remove('done');
                }
                updateQuestProgress();
            });
            questMissionList.appendChild(card);
        });
        updateQuestProgress();
    }

    function updateQuestProgress() {
        const total = questPlan.length;
        const done = questCompleted.size;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        questProgressChip.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> 进度 ${percent}%`;
        questCountChip.innerHTML = `<i class="fa-solid fa-list-check"></i> 任务 ${done}/${total}`;
    }

    function loadMemoryLabBootstrap() {
        if (memoryBootstrapped) return;
        fetch('/api/memory-lab/bootstrap')
        .then(response => response.json())
        .then(data => {
            memoryModeSelect.innerHTML = (data.review_modes || []).map(item => `<option value="${item}">${item}</option>`).join('');
            memoryDifficultySelect.innerHTML = (data.difficulty_levels || []).map(item => `<option value="${item}">${item}</option>`).join('');
            memoryBootstrapMeta.innerHTML = (data.hot_topics || []).map(item => `<span class="memory-mini-chip">#${item}</span>`).join('');
            renderMemoryResources(data.materials || []);
            memoryBootstrapped = true;
        })
        .catch(() => {
            memoryBootstrapMeta.innerHTML = '<span class="memory-mini-chip">初始化失败</span>';
        });
    }

    function renderMemoryResources(list) {
        if (!list || list.length === 0) {
            memoryResourceList.innerHTML = '<p style="color:var(--text-secondary);">暂无资源</p>';
            return;
        }
        memoryResourceList.innerHTML = list.map(item => `
            <div class="memory-resource-item">
                <span>${item.type || '资源'}</span>
                <div>
                    <strong>${item.title || ''}</strong>
                    <p>${item.category || '通用'}</p>
                </div>
            </div>
        `).join('');
    }

    function renderCurrentMemoryCard() {
        if (!memoryCards.length) {
            memoryCardBoard.innerHTML = '<div class="chart-placeholder">请先生成记忆卡组</div>';
            updateMemoryStats();
            return;
        }
        if (memoryIndex >= memoryCards.length) {
            memoryCardBoard.innerHTML = '<div class="chart-placeholder">本轮卡片训练已完成，可生成训练报告</div>';
            updateMemoryStats();
            return;
        }
        const card = memoryCards[memoryIndex];
        memoryCardBoard.innerHTML = `
            <article class="memory-card">
                <div class="memory-card-head">
                    <span>卡片 ${memoryIndex + 1}/${memoryCards.length}</span>
                    <span>${card.difficulty}</span>
                </div>
                <h4>${card.question}</h4>
                <p class="memory-hint">${card.hint || ''}</p>
                <details class="memory-answer-reveal">
                    <summary>显示参考答案</summary>
                    <div>${card.answer}</div>
                </details>
            </article>
        `;
        updateMemoryStats();
    }

    function updateMemoryStats() {
        const total = memoryCards.length;
        const done = memoryRecords.length;
        const weak = memoryRecords.filter(item => item.level !== '记住').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        memoryProgressChip.innerHTML = `<i class="fa-solid fa-gauge-high"></i> 进度 ${percent}%`;
        memoryWeakChip.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 薄弱 ${weak}`;
    }

    // Knowledge Hub Logic
    function setKnowledgeHubStatus(text, isError = false) {
        if (!knowledgeHubStatus) return;
        knowledgeHubStatus.textContent = text;
        knowledgeHubStatus.classList.toggle('error', Boolean(isError));
    }

    function saveLatestCourseToKnowledge() {
        if (!latestGeneratedCourse || !latestGeneratedCourse.title) {
            setKnowledgeHubStatus('请先在“PPT语音博客工坊”生成课程后再保存', true);
            return Promise.resolve(false);
        }
        return fetch('/api/knowledge/courses/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(latestGeneratedCourse)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            setKnowledgeHubStatus('课程已保存到知识库');
            loadKnowledgeBase();
            return true;
        })
        .catch(error => {
            setKnowledgeHubStatus(error.message || '保存课程失败', true);
            return false;
        });
    }

    function renderKnowledgeCards(items, type) {
        if (!items || items.length === 0) {
            return '<div class="knowledge-empty">暂无内容</div>';
        }
        return items.map(item => {
            const cover = item.cover_image || item.payload?.lesson_units?.[0]?.image_url || '';
            const coverHtml = cover
                ? `<img class="knowledge-card-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(item.title || '')}">`
                : `<div class="knowledge-card-cover placeholder"><i class="fa-solid fa-book-open"></i></div>`;
            const scoreHtml = item.recommend_score ? `<span class="knowledge-chip score">推荐分 ${Math.round(item.recommend_score)}</span>` : '';
            const visibility = item.visibility === 'public' ? '公开' : '私有';
            let actionHtml = `<button class="knowledge-card-btn favorite" data-id="${item.id || ''}" data-type="${type}" data-title="${escapeHtml(item.title || '')}" data-summary="${escapeHtml(item.summary || item.description || '')}" data-cover="${escapeHtml(cover)}" data-action="favorite">收藏</button>`;
            if (type === 'mine' || type === 'notes') {
                actionHtml = `
                    <button class="knowledge-card-btn publish" data-id="${item.id}" data-action="toggle-publish">${item.visibility === 'public' ? '取消公开' : '公开到社区'}</button>
                    <button class="knowledge-card-btn delete" data-id="${item.id}" data-action="delete-course">删除</button>
                `;
            }
            if (type === 'favorites') {
                actionHtml = `<button class="knowledge-card-btn delete" data-id="${item.id}" data-action="delete-favorite">删除收藏</button>`;
            }
            const routeData = type === 'mine' || type === 'public' || type === 'featured' || type === 'notes'
                ? `data-route="${item.route_target || (item.type === 'app' ? 'app' : 'course')}" data-token="${item.share_token || ''}" data-item-id="${item.id || ''}" data-item-type="${item.type || ''}"`
                : '';
            return `
                <article class="knowledge-card" ${routeData}>
                    ${coverHtml}
                    <div class="knowledge-card-body">
                        <h4>${escapeHtml(item.title || '未命名内容')}</h4>
                        <p>${escapeHtml(item.summary || item.description || '暂无摘要')}</p>
                        <div class="knowledge-card-meta">
                            <span class="knowledge-chip">${visibility}</span>
                            ${scoreHtml}
                        </div>
                        <div class="knowledge-card-actions">${actionHtml}</div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderKnowledgeHub() {
        if (!knowledgeHubMine) return;
        knowledgeHubMine.innerHTML = renderKnowledgeCards(knowledgeHubCache.my_courses, 'mine');
        if (knowledgeHubNotes) knowledgeHubNotes.innerHTML = renderKnowledgeCards(knowledgeHubCache.my_notes, 'notes');
        knowledgeHubFavorites.innerHTML = renderKnowledgeCards(knowledgeHubCache.my_favorites, 'favorites');
        const publicMix = [...(knowledgeHubCache.public_courses || []), ...(knowledgeHubCache.public_apps || [])];
        knowledgeHubPublic.innerHTML = renderKnowledgeCards(publicMix, 'public');
        knowledgeHubFeatured.innerHTML = renderKnowledgeCards(knowledgeHubCache.featured_recommendations || [], 'featured');
    }

    function loadKnowledgeBase() {
        fetch('/api/knowledge/hub')
        .then(async response => {
            const text = await response.text();
            if (!text || !text.trim()) {
                throw new Error('知识库接口返回为空');
            }
            try {
                return JSON.parse(text);
            } catch (error) {
                const retry = await fetch('/api/knowledge/hub', { cache: 'no-store' });
                const retryText = await retry.text();
                if (!retryText || !retryText.trim()) {
                    throw new Error('知识库数据为空，请刷新后重试');
                }
                return JSON.parse(retryText);
            }
        })
        .then(data => {
            knowledgeHubCache = {
                my_courses: data.my_courses || [],
                my_notes: data.my_notes || [],
                my_favorites: data.my_favorites || [],
                public_courses: data.public_courses || [],
                public_apps: data.public_apps || [],
                featured_recommendations: data.featured_recommendations || []
            };
            renderKnowledgeHub();
            setKnowledgeHubStatus('知识库已更新');
        })
        .catch(error => {
            setKnowledgeHubStatus(error.message || '知识库加载失败', true);
        });
    }

    // --- My Notes View Logic ---
    window.loadMyNotes = async function() {
        const container = document.getElementById('myNotesContainer');
        if(!container) return;
        
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">加载中... <i class="fa-solid fa-spinner fa-spin"></i></div>';
        
        try {
            const res = await fetch('/api/notes');
            const data = await res.json();
            
            if (data.notes && data.notes.length > 0) {
                // Store notes in a global object to avoid passing massive strings in HTML attributes
                window._notesCache = {};
                
                container.innerHTML = data.notes.map(note => {
                    const noteId = note.id || Math.random().toString(36).substr(2, 9);
                    window._notesCache[noteId] = note;
                    
                    return `
                    <div class="knowledge-card" style="background: var(--surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: var(--transition); cursor: pointer;" onclick="openNoteDetailById('${noteId}')">
                        <h3 style="font-size: 1.1rem; color: var(--text-color); margin: 0; display: flex; align-items: center; gap: 0.5rem;"><i class="fa-solid fa-file-lines" style="color: var(--primary);"></i> ${escapeHtml(note.title || '无标题笔记')}</h3>
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(note.summary || '暂无摘要')}</p>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: auto; display: flex; justify-content: space-between;">
                            <span><i class="fa-regular fa-clock"></i> ${new Date(note.created_at).toLocaleDateString()}</span>
                            <span>点击查看详情 <i class="fa-solid fa-arrow-right"></i></span>
                        </div>
                    </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem; background: var(--surface); border-radius: 12px; border: 1px dashed var(--border-color);">
                        <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>暂无笔记内容</p>
                        <span style="font-size: 0.9rem;">快去 StudioCopilot 的工作台中生成并保存你的专属学习笔记吧！</span>
                    </div>`;
            }
        } catch (err) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 2rem;">加载失败，请检查网络或稍后重试。</div>';
            console.error('Failed to load notes:', err);
        }
    };

    window.openNoteDetailById = function(noteId) {
        try {
            const note = window._notesCache[noteId];
            if (!note) {
                alert("无法找到笔记数据");
                return;
            }
            
            document.getElementById('noteDetailTitle').textContent = note.title || '笔记详情';
            
            let payload = {};
            if (typeof note.payload_json === 'string') {
                try { payload = JSON.parse(note.payload_json); } catch(e) {}
            } else if (typeof note.payload_json === 'object') {
                payload = note.payload_json;
            }
            
            let html = '';
            
            if (payload.htmlSnapshot) {
                // 如果有快照，使用 iframe 渲染以确保 CSS 和环境完全隔离生效
                // 构建包含原页面样式的完整 HTML 文档
                const iframeHtml = `
                    <!DOCTYPE html>
                    <html lang="zh-CN">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>笔记快照</title>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                        <link rel="stylesheet" href="/static/css/style.css">
                        <link rel="stylesheet" href="/static/css/mindmapnode.css">
                        <style>
                            body { margin: 0; padding: 0; overflow: hidden; height: 100vh; width: 100vw; background: #f8fafc !important; }
                            .workspace-grid { height: 100% !important; min-height: 100vh !important; }
                            
                            /* 允许交互，但隐藏不必要的工具栏和输入框 */
                            .chat-input-container, .upload-area, .studio-card { pointer-events: none !important; opacity: 0.7; }
                            
                            /* 隐藏悬浮按钮 */
                            .floating-action-btn { display: none !important; }
                            
                            /* 允许滚动和点击的部分 */
                            .workspace-left-panel, .workspace-middle-panel, .workspace-right-panel, .stage-content { overflow-y: auto !important; }
                            
                            /* 确保玻璃拟态背景和原版一致 */
                            .workspace-left-panel { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(12px) !important; }
                            .workspace-middle-panel { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(12px) !important; }
                            .workspace-right-panel { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(12px) !important; }
                        </style>
                    </head>
                    <body>
                        <div class="workspace-snapshot-container" style="width: 100%; height: 100%;">
                            ${payload.htmlSnapshot}
                        </div>
                        
                        <!-- 注入必要的 JS 逻辑，让展开/收起和题目交互能够工作 -->
                        <script>
                            // 恢复交互事件的绑定
                            document.addEventListener('DOMContentLoaded', () => {
                                // 重新绑定所有工具栏折叠按钮
                                document.querySelectorAll('.panel-collapse-btn').forEach(btn => {
                                    btn.addEventListener('click', function() {
                                        const panel = this.closest('.workspace-left-panel, .workspace-right-panel');
                                        if (panel) {
                                            panel.classList.toggle('collapsed');
                                            const icon = this.querySelector('i');
                                            if (icon.classList.contains('fa-chevron-left')) {
                                                icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                                            } else {
                                                icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                                            }
                                        }
                                    });
                                });
                                
                                // 重新绑定选择题交互
                                document.querySelectorAll('.textbook-quiz-box').forEach(box => {
                                    const options = box.querySelectorAll('.quiz-option');
                                    const explanation = box.querySelector('.quiz-explanation');
                                    const correctAnswer = box.getAttribute('data-correct-answer');
                                    
                                    options.forEach(opt => {
                                        opt.addEventListener('click', function() {
                                            options.forEach(o => o.style.pointerEvents = 'none');
                                            const selectedValue = this.getAttribute('data-value');
                                            if (selectedValue === correctAnswer) {
                                                this.style.backgroundColor = '#dcfce7';
                                                this.style.borderColor = '#22c55e';
                                                this.style.color = '#166534';
                                            } else {
                                                this.style.backgroundColor = '#fee2e2';
                                                this.style.borderColor = '#ef4444';
                                                this.style.color = '#991b1b';
                                                const correctOpt = Array.from(options).find(o => o.getAttribute('data-value') === correctAnswer);
                                                if (correctOpt) {
                                                    correctOpt.style.backgroundColor = '#dcfce7';
                                                    correctOpt.style.borderColor = '#22c55e';
                                                    correctOpt.style.color = '#166534';
                                                }
                                            }
                                            if (explanation) explanation.style.display = 'block';
                                        });
                                    });
                                });
                            });
                        </script>
                    </body>
                    </html>
                `;

                html += `<iframe 
                            srcdoc="${escapeHtml(iframeHtml).replace(/"/g, '&quot;')}" 
                            style="width: 100%; height: 100%; border: none; background: transparent;" 
                            sandbox="allow-same-origin allow-scripts">
                         </iframe>`;
            } else {
                // 兼容旧版仅保存文本的笔记
                if (payload.sources && payload.sources.length > 0) {
                    html += `<h4 style="margin-top: 0; color: var(--primary);"><i class="fa-solid fa-layer-group"></i> 关联解析来源</h4><ul style="padding-left: 1.5rem; margin-bottom: 1.5rem;">`;
                    payload.sources.forEach(s => {
                        html += `<li style="margin-bottom: 0.5rem;"><strong>${escapeHtml(s.title || '未知来源')}</strong> <span style="color: var(--text-muted); font-size: 0.8rem;">(${escapeHtml(s.type || 'unknown')})</span></li>`;
                    });
                    html += `</ul><hr style="border: 0; border-top: 1px solid var(--border-color); margin: 1.5rem 0;">`;
                }
                
                if (payload.chatHistory) {
                    html += `<h4 style="color: var(--primary);"><i class="fa-solid fa-comments"></i> 互动记录与内容生成</h4>`;
                    
                    if (typeof marked !== 'undefined') {
                        const parsedHtml = marked.parse(payload.chatHistory);
                        html += `<div style="background: var(--bg-color); padding: 1.25rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color); font-size: 0.95rem; overflow-x: auto;" class="markdown-body">${parsedHtml}</div>`;
                    } else {
                        const lines = payload.chatHistory.split('\n\n');
                        lines.forEach(line => {
                            if(line.trim()) {
                                html += `<div style="background: var(--bg-color); padding: 1.25rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color); white-space: pre-wrap; font-size: 0.95rem; overflow-x: auto;">${escapeHtml(line.trim())}</div>`;
                            }
                        });
                    }
                }
            }
            
            if (!html) {
                html = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">此笔记似乎空空如也~</div>';
            }
            
            document.getElementById('noteDetailContent').innerHTML = html;
            
            // Set up delete button
            const deleteBtn = document.getElementById('deleteNoteBtn');
            if (deleteBtn) {
                // Clone and replace to remove old event listeners
                const newBtn = deleteBtn.cloneNode(true);
                deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
                newBtn.addEventListener('click', async () => {
                    if (confirm('确定要删除这篇笔记吗？删除后无法恢复。')) {
                        try {
                            const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
                            const result = await res.json();
                            if (res.ok && result.status === 'success') {
                                document.getElementById('noteDetailModal').style.display = 'none';
                                loadMyNotes(); // Reload the list
                            } else {
                                alert('删除失败: ' + (result.error || '未知错误'));
                            }
                        } catch (err) {
                            alert('请求失败: ' + err.message);
                        }
                    }
                });
            }
            
            document.getElementById('noteDetailModal').style.display = 'flex';
        } catch(e) {
            console.error('Failed to parse note detail:', e);
            alert("读取笔记详情失败，请在控制台查看详细报错。");
        }
    };

    // Helper to create card HTML (Reused)
    function createCard(item) {
        const card = document.createElement('div');
        card.classList.add('material-card');
        
        card.innerHTML = `
            <div class="material-image" style="background-image: url('${item.image || ''}')"></div>
            <span class="material-type-badge">${item.type}</span>
            <div class="material-content">
                <div class="material-category">${item.category || 'General'}</div>
                <h3 class="material-title">${item.title}</h3>
                <p class="material-desc">${item.description || ''}</p>
                <div class="material-footer">
                    <span><i class="fa-regular fa-calendar"></i> ${item.date}</span>
                    <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
                </div>
            </div>
        `;
        return card;
    }

    function appendMessage(text, sender, materials = []) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-brain"></i>';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.width = '100%';

        const content = document.createElement('div');
        content.classList.add('message-content');
        // Convert newlines to <br> for simple formatting
        content.innerHTML = text.replace(/\n/g, '<br>');
        
        contentWrapper.appendChild(content);

        // Render Materials if any (Only for AI)
        if (sender === 'ai' && materials && materials.length > 0) {
            const grid = document.createElement('div');
            grid.classList.add('materials-grid-container');
            grid.style.marginTop = '1.5rem';

            materials.forEach((item, index) => {
                const card = createCard(item);
                 // Staggered animation
                 card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;
                grid.appendChild(card);
            });
            
            contentWrapper.appendChild(grid);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentWrapper);
        
        chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageDiv;
    }

    // Initial Load
    loadDiscoveryContent();

    if (createAiAppBtn) {
        createAiAppBtn.addEventListener('click', () => {
            openCreateAiAppFlow();
        });
    }

    if (openAiStudioBtn) {
        openAiStudioBtn.addEventListener('click', () => {
            openCreateAiAppFlow();
        });
    }

    if (openMyAppsBtn) {
        openMyAppsBtn.addEventListener('click', () => {
            switchView('my-apps');
            const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
            navItems.forEach(nav => nav.classList.remove('active'));
            if (navTarget) navTarget.classList.add('active');
        });
    }

    if (studioSendBtn) {
        studioSendBtn.addEventListener('click', () => sendStudioMessage());
    }

    if (studioInput) {
        studioInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendStudioMessage();
            }
        });
    }

    if (studioGenerateBtn) {
        studioGenerateBtn.addEventListener('click', () => {
            fetch('/api/auth/me')
            .then(response => response.json())
            .then(auth => {
                if (!auth.authenticated) {
                    switchView('user-center');
                    showStudioNotice('请先登录后再生成应用，已为你打开用户中心。', true);
                    return;
                }
                const payload = pullStudioForm();
                if (!payload.learning_topic) {
                    updateStudioReadiness(false, ['learning_topic']);
                    showStudioNotice('请先补充学习主题。', true);
                    return;
                }
                setStudioLoading(true, 'AI 正在生成应用蓝图...');
                fetch('/api/user/apps/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) throw new Error(data.error);
                    appendStudioMessage('assistant', `已为你生成应用：**${data.app.title}**，并保存到“我的应用”空间。`);
                    showStudioNotice('应用已生成并保存成功。');
                    switchView('my-apps');
                    const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
                    navItems.forEach(nav => nav.classList.remove('active'));
                    if (navTarget) navTarget.classList.add('active');
                    loadMyGeneratedApps();
                })
                .catch(error => {
                    showStudioNotice(error.message || '生成失败', true);
                })
                .finally(() => setStudioLoading(false));
            });
        });
    }

    if (studioGoMyAppsBtn) {
        studioGoMyAppsBtn.addEventListener('click', () => {
            switchView('my-apps');
            const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
            navItems.forEach(nav => nav.classList.remove('active'));
            if (navTarget) navTarget.classList.add('active');
        });
    }

    if (refreshMyAppsBtn) {
        refreshMyAppsBtn.addEventListener('click', () => loadMyGeneratedApps());
    }

    if (appPlayerBackBtn) {
        appPlayerBackBtn.addEventListener('click', () => {
            switchView('my-apps');
            const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
            navItems.forEach(nav => nav.classList.remove('active'));
            if (navTarget) navTarget.classList.add('active');
        });
    }

    if (marketSearchInput) {
        marketSearchInput.addEventListener('input', (event) => {
            marketSearchKeyword = event.target.value || '';
            applyAiMarketFilters();
        });
    }

    if (marketSortSelect) {
        marketSortSelect.addEventListener('change', (event) => {
            marketSortBy = event.target.value || 'featured';
            applyAiMarketFilters();
        });
    }

    if (marketFeaturedOnlyBtn) {
        marketFeaturedOnlyBtn.addEventListener('click', () => {
            marketFeaturedOnly = !marketFeaturedOnly;
            marketFeaturedOnlyBtn.classList.toggle('active', marketFeaturedOnly);
            applyAiMarketFilters();
        });
    }

    if (marketResetBtn) {
        marketResetBtn.addEventListener('click', () => {
            marketCurrentCategory = 'all';
            marketFeaturedOnly = false;
            marketSearchKeyword = '';
            marketSortBy = 'featured';
            if (marketSearchInput) marketSearchInput.value = '';
            if (marketSortSelect) marketSortSelect.value = 'featured';
            if (marketFeaturedOnlyBtn) marketFeaturedOnlyBtn.classList.remove('active');
            initMarketCategoryFilters(marketAllApps);
            applyAiMarketFilters();
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const payload = {
                email: (loginEmailInput.value || '').trim(),
                password: loginPasswordInput.value || ''
            };
            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                loginPasswordInput.value = '';
                loadUserCenterData();
                alert('登录成功');
            })
            .catch(error => alert(error.message || '登录失败'));
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            const payload = {
                display_name: (registerNameInput.value || '').trim(),
                email: (registerEmailInput.value || '').trim(),
                password: registerPasswordInput.value || ''
            };
            fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                registerPasswordInput.value = '';
                alert(data.message || '注册成功，请登录');
            })
            .catch(error => alert(error.message || '注册失败'));
        });
    }

    if (refreshMeBtn) {
        refreshMeBtn.addEventListener('click', () => {
            loadUserCenterData();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
                currentUser = null;
                renderUserSession();
                assetsList.innerHTML = '<p class="user-empty">登录后查看资产</p>';
                devAppsList.innerHTML = '<p class="user-empty">登录后管理应用</p>';
                socialProfileInfo.textContent = '登录后配置社交主页';
            });
        });
    }

    if (reloadLearningSnapshotBtn) {
        reloadLearningSnapshotBtn.addEventListener('click', () => loadLearningSnapshot());
    }

    if (saveQuickSettingsBtn) {
        saveQuickSettingsBtn.addEventListener('click', () => {
            const payload = {
                notifications: {
                    email_digest: Boolean(quickSettingEmailDigest.checked),
                    new_course_alert: Boolean(quickSettingNewCourse.checked)
                }
            };
            const apiKeyValue = (zhipuApiKeyInput?.value || '').trim();
            if (apiKeyValue) {
                payload.ai = { api_key: apiKeyValue };
            }
            fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                if (zhipuApiKeyHint) {
                    const settings = data.settings || {};
                    zhipuApiKeyHint.textContent = settings.ai?.has_api_key
                        ? `已配置智谱 API Key：${settings.ai?.api_key_masked || ''}`
                        : '尚未检测到已保存的 API Key';
                }
                if (zhipuApiKeyInput) zhipuApiKeyInput.value = '';
                quickSettingsStatus.textContent = '设置已更新，新的 API Key 已立即生效';
            })
            .catch(error => {
                quickSettingsStatus.textContent = error.message || '设置保存失败';
            });
        });
    }

    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', () => {
            const payload = {
                asset_type: 'custom',
                asset_name: (assetNameInput.value || '').trim(),
                asset_value: Number(assetValueInput.value || 0)
            };
            fetch('/api/user/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                assetNameInput.value = '';
                assetValueInput.value = '';
                loadUserAssets();
            })
            .catch(error => alert(error.message || '新增资产失败'));
        });
    }

    if (reloadAssetsBtn) {
        reloadAssetsBtn.addEventListener('click', () => loadUserAssets());
    }

    if (createDevAppBtn) {
        createDevAppBtn.addEventListener('click', () => {
            const payload = {
                title: (devAppTitleInput.value || '').trim(),
                description: (devAppDescInput.value || '').trim()
            };
            fetch('/api/user/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                devAppTitleInput.value = '';
                devAppDescInput.value = '';
                loadUserApps();
            })
            .catch(error => alert(error.message || '创建应用失败'));
        });
    }

    if (reloadAppsBtn) {
        reloadAppsBtn.addEventListener('click', () => loadUserApps());
    }

    if (saveSocialProfileBtn) {
        saveSocialProfileBtn.addEventListener('click', () => {
            const payload = {
                bio: socialBioInput.value || '',
                skills: socialSkillsInput.value || '',
                allow_collab: Boolean(allowCollabInput.checked)
            };
            fetch('/api/user/social-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                loadSocialProfile();
            })
            .catch(error => alert(error.message || '保存失败'));
        });
    }

    if (userProfileEntry) {
        userProfileEntry.addEventListener('click', () => {
            switchView('user-center');
            const navTarget = document.querySelector('.nav-item[data-target="user-center"]');
            if (navTarget) {
                navItems.forEach(nav => nav.classList.remove('active'));
                navTarget.classList.add('active');
            }
        });
    }

    if (pptBlogGenerateBtn) {
        pptBlogGenerateBtn.addEventListener('click', generatePptBlog);
    }

    if (pptCardGridBtn) {
        pptCardGridBtn.addEventListener('click', () => {
            pptCardLayoutMode = 'grid';
            pptCardGridBtn.classList.add('active');
            pptCardListBtn?.classList.remove('active');
            applyPptLabPresentation();
        });
    }

    if (pptFocusModeBtn) {
        pptFocusModeBtn.addEventListener('click', () => {
            pptFocusMode = !pptFocusMode;
            applyPptLabPresentation();
        });
    }

    if (pptCardListBtn) {
        pptCardListBtn.addEventListener('click', () => {
            pptCardLayoutMode = 'list';
            pptCardListBtn.classList.add('active');
            pptCardGridBtn?.classList.remove('active');
            applyPptLabPresentation();
        });
    }

    if (pptFontScaleRange) {
        pptFontScaleRange.addEventListener('input', () => {
            pptFontScale = Number(pptFontScaleRange.value || 100);
            applyPptLabPresentation();
        });
    }

    if (pptThemeSelect) {
        pptThemeSelect.addEventListener('change', () => {
            pptThemeOverride = (pptThemeSelect.value || 'auto').trim();
            if (latestGeneratedCourse?.lesson_units?.length) {
                renderLessonUnits(latestGeneratedCourse.lesson_units);
            } else {
                applyPptLabPresentation();
            }
        });
    }

    if (copyBlogMarkdownBtn) {
        copyBlogMarkdownBtn.addEventListener('click', async () => {
            const text = latestGeneratedCourse?.blog_markdown || '';
            if (!text.trim()) {
                setPptBlogStatus('暂无可复制的博客文案', 'error');
                return;
            }
            try {
                await navigator.clipboard.writeText(text);
                setPptBlogStatus('博客文案已复制', 'success');
            } catch (error) {
                setPptBlogStatus('复制失败，请手动复制', 'error');
            }
        });
    }

    if (downloadBlogMarkdownBtn) {
        downloadBlogMarkdownBtn.addEventListener('click', () => {
            const text = latestGeneratedCourse?.blog_markdown || '';
            if (!text.trim()) {
                setPptBlogStatus('暂无可下载的博客文案', 'error');
                return;
            }
            const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
            const link = document.createElement('a');
            const safeTitle = (latestGeneratedCourse?.title || 'blog').replace(/[\\/:*?"<>|]/g, '_');
            link.href = URL.createObjectURL(blob);
            link.download = `${safeTitle}.md`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);
            setPptBlogStatus('博客文案已下载', 'success');
        });
    }

    if (pptSourceTypeRadios && pptSourceTypeRadios.length > 0) {
        const syncPptSourceInputs = () => {
            const sourceType = getPptSourceType();
            if (pptBlogUrlInput) pptBlogUrlInput.disabled = sourceType !== 'url';
            if (pptBlogPdfInput) pptBlogPdfInput.disabled = sourceType !== 'pdf';
        };
        pptSourceTypeRadios.forEach(item => item.addEventListener('change', syncPptSourceInputs));
        syncPptSourceInputs();
    }

    if (knowledgeTabBtns && knowledgeTabBtns.length > 0) {
        knowledgeTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab || 'mine';
                knowledgeTabBtns.forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.knowledge-tab-panel').forEach(panel => panel.classList.remove('active'));
                if (tab === 'mine') knowledgeHubMine?.classList.add('active');
                if (tab === 'notes') knowledgeHubNotes?.classList.add('active');
                if (tab === 'favorites') knowledgeHubFavorites?.classList.add('active');
                if (tab === 'public') knowledgeHubPublic?.classList.add('active');
                if (tab === 'featured') knowledgeHubFeatured?.classList.add('active');
            });
        });
    }

    if (refreshKnowledgeHubBtn) {
        refreshKnowledgeHubBtn.addEventListener('click', () => loadKnowledgeBase());
    }

    if (saveCurrentCourseBtn) {
        saveCurrentCourseBtn.addEventListener('click', () => {
            saveLatestCourseToKnowledge();
        });
    }

    if (saveCurrentCourseInLabBtn) {
        saveCurrentCourseInLabBtn.addEventListener('click', () => {
            saveLatestCourseToKnowledge().then(ok => {
                if (ok) {
                    setPptBlogStatus('课程已保存到知识库', 'success');
                }
            });
        });
    }

    if (saveFavArticleBtn) {
        saveFavArticleBtn.addEventListener('click', () => {
            const payload = {
                target_type: 'article',
                title: (favArticleTitleInput?.value || '').trim(),
                source_url: (favArticleUrlInput?.value || '').trim(),
                summary: (favArticleSummaryInput?.value || '').trim(),
                target_id: null
            };
            if (!payload.title) {
                setKnowledgeHubStatus('请先填写收藏文章标题', true);
                return;
            }
            fetch('/api/knowledge/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                if (favArticleTitleInput) favArticleTitleInput.value = '';
                if (favArticleUrlInput) favArticleUrlInput.value = '';
                if (favArticleSummaryInput) favArticleSummaryInput.value = '';
                setKnowledgeHubStatus('文章已收藏');
                loadKnowledgeBase();
            })
            .catch(error => setKnowledgeHubStatus(error.message || '收藏失败', true));
        });
    }

    if (knowledgeHubMine) {
        [knowledgeHubMine, knowledgeHubNotes, knowledgeHubPublic, knowledgeHubFeatured, knowledgeHubFavorites].forEach(container => {
            container?.addEventListener('click', (event) => {
                const target = event.target.closest('[data-action]');
                if (!target) return;
                const action = target.dataset.action;
                if (action === 'toggle-publish') {
                    const itemId = Number(target.dataset.id || 0);
                    if (!itemId) return;
                    fetch(`/api/knowledge/items/${itemId}/publish`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        setKnowledgeHubStatus(data.visibility === 'public' ? '已公开到社区' : '已取消公开');
                        loadKnowledgeBase();
                    })
                    .catch(error => setKnowledgeHubStatus(error.message || '公开状态更新失败', true));
                }
                if (action === 'favorite') {
                    const payload = {
                        target_type: target.dataset.type || 'public',
                        target_id: target.dataset.id ? Number(target.dataset.id) : null,
                        title: target.dataset.title || '未命名内容',
                        summary: target.dataset.summary || '',
                        cover_image: target.dataset.cover || '',
                        source_url: ''
                    };
                    fetch('/api/knowledge/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        setKnowledgeHubStatus('已加入我的收藏');
                        loadKnowledgeBase();
                    })
                    .catch(error => setKnowledgeHubStatus(error.message || '收藏失败', true));
                }
                if (action === 'delete-course') {
                    const itemId = Number(target.dataset.id || 0);
                    if (!itemId) return;
                    fetch(`/api/knowledge/items/${itemId}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        setKnowledgeHubStatus('课程已删除');
                        loadKnowledgeBase();
                    })
                    .catch(error => setKnowledgeHubStatus(error.message || '删除课程失败', true));
                }
                if (action === 'delete-favorite') {
                    const favoriteId = Number(target.dataset.id || 0);
                    if (!favoriteId) return;
                    fetch(`/api/knowledge/favorites/${favoriteId}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        setKnowledgeHubStatus('收藏已删除');
                        loadKnowledgeBase();
                    })
                    .catch(error => setKnowledgeHubStatus(error.message || '删除收藏失败', true));
                }
            });
        });
        [knowledgeHubMine, knowledgeHubNotes, knowledgeHubPublic, knowledgeHubFeatured].forEach(container => {
            container?.addEventListener('click', (event) => {
                const card = event.target.closest('.knowledge-card');
                if (!card) return;
                if (event.target.closest('[data-action]')) return;
                const route = card.dataset.route || 'course';
                if (route === 'course') {
                    const itemId = Number(card.dataset.itemId || 0);
                    if (!itemId) return;
                    fetch(`/api/knowledge/items/${itemId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        const payload = data.payload || {};
                        latestGeneratedCourse = {
                            title: data.title || '课程单元预览',
                            summary: data.summary || '',
                            lesson_units: payload.lesson_units || [],
                            slides: payload.slides || [],
                            blog_markdown: payload.blog_markdown || '',
                            generation_model: payload.generation_model || ''
                        };
                        switchView('ppt-blog-lab');
                        const navTarget = document.querySelector('.nav-item[data-target="ppt-blog-lab"]');
                        navItems.forEach(nav => nav.classList.remove('active'));
                        if (navTarget) navTarget.classList.add('active');
                        if (latestGeneratedCourse.lesson_units?.length) {
                            renderLessonUnits(latestGeneratedCourse.lesson_units);
                        } else {
                            renderPptSlides(latestGeneratedCourse.slides || []);
                        }
                        if (pptBlogTitle) pptBlogTitle.textContent = latestGeneratedCourse.title || '课程单元预览';
                        if (pptBlogMarkdown) {
                            const linksHtml = renderReferenceLinks(latestGeneratedCourse.reference_links || []);
                            pptBlogMarkdown.innerHTML = `${linksHtml}${renderMarkdown(latestGeneratedCourse.blog_markdown || '暂无博客内容')}`;
                        }
                        setPptBlogStatus('已打开知识库课程', 'success');
                    })
                    .catch(error => setKnowledgeHubStatus(error.message || '打开课程失败', true));
                }
                if (route === 'app') {
                    const appId = Number(card.dataset.itemId || 0);
                    const token = card.dataset.token || '';
                    const requestUrl = token ? `/api/shared/apps/${token}` : (appId ? `/api/public/apps/${appId}` : '');
                    if (!requestUrl) return;
                    fetch(requestUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        const virtualApp = {
                            id: 0,
                            title: data.title || '公开应用',
                            description: data.description || '',
                            learning_topic: data.learning_topic || '通用学习',
                            generation_model: data.generation_model || 'glm-5',
                            status: 'published',
                            blueprint: data.blueprint || {}
                        };
                        renderAppPlayer(virtualApp);
                        switchView('app-player');
                        const navTarget = document.querySelector('.nav-item[data-target="my-apps"]');
                        navItems.forEach(nav => nav.classList.remove('active'));
                        if (navTarget) navTarget.classList.add('active');
                    })
                    .catch(error => setKnowledgeHubStatus(error.message || '打开应用失败', true));
                }
            });
        });
    }

    if (generateQuestPlanBtn) {
        generateQuestPlanBtn.addEventListener('click', () => {
            const goal = (questGoalInput.value || '').trim();
            const days = Number(questDaysInput.value || 10);
            const style = (questStyleSelect.value || '考试冲刺').trim();
            if (!goal) {
                alert('请先输入学习目标');
                return;
            }
            generateQuestPlanBtn.disabled = true;
            generateQuestPlanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在生成';
            fetch('/api/learning-quest/plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    goal,
                    days,
                    style
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                questGoal = data.goal;
                questPlan = data.quests || [];
                questCompleted = new Set();
                questStrategyContent.innerHTML = renderMarkdown(data.ai_strategy || '暂无策略建议');
                renderQuestPlan(questPlan);
            })
            .catch(error => {
                alert(error.message || '计划生成失败');
            })
            .finally(() => {
                generateQuestPlanBtn.disabled = false;
                generateQuestPlanBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> 生成闯关计划';
            });
        });
    }

    if (askQuestCoachBtn) {
        askQuestCoachBtn.addEventListener('click', () => {
            const question = (questCoachInput.value || '').trim();
            if (!question) {
                alert('请先输入你的问题');
                return;
            }
            const progress = questPlan.length > 0 ? Math.round((questCompleted.size / questPlan.length) * 100) : 0;
            const currentTask = questPlan.find(item => !questCompleted.has(item.id))?.title || '已进入收尾阶段';
            askQuestCoachBtn.disabled = true;
            askQuestCoachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 分析中';
            fetch('/api/learning-quest/coach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    goal: questGoal || questGoalInput.value,
                    current_task: currentTask,
                    question,
                    progress
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                questCoachOutput.innerHTML = renderMarkdown(data.result || '暂无建议');
            })
            .catch(error => {
                alert(error.message || '教练回复失败');
            })
            .finally(() => {
                askQuestCoachBtn.disabled = false;
                askQuestCoachBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 询问 AI 教练';
            });
        });
    }

    if (generateQuestReviewBtn) {
        generateQuestReviewBtn.addEventListener('click', () => {
            const payload = {
                goal: questGoal || questGoalInput.value,
                completed: questCompleted.size,
                total: questPlan.length,
                notes: questNotesInput.value,
                blockers: questBlockersInput.value
            };
            generateQuestReviewBtn.disabled = true;
            generateQuestReviewBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 生成中';
            fetch('/api/learning-quest/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                questReviewContent.innerHTML = renderMarkdown(data.review || '暂无复盘');
            })
            .catch(error => {
                alert(error.message || '复盘生成失败');
            })
            .finally(() => {
                generateQuestReviewBtn.disabled = false;
                generateQuestReviewBtn.innerHTML = '<i class="fa-solid fa-file-lines"></i> 生成今日复盘';
            });
        });
    }

    if (generateMemoryDeckBtn) {
        generateMemoryDeckBtn.addEventListener('click', () => {
            const topic = (memoryTopicInput.value || '').trim();
            if (!topic) {
                alert('请先输入复习主题');
                return;
            }
            const payload = {
                topic,
                mode: memoryModeSelect.value || '稳态巩固',
                difficulty: memoryDifficultySelect.value || '进阶',
                count: Number(memoryCountInput.value || 8)
            };
            generateMemoryDeckBtn.disabled = true;
            generateMemoryDeckBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 生成中';
            fetch('/api/memory-lab/deck', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                memoryTopic = data.topic || topic;
                memoryCards = data.cards || [];
                memoryIndex = 0;
                memoryRecords = [];
                memoryAnswerInput.value = '';
                memoryStrategyContent.innerHTML = renderMarkdown(data.strategy || '暂无策略');
                renderCurrentMemoryCard();
            })
            .catch(error => {
                alert(error.message || '卡组生成失败');
            })
            .finally(() => {
                generateMemoryDeckBtn.disabled = false;
                generateMemoryDeckBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> 生成记忆卡组';
            });
        });
    }

    if (memoryRateBtns.length > 0) {
        memoryRateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!memoryCards.length || memoryIndex >= memoryCards.length) {
                    alert('请先生成卡组并开始训练');
                    return;
                }
                const level = btn.dataset.level;
                const currentCard = memoryCards[memoryIndex];
                fetch('/api/memory-lab/coach', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        topic: memoryTopic || memoryTopicInput.value,
                        question: currentCard.question,
                        answer: memoryAnswerInput.value,
                        level
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    memoryRecords.push({
                        card_id: currentCard.id,
                        level
                    });
                    memoryCoachContent.innerHTML = renderMarkdown(data.feedback || '暂无建议');
                    memoryNextReview.textContent = data.next_review || '--';
                    memoryIndex += 1;
                    memoryAnswerInput.value = '';
                    renderCurrentMemoryCard();
                })
                .catch(error => {
                    alert(error.message || '纠偏失败');
                });
            });
        });
    }

    if (buildMemorySummaryBtn) {
        buildMemorySummaryBtn.addEventListener('click', () => {
            fetch('/api/memory-lab/summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: memoryTopic || memoryTopicInput.value,
                    records: memoryRecords
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                memoryReportContent.innerHTML = renderMarkdown(data.report || '暂无报告');
                updateMemoryStats();
            })
            .catch(error => {
                alert(error.message || '报告生成失败');
            });
        });
    }

    // Social Feed Logic
    function loadSocialFeed() {
        fetch('/api/social')
        .then(response => response.json())
        .then(data => {
            renderPosts(data.posts);
            renderTopics(data.topics);
            renderActiveUsers(data.active_users);
        })
        .catch(err => console.error('Error loading social:', err));
    }

    function renderPosts(posts) {
        const container = document.getElementById('socialFeed');
        container.innerHTML = '';

        posts.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`;
            
            let imageHtml = '';
            if (post.image) {
                imageHtml = `<img src="${post.image}" class="post-image" alt="Post Image">`;
            }

            const tagsHtml = post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('');

            card.innerHTML = `
                <div class="post-header">
                    <img src="${post.avatar}" class="avatar-md">
                    <div class="post-user-info">
                        <h4>${post.user}</h4>
                        <span class="post-time">${post.time}</span>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                    ${imageHtml}
                </div>
                <div class="post-tags">
                    ${tagsHtml}
                </div>
                <div class="post-footer">
                    <button class="action-btn"><i class="fa-regular fa-heart"></i> ${post.likes}</button>
                    <button class="action-btn comment"><i class="fa-regular fa-comment"></i> ${post.comments}</button>
                    <button class="action-btn" style="margin-left:auto"><i class="fa-regular fa-share-from-square"></i></button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function renderTopics(topics) {
        const list = document.getElementById('topicList');
        list.innerHTML = '';
        topics.forEach(topic => {
            const li = document.createElement('li');
            li.className = 'topic-item';
            li.innerHTML = `
                <span class="topic-name"># ${topic.name}</span>
                <span class="topic-count">${topic.count}</span>
            `;
            list.appendChild(li);
        });
    }

    function renderActiveUsers(users) {
        const list = document.getElementById('activeUsersList');
        list.innerHTML = '';
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-bubble';
            div.innerHTML = `
                <img src="${user.avatar}" title="${user.name}">
                <span>${user.name}</span>
            `;
            list.appendChild(div);
        });
    }

    // Analytics Logic
    function loadAnalytics() {
        fetch('/api/analytics')
        .then(response => response.json())
        .then(data => {
            // Update Stats
            document.getElementById('statTotalHours').textContent = data.total_hours + 'h';
            document.getElementById('statStreak').textContent = data.streak_days + '天';
            document.getElementById('statCompleted').textContent = data.courses_completed + '个';

            // Render Weekly Chart (Bar)
            renderBarChart(data.weekly_activity);

            // Render Subject Chart (Donut)
            renderDonutChart(data.subject_distribution);
        })
        .catch(err => console.error('Error loading analytics:', err));
    }

    function renderBarChart(data) {
        const container = document.getElementById('weeklyChart');
        container.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-chart-container';
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const maxVal = Math.max(...data);

        data.forEach((val, index) => {
            const group = document.createElement('div');
            group.className = 'bar-group';
            
            const barHeight = (val / maxVal) * 80; // Max 80% height
            
            group.innerHTML = `
                <div class="bar" style="height: ${barHeight}%;">
                    <span class="bar-value">${val}h</span>
                </div>
                <span class="bar-label">${days[index]}</span>
            `;
            wrapper.appendChild(group);
        });
        container.appendChild(wrapper);
    }

    function renderDonutChart(data) {
        const container = document.getElementById('subjectChart');
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'donut-chart-container';

        // Calculate gradients
        // Simply use predefined colors for demo
        const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', '#cbd5e1'];
        
        let conicStr = '';
        let startDeg = 0;
        const total = data.reduce((acc, curr) => acc + curr.value, 0);

        data.forEach((item, index) => {
            const deg = (item.value / total) * 360;
            const endDeg = startDeg + deg;
            const color = colors[index % colors.length];
            conicStr += `${color} ${startDeg}deg ${endDeg}deg, `;
            startDeg = endDeg;
        });
        conicStr = conicStr.slice(0, -2); // Remove last comma

        wrapper.innerHTML = `
            <div class="donut-chart" style="background: conic-gradient(${conicStr});">
                <div class="donut-hole"></div>
            </div>
            <div class="donut-legend">
                ${data.map((item, i) => `
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${colors[i % colors.length]}"></div>
                        <span>${item.name} (${item.value}%)</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(wrapper);
    }

    // Settings Logic
    function loadSettings() {
        fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            document.getElementById('settingEmailDigest').checked = data.notifications.email_digest;
            document.getElementById('settingNewCourse').checked = data.notifications.new_course_alert;
            
            // Theme buttons
            document.querySelectorAll('.theme-btn').forEach(btn => {
                if(btn.dataset.theme === data.appearance.theme) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        })
        .catch(err => console.error('Error loading settings:', err));
    }

    // Theme Switcher Click Handler
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Here you would typically toggle a class on body or save preference
            console.log('Theme switched to:', btn.dataset.theme);
        });
    });

    // --- Resources Center Logic ---
    const resourcesHubView = document.getElementById('resourcesHubView');
    const resourcesDetailView = document.getElementById('resourcesDetailView');
    const resourcesGrid = document.getElementById('resourcesGrid');
    const resourcesTree = document.getElementById('resourcesTree');
    const resourcesContent = document.getElementById('resourcesContent');
    const backToHubBtn = document.getElementById('backToHubBtn');
    const currentResourceTitle = document.getElementById('currentResourceTitle');

    if (backToHubBtn) {
        backToHubBtn.addEventListener('click', () => {
            resourcesDetailView.style.display = 'none';
            resourcesHubView.style.display = 'block';
            resourcesHubView.style.animation = 'fadeIn 0.3s ease-out';
        });
    }

    const availableResources = [
        { id: 'gwy', title: '考公备考资源站', icon: 'fa-solid fa-landmark', color: '#3b82f6', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', desc: '涵盖行测、申论、面试全套资料，以及体制内生活真实访谈记录。', type: 'mixed' },
        { id: 'ky', title: '考研冲刺资料库', icon: 'fa-solid fa-book-open-reader', color: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', desc: '聚合全网最全考研资讯、复习资料以及各大高校研究生招生网。', type: 'web_only' },
        { id: 'ai_news', title: 'AI 前沿资讯大盘', icon: 'fa-solid fa-bolt', color: '#fbbf24', bg: 'linear-gradient(135deg, #fefce8, #fef3c7)', desc: '精选大模型动态、学术研究与行业应用，保持技术敏锐度。', type: 'news' },
        { id: 'cet', title: '四六级通关秘籍', icon: 'fa-solid fa-language', color: '#10b981', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', desc: '听力训练音频、核心词汇表及写作高分模板全收录。', type: 'web_only' }
    ];

    window.renderResourceHub = function() {
        if (!resourcesGrid) return;
        resourcesGrid.innerHTML = '';

        availableResources.forEach(res => {
            const card = document.createElement('div');
            card.style.background = 'white';
            card.style.borderRadius = '16px';
            card.style.border = '1px solid var(--border-color)';
            card.style.overflow = 'hidden';
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.3s ease';
            card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
            
            card.onmouseover = () => {
                card.style.transform = 'translateY(-6px)';
                card.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
            };
            card.onmouseout = () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
            };

            let tagText = res.type === 'web_only' ? '网页资源大盘' : (res.type === 'news' ? '资讯流' : '精选资源');

            card.innerHTML = `
                <div style="height: 180px; background: ${res.bg}; display: flex; align-items: center; justify-content: center; position: relative;">
                    <i class="${res.icon}" style="font-size: 5rem; color: ${res.color}; opacity: 0.8; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); transition: all 0.3s;" class="resource-icon"></i>
                    <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.8); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: ${res.color}; backdrop-filter: blur(4px);">
                        ${tagText}
                    </div>
                </div>
                <div style="padding: 1.5rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-dark); margin: 0 0 0.75rem 0;">${res.title}</h3>
                    <p style="color: var(--text-light); font-size: 0.95rem; margin: 0; line-height: 1.5;">${res.desc}</p>
                    <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <span style="color: var(--text-light); font-size: 0.85rem;"><i class="fa-solid fa-folder-tree"></i> ${res.type === 'web_only' ? '包含海量链接' : '包含多级目录'}</span>
                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.9rem;">进入阅读 <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                openResourceDetail(res);
            });

            resourcesGrid.appendChild(card);
        });
    };

    function openResourceDetail(resConfig) {
        resourcesHubView.style.display = 'none';
        resourcesDetailView.style.display = 'flex';
        resourcesDetailView.style.animation = 'fadeIn 0.3s ease-out';
        
        if (currentResourceTitle) {
            currentResourceTitle.innerHTML = `<i class="${resConfig.icon}" style="color: ${resConfig.color};"></i> ${resConfig.title}`;
        }

        const sidebarNav = document.getElementById('resourcesSidebarNav');
        if (sidebarNav) {
            if (resConfig.id === 'gwy') {
                sidebarNav.style.display = 'block';
                setupResourceNavEvents(resConfig.id);
            } else {
                sidebarNav.style.display = 'none';
            }
        }
        
        // Reset content placeholder
        resourcesContent.innerHTML = `
            <div class="resources-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-light); text-align: center; animation: fadeIn 0.5s;">
                <i class="${resConfig.icon}" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; color: ${resConfig.color};"></i>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-dark);">欢迎进入 ${resConfig.title}</h3>
                <p style="max-width: 400px; line-height: 1.6;">请在左侧目录选择您要阅读的内容，所有链接均支持沉浸式本地跳转。</p>
            </div>
        `;

        if (resConfig.id === 'ky') {
            loadKyWebResourcesGrid();
        } else if (resConfig.id === 'cet') {
            loadCetWebResourcesGrid();
        } else if (resConfig.id === 'ai_news') {
            loadAINewsContent();
        } else {
            loadResourceTree(resConfig.id);
        }
    }

    function setupResourceNavEvents(type) {
        const navItems = document.querySelectorAll('.resource-nav-item');
        navItems.forEach(item => {
            // Remove old listeners by cloning
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.resource-nav-item').forEach(n => {
                    n.classList.remove('active');
                    n.style.background = 'transparent';
                    n.style.color = '#1e293b';
                    n.style.fontWeight = '500';
                    n.querySelector('i').style.color = '#64748b';
                });
                
                newItem.classList.add('active');
                newItem.style.background = 'rgba(99, 102, 241, 0.1)';
                newItem.style.color = 'var(--primary-color)';
                newItem.style.fontWeight = '600';
                newItem.querySelector('i').style.color = 'var(--primary-color)';

                const navType = newItem.dataset.nav;
                if (navType === 'local') {
                    loadResourceTree(type);
                } else if (navType === 'web') {
                    loadWebResourcesGrid();
                }
            });
            
            newItem.addEventListener('mouseenter', () => {
                if (!newItem.classList.contains('active')) {
                    newItem.style.background = 'rgba(0,0,0,0.03)';
                }
            });
            newItem.addEventListener('mouseleave', () => {
                if (!newItem.classList.contains('active')) {
                    newItem.style.background = 'transparent';
                }
            });
        });
        
        // Default to local
        const localBtn = document.querySelector('.resource-nav-item[data-nav="local"]');
        if (localBtn) localBtn.click();
    }

    function loadWebResourcesGrid() {
        if (!resourcesTree || !resourcesContent) return;
        
        resourcesTree.innerHTML = `
            <div style="padding: 1rem; color: var(--text-light); text-align: center; font-size: 0.9rem;">
                <i class="fa-solid fa-arrow-right-long" style="margin-bottom: 8px; font-size: 1.5rem; color: #cbd5e1; display: block;"></i>
                请在右侧大盘中选择网页资源
            </div>
        `;

        const webResources = [
            { name: '国家公务员局', url: 'http://www.scs.gov.cn/', icon: 'fa-solid fa-building-flag', color: '#dc2626', desc: '国考官方报名与信息发布平台' },
            { name: '粉笔教育', url: 'https://www.fenbi.com/', icon: 'fa-solid fa-chalkboard-user', color: '#ec4899', desc: '公考在线题库与直播课程' },
            { name: '华图教育', url: 'https://www.huatu.com/', icon: 'fa-solid fa-book', color: '#ea580c', desc: '老牌公考培训与备考资料库' },
            { name: '半月谈', url: 'http://www.banyuetan.org/', icon: 'fa-regular fa-newspaper', color: '#0284c7', desc: '申论素材、时政热点权威来源' },
            { name: '人民网', url: 'http://www.people.com.cn/', icon: 'fa-solid fa-landmark-dome', color: '#b91c1c', desc: '国家级新闻与重要政策解读' },
            { name: '学习强国', url: 'https://www.xuexi.cn/', icon: 'fa-solid fa-star', color: '#e11d48', desc: '每日时政学习与思想理论库' },
            { name: '公考雷达', url: 'https://www.gongkaoleida.com/', icon: 'fa-solid fa-satellite-dish', color: '#8b5cf6', desc: '全国招考公告实时订阅与推送' },
            { name: 'QZZN论坛', url: 'http://bbs.qzzn.com/', icon: 'fa-solid fa-comments', color: '#0d9488', desc: '体制内与备考经验交流第一大论坛' },
            { name: '步知公考', url: 'https://www.buzhi.com/', icon: 'fa-solid fa-shoe-prints', color: '#d97706', desc: '行测申论系统化备考平台' },
            { name: '中公教育', url: 'https://www.offcn.com/', icon: 'fa-solid fa-school', color: '#c026d3', desc: '全国性公考招录信息与面授培训' },
            { name: '中共中央党校', url: 'https://www.ccps.gov.cn/', icon: 'fa-solid fa-building-columns', color: '#991b1b', desc: '重要理论文章与党建文献库' },
            { name: '国家统计局', url: 'http://www.stats.gov.cn/', icon: 'fa-solid fa-chart-line', color: '#2563eb', desc: '行测资料分析权威数据源' }
        ];

        let cardsHtml = webResources.map(res => `
            <a href="${res.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                <div style="background: white; border-radius: 12px; border: 1px solid var(--border-color); padding: 1.5rem; height: 100%; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; cursor: pointer;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px rgba(0,0,0,0.08)'; this.style.borderColor='${res.color}40';" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)'; this.style.borderColor='var(--border-color)';">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${res.color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="${res.icon}" style="font-size: 1.5rem; color: ${res.color};"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 600;">${res.name}</h3>
                    </div>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; line-height: 1.5; flex: 1;">${res.desc}</p>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: ${res.color}; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        访问网站 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                    </div>
                </div>
            </a>
        `).join('');

        resourcesContent.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto; animation: fadeIn 0.4s ease-out;">
                <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark); margin: 0 0 0.5rem 0;">
                        <i class="fa-solid fa-globe" style="color: #3b82f6; margin-right: 10px;"></i>网页资源大盘
                    </h2>
                    <p style="color: var(--text-light); margin: 0; font-size: 1rem;">精选全网最权威、最实用的公考备考网站，点击卡片直接前往。</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    function loadKyWebResourcesGrid() {
        if (!resourcesTree || !resourcesContent) return;
        
        resourcesTree.innerHTML = `
            <div style="padding: 1rem;">
                <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1rem;">分类导航</p>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                    <li style="padding: 8px 12px; background: rgba(99, 102, 241, 0.1); color: var(--primary-color); border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fa-solid fa-globe" style="margin-right: 8px;"></i>考研综合网
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-school" style="margin-right: 8px; color: #64748b;"></i>院校研招网
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-book" style="margin-right: 8px; color: #64748b;"></i>资料与论坛
                    </li>
                </ul>
            </div>
        `;

        const kyWebResources = [
            // 综合官方与资讯
            { name: '中国研究生招生信息网', url: 'https://yz.chsi.com.cn/', icon: 'fa-solid fa-building-flag', color: '#dc2626', desc: '考研唯一官方报名与调剂服务系统' },
            { name: '中国教育在线考研频道', url: 'https://kaoyan.eol.cn/', icon: 'fa-solid fa-newspaper', color: '#ea580c', desc: '权威的考研资讯与政策解读平台' },
            { name: '考研帮 (考研网)', url: 'http://www.kaoyan.com/', icon: 'fa-solid fa-users-rays', color: '#3b82f6', desc: '考研经验交流与资料分享综合社区' },
            { name: '新东方考研', url: 'https://kaoyan.xdf.cn/', icon: 'fa-solid fa-compass', color: '#059669', desc: '老牌考研辅导机构官网及在线题库' },
            { name: '文都考研', url: 'http://kaoyan.wendu.com/', icon: 'fa-solid fa-chalkboard-user', color: '#8b5cf6', desc: '全面的考研公共课及专业课辅导资料' },
            { name: '学信网', url: 'https://www.chsi.com.cn/', icon: 'fa-solid fa-id-card', color: '#0284c7', desc: '学历查询与考研成绩认证官方平台' },
            
            // 知名院校研招网 (985/211 代表)
            { name: '清华大学研招网', url: 'https://yz.tsinghua.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#7c3aed', desc: '清华大学研究生招生官方信息发布' },
            { name: '北京大学研招网', url: 'https://admission.pku.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#b91c1c', desc: '北京大学研究生招生与复试公告' },
            { name: '复旦大学研招网', url: 'https://gsao.fudan.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#0369a1', desc: '复旦大学历年分数线与招生简章' },
            { name: '上海交大研招网', url: 'https://yzb.sjtu.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#be185d', desc: '上海交通大学研究生招生信息网' },
            { name: '浙江大学研招网', url: 'http://grs.zju.edu.cn/yjszs/', icon: 'fa-solid fa-building-columns', color: '#1d4ed8', desc: '浙江大学硕士及博士招生官方平台' },
            { name: '南京大学研招网', url: 'http://grs.zju.edu.cn/yjszs/', icon: 'fa-solid fa-building-columns', color: '#0f766e', desc: '南京大学研究生报考与调剂系统' },
            { name: '武汉大学研招网', url: 'https://grawww.nju.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#4338ca', desc: '武汉大学研究生院招生信息' },
            { name: '华中科技大学研招网', url: 'http://gs.whu.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#c2410c', desc: '华科大研究生招生简章及专业目录' },
            { name: '中山大学研招网', url: 'https://gs.sysu.edu.cn/zs/', icon: 'fa-solid fa-building-columns', color: '#15803d', desc: '中山大学硕士研究生招生官方动态' },
            { name: '四川大学研招网', url: 'https://yz.scu.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#a21caf', desc: '四川大学研究生院招生资讯' },
            { name: '西安交大研招网', url: 'http://yz.xjtu.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#047857', desc: '西安交通大学历年报录比与招生动态' },
            { name: '哈尔滨工业大学研招网', url: 'http://yzb.hit.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#1e3a8a', desc: '哈工大研究生招生与考试信息' },
            { name: '中国人民大学研招网', url: 'http://pgs.ruc.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#9f1239', desc: '人大研究生招生公告与院系指南' },
            { name: '同济大学研招网', url: 'https://yz.tongji.edu.cn/', icon: 'fa-solid fa-building-columns', color: '#0369a1', desc: '同济大学硕士及博士研究生招生网' },
            
            // 资料与论坛
            { name: '小木虫论坛', url: 'http://muchong.com/', icon: 'fa-solid fa-bug', color: '#65a30d', desc: '国内最大科研与考研经验交流论坛' },
            { name: '中国知网 (CNKI)', url: 'https://www.cnki.net/', icon: 'fa-solid fa-book-journal-whills', color: '#2563eb', desc: '专业课复习必备的中文文献检索平台' },
            { name: '考研试题库', url: 'http://www.kaoyan.com/shiti/', icon: 'fa-solid fa-file-pen', color: '#d97706', desc: '各高校历年公共课及专业课真题汇总' },
            { name: 'Bilibili 考研专区', url: 'https://www.bilibili.com/v/knowledge/campus/', icon: 'fa-brands fa-bilibili', color: '#ec4899', desc: '海量免费的考研名师公开课视频' }
        ];

        let cardsHtml = kyWebResources.map(res => `
            <a href="${res.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                <div style="background: white; border-radius: 12px; border: 1px solid var(--border-color); padding: 1.5rem; height: 100%; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; cursor: pointer;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px rgba(0,0,0,0.08)'; this.style.borderColor='${res.color}40';" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)'; this.style.borderColor='var(--border-color)';">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${res.color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="${res.icon}" style="font-size: 1.5rem; color: ${res.color};"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 600;">${res.name}</h3>
                    </div>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; line-height: 1.5; flex: 1;">${res.desc}</p>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: ${res.color}; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        访问网站 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                    </div>
                </div>
            </a>
        `).join('');

        resourcesContent.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; animation: fadeIn 0.4s ease-out;">
                <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark); margin: 0 0 0.5rem 0;">
                        <i class="fa-solid fa-book-open-reader" style="color: #8b5cf6; margin-right: 10px;"></i>考研冲刺资料库
                    </h2>
                    <p style="color: var(--text-light); margin: 0; font-size: 1rem;">聚合全网最全考研资讯、复习资料以及各大高校研究生招生网，助您一战成硕。</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    function loadCetWebResourcesGrid() {
        if (!resourcesTree || !resourcesContent) return;
        
        resourcesTree.innerHTML = `
            <div style="padding: 1rem;">
                <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1rem;">分类导航</p>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                    <li style="padding: 8px 12px; background: rgba(99, 102, 241, 0.1); color: var(--primary-color); border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fa-solid fa-language" style="margin-right: 8px;"></i>四六级综合网
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-headphones" style="margin-right: 8px; color: #64748b;"></i>听力与口语
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-file-pen" style="margin-right: 8px; color: #64748b;"></i>真题与词汇
                    </li>
                </ul>
            </div>
        `;

        const cetWebResources = [
            // 官方与综合
            { name: '全国大学英语四六级考试网', url: 'https://cet.neea.edu.cn/', icon: 'fa-solid fa-building-flag', color: '#dc2626', desc: '四六级考试唯一官方报名与成绩查询入口' },
            { name: '中国教育考试网', url: 'https://www.neea.edu.cn/', icon: 'fa-solid fa-landmark', color: '#b91c1c', desc: '教育部考试中心官方网站，发布最新考务规定' },
            { name: '新东方四六级', url: 'https://cet.xdf.cn/', icon: 'fa-solid fa-compass', color: '#059669', desc: '新东方在线四六级备考指导与名师课程' },
            { name: '有道考神', url: 'https://ke.youdao.com/', icon: 'fa-solid fa-graduation-cap', color: '#ea580c', desc: '网易有道旗下英语学习平台，含四六级免费公开课' },
            
            // 听力与口语
            { name: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', icon: 'fa-solid fa-headphones', color: '#0284c7', desc: '纯正英式发音练习与原汁原味新闻听力' },
            { name: 'VOA Special English', url: 'https://learningenglish.voanews.com/', icon: 'fa-solid fa-podcast', color: '#4338ca', desc: '慢速美语听力训练，四级听力备考绝佳素材' },
            { name: '每日英语听力', url: 'https://ting.eudic.net/', icon: 'fa-solid fa-ear-listen', color: '#8b5cf6', desc: '海量四六级真题听力音频与双语字幕同步' },
            { name: 'TED Talks', url: 'https://www.ted.com/', icon: 'fa-solid fa-microphone-lines', color: '#e11d48', desc: '高质量英文演讲视频，提升听力与写作思想深度' },
            
            // 词汇、阅读与真题
            { name: '百词斩', url: 'https://www.baicizhan.com/', icon: 'fa-solid fa-book-open', color: '#d97706', desc: '图形化趣味背单词，四六级核心词汇突击' },
            { name: '扇贝单词', url: 'https://www.shanbay.com/', icon: 'fa-solid fa-spell-check', color: '#0d9488', desc: '科学抗遗忘记忆曲线，精选四六级真题词书' },
            { name: 'China Daily (英文版)', url: 'https://www.chinadaily.com.cn/', icon: 'fa-regular fa-newspaper', color: '#1e3a8a', desc: '中国日报英文版，四六级翻译与阅读题源题库' },
            { name: '普特英语听力网', url: 'https://www.putclub.com/', icon: 'fa-solid fa-users-viewfinder', color: '#65a30d', desc: '老牌英语学习论坛，历年四六级真题及精析下载' },
            { name: '可可英语', url: 'http://www.kekenet.com/', icon: 'fa-solid fa-laptop-file', color: '#c026d3', desc: '提供丰富的四六级模拟题、写作模板与双语阅读' },
            { name: 'Bilibili 英语专区', url: 'https://www.bilibili.com/v/knowledge/campus/', icon: 'fa-brands fa-bilibili', color: '#ec4899', desc: '四六级各大机构名师免费冲刺串讲视频' }
        ];

        let cardsHtml = cetWebResources.map(res => `
            <a href="${res.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                <div style="background: white; border-radius: 12px; border: 1px solid var(--border-color); padding: 1.5rem; height: 100%; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; cursor: pointer;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px rgba(0,0,0,0.08)'; this.style.borderColor='${res.color}40';" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)'; this.style.borderColor='var(--border-color)';">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${res.color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="${res.icon}" style="font-size: 1.5rem; color: ${res.color};"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 600;">${res.name}</h3>
                    </div>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; line-height: 1.5; flex: 1;">${res.desc}</p>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: ${res.color}; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        访问网站 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                    </div>
                </div>
            </a>
        `).join('');

        resourcesContent.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; animation: fadeIn 0.4s ease-out;">
                <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark); margin: 0 0 0.5rem 0;">
                        <i class="fa-solid fa-language" style="color: #10b981; margin-right: 10px;"></i>四六级通关秘籍
                    </h2>
                    <p style="color: var(--text-light); margin: 0; font-size: 1rem;">汇集四六级官方报名入口、听力口语原声素材及核心词汇题库网站。</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    window.loadResourceTree = function(type) {
        if (!resourcesTree) return;

        if (type === 'ai_news') {
            resourcesTree.innerHTML = `
                <div style="padding: 1rem;">
                    <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1rem;">分类标签</p>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                        <li style="padding: 8px 12px; background: rgba(99, 102, 241, 0.1); color: var(--primary-color); border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fa-solid fa-fire" style="margin-right: 8px;"></i>最新速递
                        </li>
                        <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                            <i class="fa-solid fa-microchip" style="margin-right: 8px; color: #64748b;"></i>大模型动态
                        </li>
                        <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                            <i class="fa-solid fa-flask" style="margin-right: 8px; color: #64748b;"></i>前沿研究
                        </li>
                        <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                            <i class="fa-solid fa-briefcase" style="margin-right: 8px; color: #64748b;"></i>行业应用
                        </li>
                    </ul>
                </div>
            `;
            loadAINewsContent();
            return;
        }

        resourcesTree.innerHTML = '<div class="loading-state"><div class="loader"></div></div>';
        fetch(`/api/resources/tree?type=${type}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.data && data.data.length > 0) {
                    resourcesTree.innerHTML = '';
                    const ul = document.createElement('ul');
                    ul.className = 'resource-tree-list';
                    ul.style.listStyle = 'none';
                    ul.style.padding = '0';
                    ul.style.margin = '0';
                    data.data.forEach(node => {
                        ul.appendChild(createTreeNode(node, type));
                    });
                    resourcesTree.appendChild(ul);
                } else {
                    resourcesTree.innerHTML = '<div style="padding: 1rem; color: #666; text-align: center;">该分类下暂无资源</div>';
                }
            })
            .catch(err => {
                console.error(err);
                resourcesTree.innerHTML = '<div style="padding: 1rem; color: red; text-align: center;">加载失败</div>';
            });
    };

    function createTreeNode(node, type) {
        const li = document.createElement('li');
        li.style.margin = '4px 0';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'resource-tree-item';
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.padding = '8px 12px';
        itemDiv.style.borderRadius = '6px';
        itemDiv.style.cursor = 'pointer';
        itemDiv.style.transition = 'background 0.2s';
        itemDiv.style.color = 'var(--text-dark)';
        
        itemDiv.onmouseover = () => {
            if(!itemDiv.classList.contains('selected')) {
                itemDiv.style.background = 'rgba(99, 102, 241, 0.1)';
            }
        };
        itemDiv.onmouseout = () => {
            if(!itemDiv.classList.contains('selected')) {
                itemDiv.style.background = 'transparent';
            }
        };

        const icon = document.createElement('i');
        icon.style.marginRight = '10px';
        icon.style.width = '18px';
        icon.style.textAlign = 'center';
        icon.style.fontSize = '1.1rem';
        
        if (node.type === 'directory') {
            icon.className = 'fa-solid fa-layer-group';
            icon.style.color = 'var(--primary-color)';
            icon.style.opacity = '0.8';
        } else {
            if (node.name.toLowerCase() === 'readme.md') {
                icon.className = 'fa-solid fa-star';
                icon.style.color = '#fbbf24';
            } else {
                icon.className = 'fa-regular fa-file-lines';
                icon.style.color = '#94a3b8';
            }
        }

        let displayName = node.name;
        if (node.type === 'file' && displayName.endsWith('.md')) {
            displayName = displayName.replace('.md', '');
            if (displayName.toLowerCase() === 'readme') {
                displayName = '使用指引 (必看)';
            }
        }

        const span = document.createElement('span');
        span.textContent = displayName;
        span.style.fontSize = '0.95rem';
        span.style.whiteSpace = 'nowrap';
        span.style.overflow = 'hidden';
        span.style.textOverflow = 'ellipsis';
        span.style.fontWeight = node.type === 'directory' ? '600' : '500';
        span.style.color = '#1e293b';
        span.title = node.name;
        
        itemDiv.appendChild(icon);
        itemDiv.appendChild(span);
        li.appendChild(itemDiv);

        if (node.type === 'directory' && node.children && node.children.length > 0) {
            const childrenUl = document.createElement('ul');
            childrenUl.style.listStyle = 'none';
            childrenUl.style.paddingLeft = '20px';
            childrenUl.style.margin = '0';
            childrenUl.style.display = 'none';
            
            node.children.forEach(child => {
                childrenUl.appendChild(createTreeNode(child, type));
            });
            
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = childrenUl.style.display === 'block';
                childrenUl.style.display = isExpanded ? 'none' : 'block';
                icon.style.opacity = isExpanded ? '0.8' : '1';
                icon.style.transform = isExpanded ? 'scale(1)' : 'scale(1.1)';
                icon.style.transition = 'all 0.2s';
            });
            
            li.appendChild(childrenUl);
        } else if (node.type === 'file') {
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.resource-tree-item.selected').forEach(el => {
                    el.classList.remove('selected');
                    el.style.background = 'transparent';
                    el.style.color = 'var(--text-dark)';
                });
                itemDiv.classList.add('selected');
                itemDiv.style.background = 'var(--primary-color)';
                itemDiv.style.color = 'white';
                
                loadResourceContent(node.path, type);
            });
        }

        return li;
    }

    function loadAINewsContent() {
        if (!resourcesTree || !resourcesContent) return;
        
        resourcesTree.innerHTML = `
            <div style="padding: 1rem;">
                <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1rem;">分类导航</p>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                    <li style="padding: 8px 12px; background: rgba(99, 102, 241, 0.1); color: var(--primary-color); border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fa-solid fa-fire" style="margin-right: 8px;"></i>AI 前沿资讯
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-microchip" style="margin-right: 8px; color: #64748b;"></i>大模型动态
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-flask" style="margin-right: 8px; color: #64748b;"></i>前沿研究
                    </li>
                    <li style="padding: 8px 12px; color: #1e293b; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-weight: 500;">
                        <i class="fa-solid fa-briefcase" style="margin-right: 8px; color: #64748b;"></i>行业应用
                    </li>
                </ul>
            </div>
        `;

        const aiWebResources = [
            // AI 综合资讯与前沿动态
            { name: '机器之心', url: 'https://www.jiqizhixin.com/', icon: 'fa-solid fa-robot', color: '#0ea5e9', desc: '国内领先的 AI 科技媒体，聚焦前沿技术与产业动态' },
            { name: '新智元', url: 'https://www.aera.com/', icon: 'fa-solid fa-brain', color: '#8b5cf6', desc: '专注于人工智能领域的深度报道与专家智库分析' },
            { name: '量子位', url: 'https://www.qbitai.com/', icon: 'fa-solid fa-atom', color: '#10b981', desc: '追踪 AI 领域的最新突破、大厂动态与开源项目' },
            { name: 'InfoQ', url: 'https://www.infoq.cn/topic/ai', icon: 'fa-solid fa-satellite-dish', color: '#f97316', desc: '面向开发者的前沿技术资讯平台，含大量 AI 实践案例' },
            { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/', icon: 'fa-brands fa-hacker-news', color: '#14b8a6', desc: '全球视角的科技创投媒体，硅谷 AI 创业公司风向标' },
            
            // 顶级大模型与工具平台
            { name: '智谱 AI (ZhipuAI)', url: 'https://www.zhipuai.cn/', icon: 'fa-solid fa-microchip', color: '#3b82f6', desc: '国内顶尖大模型研发机构，GLM 系列大模型官方平台' },
            { name: 'OpenAI', url: 'https://openai.com/', icon: 'fa-solid fa-globe', color: '#10b981', desc: 'ChatGPT 缔造者，引领通用人工智能 (AGI) 发展方向' },
            { name: 'Hugging Face', url: 'https://huggingface.co/', icon: 'fa-regular fa-face-smile-wink', color: '#f59e0b', desc: '全球最大的开源模型社区，AI 界的 GitHub' },
            { name: 'Civitai', url: 'https://civitai.com/', icon: 'fa-solid fa-palette', color: '#3b82f6', desc: '最活跃的 AI 绘画与 AIGC 开源模型分享平台' },
            { name: '魔搭社区 (ModelScope)', url: 'https://www.modelscope.cn/', icon: 'fa-solid fa-cube', color: '#6366f1', desc: '阿里主导的国内开源模型与数据集交流社区' },
            
            // 学术研究与文献
            { name: 'arXiv CS.AI', url: 'https://arxiv.org/list/cs.AI/recent', icon: 'fa-solid fa-scroll', color: '#b91c1c', desc: '全球人工智能领域最新预印本学术论文首发阵地' },
            { name: 'Papers with Code', url: 'https://paperswithcode.com/', icon: 'fa-solid fa-code', color: '#0f766e', desc: '将最新 AI 论文与其开源代码实现完美关联的极客网站' },
            { name: 'Google DeepMind', url: 'https://deepmind.google/', icon: 'fa-brands fa-google', color: '#4285f4', desc: 'AlphaGo 开发团队，全球顶尖的人工智能基础研究机构' },
            { name: 'GitHub Trending', url: 'https://github.com/trending?spoken_language_code=zh', icon: 'fa-brands fa-github', color: '#1e293b', desc: '发掘全球最热门的开源 AI 项目和实战代码仓库' }
        ];

        let cardsHtml = aiWebResources.map(res => `
            <a href="${res.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                <div style="background: white; border-radius: 12px; border: 1px solid var(--border-color); padding: 1.5rem; height: 100%; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; cursor: pointer;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 20px rgba(0,0,0,0.08)'; this.style.borderColor='${res.color}40';" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)'; this.style.borderColor='var(--border-color)';">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${res.color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="${res.icon}" style="font-size: 1.5rem; color: ${res.color};"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 600;">${res.name}</h3>
                    </div>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; line-height: 1.5; flex: 1;">${res.desc}</p>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: ${res.color}; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        访问网站 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                    </div>
                </div>
            </a>
        `).join('');

        resourcesContent.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; animation: fadeIn 0.4s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <div>
                        <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark); margin: 0 0 0.5rem 0;">
                            <i class="fa-solid fa-bolt" style="color: #fbbf24; margin-right: 12px;"></i>AI 前沿资讯与大盘
                        </h2>
                        <p style="color: var(--text-light); margin: 0; font-size: 1rem;">汇集全球最顶尖的 AI 科技媒体、大模型平台与前沿论文社区。</p>
                    </div>
                    <button style="padding: 8px 16px; background: rgba(99, 102, 241, 0.1); color: var(--primary-color); border: none; border-radius: 20px; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(99, 102, 241, 0.2)'" onmouseout="this.style.background='rgba(99, 102, 241, 0.1)'">
                        <i class="fa-solid fa-rotate-right" style="margin-right: 6px;"></i>刷新动态
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    function loadResourceContent(path, type) {
        if (!resourcesContent) return;
        resourcesContent.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%;"><div class="loader"></div></div>';
        
        fetch(`/api/resources/content?path=${encodeURIComponent(path)}&type=${type}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // Pre-process markdown to handle some common issues before parsing
                    let rawContent = data.content;
                    
                    // Add target="_blank" to html links if any exist in raw markdown
                    rawContent = rawContent.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
                    
                    const html = marked.parse(rawContent);
                    resourcesContent.innerHTML = `
                        <div class="markdown-body" style="animation: fadeIn 0.4s ease-out;">
                            ${html}
                        </div>
                    `;
                    resourcesContent.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                    
                    // Fix links in markdown
                    resourcesContent.querySelectorAll('a').forEach(a => {
                        const href = a.getAttribute('href');
                        if (href) {
                            let localPath = null;
                            
                            // Check if it's a github link to the same repo
                            if (href.includes('github.com/miss-mumu/developer2gwy/blob/main/')) {
                                localPath = decodeURIComponent(href.split('github.com/miss-mumu/developer2gwy/blob/main/')[1]);
                            } 
                            // Check if it's a relative path to a .md file
                            else if (href.endsWith('.md') && !href.startsWith('http')) {
                                localPath = decodeURIComponent(href);
                            }

                            if (localPath) {
                                a.removeAttribute('target');
                                a.href = 'javascript:void(0)';
                                a.style.color = 'var(--primary-color)';
                                a.style.textDecoration = 'none';
                                a.style.borderBottom = '1px dashed var(--primary-color)';
                                a.style.transition = 'all 0.2s';
                                
                                a.addEventListener('mouseenter', () => {
                                    a.style.background = 'rgba(99, 102, 241, 0.1)';
                                });
                                a.addEventListener('mouseleave', () => {
                                    a.style.background = 'transparent';
                                });

                                a.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    // Sometimes localPath might start with ./ or /
                                    if (localPath.startsWith('./')) localPath = localPath.substring(2);
                                    if (localPath.startsWith('/')) localPath = localPath.substring(1);
                                    
                                    loadResourceContent(localPath, type);
                                    
                                    // Try to highlight the corresponding tree item
                                    document.querySelectorAll('.resource-tree-item.selected').forEach(el => {
                                        el.classList.remove('selected');
                                        el.style.background = 'transparent';
                                        el.style.color = 'var(--text-dark)';
                                    });
                                });
                            } else if (href.startsWith('http')) {
                                a.setAttribute('target', '_blank');
                                a.setAttribute('rel', 'noopener noreferrer');
                            }
                        }
                    });
                } else {
                    resourcesContent.innerHTML = `<div style="color: red; text-align: center; margin-top: 2rem;">加载失败: ${data.error || '未知错误'}</div>`;
                }
            })
            .catch(err => {
                console.error(err);
                resourcesContent.innerHTML = `<div style="color: red; text-align: center; margin-top: 2rem;">网络错误</div>`;
            });
    }
});
