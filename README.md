# MindNote·AI

MindNote·AI 是一个基于 AI 的沉浸式学习辅助工具，旨在通过现代化的界面和强大的 AI 能力，帮助用户更高效地探索知识、生成笔记和构建知识体系。

## 核心功能

1.  **智能对话 (Chat)**:
    *   集成智谱 AI (GLM-4) 模型。
    *   支持流式响应 (Stream)。
    *   **深度思考模式 (Deep Thinking)**: 支持 AI 展示思考过程。
    *   **联网搜索**: 实时获取网络信息增强回答。

2.  *   **AI 学习日志 (Journal)**:
    *   根据用户输入的主题，自动生成图文并茂的学习日志。
    *   智能规划文章结构（简介、时间轴、核心概念、总结等）。
    *   自动配图（支持 AI 生成或网络爬取）。

4.  **沉浸式 UI**:
    *   玻璃拟态 (Glassmorphism) 设计风格。
    *   流体动效与 3D 交互。
    *   单页应用 (SPA) 体验。

## 技术栈

*   **后端**: Python, Flask
*   **AI 模型**: 智谱 AI (BigModel API)
    *   LLM: glm-4-plus, glm-4-flash
    *   Image: glm-image
    *   Vision: glm-4v-flash
*   **前端**: HTML5, CSS3, JavaScript (原生)
*   **工具**: BeautifulSoup4 (用于图片爬取)

## 快速开始

1.  **安装依赖**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **配置 API Key**:
    *   项目代码中已包含默认 API Key (在 `ai_service.py` 中)，如需通过环境变量配置，请修改 `ai_service.py`。

3.  **运行应用**:
    ```bash
    python app.py
    ```

4.  **访问**:
    *   打开浏览器访问 `http://localhost:5000`。

## 项目结构

*   `app.py`: Flask 应用入口及路由定义。
*   `ai_service.py`: 封装智谱 AI API 调用及核心对话逻辑。
*   `journal_service.py`: 实现 AI 学习日志生成逻辑（规划、并发生成）。
*   `templates/`: HTML 模板文件。
*   `static/`: 静态资源 (CSS, JS, Fonts)。

## 文档

*   [设计文档 (DESIGN_DOC.md)](./DESIGN_DOC.md): 详细的 UI/UX 设计理念。
*   [项目结构 (PROJECT_STRUCTURE.md)](./PROJECT_STRUCTURE.md): 前后端交互流程图。
