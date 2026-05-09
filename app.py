from flask import Flask, render_template, jsonify, request, Response, stream_with_context, session, send_from_directory
from ai_service import AIService
from journal_service import JournalService
from super_search_service import SuperSearchService
from glm5_agent import GLM5Agent
import json
import random
import os
import re
import secrets
import sqlite3
import requests
import time
import base64
from datetime import datetime
from functools import wraps
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "mindnote-dev-secret-key")
ai_service = AIService()
journal_service = JournalService()
super_search_service = SuperSearchService()

# 实例化 GLM5Agent
# 可在设置页中补填 API Key，未配置时仅相关 AI 功能不可用，不阻塞应用启动。
glm5_agent = GLM5Agent()

chat_history = [] 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_DB_PATH = os.path.join(BASE_DIR, "mindnote_users.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

def get_db_connection():
    conn = sqlite3.connect(USER_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_user_system():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            email_verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            last_login TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            asset_type TEXT NOT NULL,
            asset_name TEXT NOT NULL,
            asset_value REAL NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_apps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            app_key TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            visibility TEXT NOT NULL DEFAULT 'private',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    app_columns = {row["name"] for row in cur.execute("PRAGMA table_info(user_apps)").fetchall()}
    if "app_type" not in app_columns:
        cur.execute("ALTER TABLE user_apps ADD COLUMN app_type TEXT NOT NULL DEFAULT 'manual'")
    if "generation_model" not in app_columns:
        cur.execute("ALTER TABLE user_apps ADD COLUMN generation_model TEXT")
    if "learning_topic" not in app_columns:
        cur.execute("ALTER TABLE user_apps ADD COLUMN learning_topic TEXT")
    if "blueprint_json" not in app_columns:
        cur.execute("ALTER TABLE user_apps ADD COLUMN blueprint_json TEXT")
    if "share_token" not in app_columns:
        cur.execute("ALTER TABLE user_apps ADD COLUMN share_token TEXT")
    if "share_enabled" not in app_columns:
        cur.execute("ALTER TABLE user_apps ADD COLUMN share_enabled INTEGER NOT NULL DEFAULT 0")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS social_profiles (
            user_id INTEGER PRIMARY KEY,
            bio TEXT DEFAULT '',
            skills TEXT DEFAULT '',
            allow_collab INTEGER NOT NULL DEFAULT 1,
            followers INTEGER NOT NULL DEFAULT 0,
            following INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content_type TEXT NOT NULL DEFAULT 'course',
            title TEXT NOT NULL,
            summary TEXT DEFAULT '',
            cover_image TEXT DEFAULT '',
            source_url TEXT DEFAULT '',
            payload_json TEXT DEFAULT '{}',
            visibility TEXT NOT NULL DEFAULT 'private',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            published_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER,
            title TEXT NOT NULL,
            summary TEXT DEFAULT '',
            cover_image TEXT DEFAULT '',
            source_url TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            UNIQUE(user_id, target_type, target_id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT DEFAULT '',
            updated_at TEXT NOT NULL
        )
    """)
    knowledge_columns = {row["name"] for row in cur.execute("PRAGMA table_info(knowledge_items)").fetchall()}
    if "cover_image" not in knowledge_columns:
        cur.execute("ALTER TABLE knowledge_items ADD COLUMN cover_image TEXT DEFAULT ''")
    if "source_url" not in knowledge_columns:
        cur.execute("ALTER TABLE knowledge_items ADD COLUMN source_url TEXT DEFAULT ''")
    if "published_at" not in knowledge_columns:
        cur.execute("ALTER TABLE knowledge_items ADD COLUMN published_at TEXT")
    conn.commit()

    now = datetime.utcnow().isoformat()
    seed_users = [
        ("admin@mindnote.local", "管理员", "admin", "Admin@123456"),
        ("test@mindnote.local", "测试用户", "user", "Test@123456")
    ]
    for email, display_name, role, password in seed_users:
        row = cur.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if row:
            continue
        cur.execute(
            """
            INSERT INTO users(email, password_hash, display_name, role, email_verified, created_at)
            VALUES (?, ?, ?, ?, 1, ?)
            """,
            (email, generate_password_hash(password), display_name, role, now)
        )
        user_id = cur.lastrowid
        cur.execute(
            """
            INSERT INTO user_assets(user_id, asset_type, asset_name, asset_value, updated_at)
            VALUES (?, 'token', '学习积分', 1200, ?)
            """,
            (user_id, now)
        )
        cur.execute(
            """
            INSERT INTO user_apps(user_id, app_key, title, description, status, visibility, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'published', 'public', ?, ?)
            """,
            (user_id, f"{role}-starter", f"{display_name}的示例应用", "用于演示用户应用资产结构。", now, now)
        )
        cur.execute(
            """
            INSERT OR REPLACE INTO social_profiles(user_id, bio, skills, allow_collab, followers, following)
            VALUES (?, ?, ?, 1, 0, 0)
            """,
            (user_id, "欢迎来到 MindNote 社区", "AI教育|课程设计|学习方法")
        )
    conn.commit()
    conn.close()

def require_login():
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not session.get("user_id"):
                return jsonify({"error": "请先登录"}), 401
            return func(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id, email, display_name, role, email_verified, created_at, last_login FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def get_app_setting(setting_key: str, default_value: str = "") -> str:
    conn = get_db_connection()
    row = conn.execute(
        "SELECT setting_value FROM app_settings WHERE setting_key = ?",
        (setting_key,)
    ).fetchone()
    conn.close()
    return row["setting_value"] if row else default_value

def set_app_setting(setting_key: str, setting_value: str):
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO app_settings(setting_key, setting_value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET
            setting_value = excluded.setting_value,
            updated_at = excluded.updated_at
        """,
        (setting_key, setting_value, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()

def mask_api_key(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * (len(value) - 8)}{value[-4:]}"

def apply_runtime_api_key(api_key: str | None):
    cleaned = (api_key or "").strip() or None
    ai_service.set_api_key(cleaned)
    journal_service.set_api_key(cleaned)
    super_search_service.ai_service.set_api_key(cleaned)
    glm5_agent.set_api_key(cleaned)

def parse_iso_datetime(value):
    try:
        return datetime.fromisoformat(str(value))
    except Exception:
        return datetime.utcnow()

def compute_recommendation_score(updated_at, title="", summary="", share_enabled=False, visibility="private"):
    now = datetime.utcnow()
    ts = parse_iso_datetime(updated_at)
    hours = max(1.0, (now - ts).total_seconds() / 3600.0)
    freshness = max(0.0, 60.0 - min(60.0, hours / 2.0))
    quality = min(25.0, (len(str(title)) + len(str(summary))) / 8.0)
    share_bonus = 20.0 if share_enabled else 0.0
    public_bonus = 12.0 if str(visibility) == "public" else 0.0
    return round(freshness + quality + share_bonus + public_bonus, 2)

def serialize_knowledge_row(row):
    item = dict(row)
    payload_text = item.get("payload_json") or "{}"
    try:
        payload = json.loads(payload_text)
    except Exception:
        payload = {}
    item["payload"] = payload
    item.pop("payload_json", None)
    return item

def strip_audio_fields_from_payload(payload):
    if not isinstance(payload, dict):
        return {}
    cleaned = {
        "source_type": payload.get("source_type"),
        "generation_model": payload.get("generation_model"),
        "blog_markdown": payload.get("blog_markdown") if isinstance(payload.get("blog_markdown"), str) else "",
        "page_count": payload.get("page_count")
    }
    units = payload.get("lesson_units")
    safe_units = []
    if isinstance(units, list):
        for unit in units:
            if not isinstance(unit, dict):
                continue
            new_unit = dict(unit)
            new_unit.pop("audio_base64", None)
            new_unit.pop("audio_mime", None)
            safe_units.append(new_unit)
    slides = payload.get("slides")
    safe_slides = []
    if isinstance(slides, list):
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            new_slide = dict(slide)
            new_slide.pop("audio_base64", None)
            new_slide.pop("audio_mime", None)
            safe_slides.append(new_slide)
    cleaned["lesson_units"] = safe_units
    cleaned["slides"] = safe_slides
    return cleaned

def ensure_payload_audio(payload, voice="female"):
    if not isinstance(payload, dict):
        return payload, 0
    units = payload.get("lesson_units")
    if not isinstance(units, list) or not units:
        return payload, 0
    has_audio = any(isinstance(unit, dict) and unit.get("audio_base64") for unit in units)
    if has_audio:
        return payload, 0
    generated = 0
    for unit in units:
        if not isinstance(unit, dict):
            continue
        note = str(unit.get("speaker_note") or unit.get("explanation") or "").strip()
        if not note:
            continue
        audio_base64, audio_mime, _ = synthesize_tts_audio_base64(note, voice=voice)
        if audio_base64:
            unit["audio_base64"] = audio_base64
            unit["audio_mime"] = audio_mime or "audio/mp3"
            generated += 1
    payload["lesson_units"] = units
    return payload, generated

def trim_payload_for_hub(payload):
    if not isinstance(payload, dict):
        return {}
    cleaned = {
        "source_type": payload.get("source_type"),
        "generation_model": payload.get("generation_model"),
        "page_count": payload.get("page_count")
    }
    units = payload.get("lesson_units")
    compact_units = []
    if isinstance(units, list):
        for unit in units[:20]:
            if not isinstance(unit, dict):
                continue
            compact_units.append({
                "index": unit.get("index"),
                "unit_title": unit.get("unit_title") or unit.get("title"),
                "key_takeaway": unit.get("key_takeaway"),
                "highlight": unit.get("highlight"),
                "image_url": unit.get("image_url"),
                "layout_style": unit.get("layout_style"),
                "theme_style": unit.get("theme_style"),
                "source_link": unit.get("source_link"),
                "points": (unit.get("points") if isinstance(unit.get("points"), list) else [])[:4]
            })
    cleaned["lesson_units"] = compact_units
    slides = payload.get("slides")
    compact_slides = []
    if isinstance(slides, list):
        for slide in slides[:20]:
            if not isinstance(slide, dict):
                continue
            compact_slides.append({
                "index": slide.get("index"),
                "title": slide.get("title"),
                "points": slide.get("points") if isinstance(slide.get("points"), list) else [],
                "highlight": slide.get("highlight"),
                "image_url": slide.get("image_url"),
                "layout_style": slide.get("layout_style"),
                "theme_style": slide.get("theme_style"),
                "source_link": slide.get("source_link"),
                "speaker_note": slide.get("speaker_note")
            })
    cleaned["slides"] = compact_slides
    blog_text = payload.get("blog_markdown") if isinstance(payload.get("blog_markdown"), str) else ""
    cleaned["blog_markdown"] = blog_text[:1000]
    return cleaned

init_user_system()
apply_runtime_api_key(get_app_setting("zhipu_api_key", os.getenv("ZHIPUAI_API_KEY") or os.getenv("ZAI_API_KEY") or ""))

# Mock data for demonstration
LEARNING_MATERIALS = [
    {
        "id": 1, 
        "title": "深度学习基础概念", 
        "type": "pdf", 
        "category": "Deep Learning",
        "date": "2023-10-27",
        "image": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
        "description": "全面解析神经网络、反向传播与梯度下降的核心原理。"
    },
    {
        "id": 2, 
        "title": "Transformer模型详解", 
        "type": "video", 
        "category": "NLP",
        "date": "2023-10-28",
        "image": "https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1000&auto=format&fit=crop",
        "description": "深入理解 Attention 机制与 Transformer 架构细节。"
    },
    {
        "id": 3, 
        "title": "Python数据分析实战", 
        "type": "article", 
        "category": "Data Science",
        "date": "2023-10-29",
        "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
        "description": "使用 Pandas 和 NumPy 处理真实世界数据集的实战指南。"
    },
    {
        "id": 4, 
        "title": "自然语言处理导论", 
        "type": "pdf", 
        "category": "NLP",
        "date": "2023-10-30",
        "image": "https://images.unsplash.com/photo-1655635643532-fa9ba2696be4?q=80&w=1000&auto=format&fit=crop",
        "description": "NLP 领域入门必读，涵盖词向量、序列模型等基础知识。"
    },
    {
        "id": 5, 
        "title": "强化学习：从入门到精通", 
        "type": "video", 
        "category": "Reinforcement Learning",
        "date": "2023-11-01",
        "image": "https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=1000&auto=format&fit=crop",
        "description": "探索智能体如何在环境中通过试错来学习最优策略。"
    }
]

# New Mock Data for Discovery Feed (News, User Works, Agent Apps)
DISCOVERY_CONTENT = [
    {
        "id": 101,
        "title": "AI Agent 生态系统全景图",
        "type": "article",
        "category": "Industry News",
        "date": "2023-11-10",
        "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
        "description": "深入分析当前 AI Agent 的发展现状与未来趋势，涵盖主流框架与应用场景。",
        "author": "TechDaily"
    },
    {
        "id": 102,
        "title": "Auto-Coder: 自动代码生成助手",
        "type": "app",
        "category": "Agent App",
        "date": "2023-11-09",
        "image": "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1000&auto=format&fit=crop",
        "description": "由社区用户开发的自动化编程助手，支持 Python、JS 等多种语言，提升开发效率。",
        "author": "DevMaster"
    },
    {
        "id": 103,
        "title": "使用 LLM 构建个人知识库的实践",
        "type": "project",
        "category": "User Work",
        "date": "2023-11-08",
        "image": "https://images.unsplash.com/photo-1456324504439-367cee10d6e6?q=80&w=1000&auto=format&fit=crop",
        "description": "分享如何利用 LangChain 和本地向量数据库搭建私有知识库的完整流程。",
        "author": "KnowledgeSeeker"
    },
    {
        "id": 104,
        "title": "OpenAI 发布 GPT-4 Turbo",
        "type": "news",
        "category": "Tech News",
        "date": "2023-11-07",
        "image": "https://images.unsplash.com/photo-1676299000036-96f63124d665?q=80&w=1000&auto=format&fit=crop",
        "description": "更强大的性能、更长的上下文窗口以及更低的价格，GPT-4 Turbo 带来重大更新。",
        "author": "AI Insider"
    },
    {
        "id": 105,
        "title": "MindMap Generator",
        "type": "app",
        "category": "Agent App",
        "date": "2023-11-06",
        "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop",
        "description": "一键将文本大纲转换为精美思维导图的 AI 应用，支持导出多种格式。",
        "author": "VisualThinker"
    },
     {
        "id": 106,
        "title": "生成式 AI 在教育领域的应用探索",
        "type": "article",
        "category": "Education",
        "date": "2023-11-05",
        "image": "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop",
        "description": "探讨 AI 如何改变传统教学模式，实现个性化学习路径。",
        "author": "EduTech"
    }
]

# Knowledge Base Mock Data
KNOWLEDGE_BASE_DATA = {
    "folders": [
        {"id": "f1", "name": "我的笔记", "icon": "fa-book"},
        {"id": "f2", "name": "论文收藏", "icon": "fa-graduation-cap"},
        {"id": "f3", "name": "项目文档", "icon": "fa-folder-open"},
        {"id": "f4", "name": "待读列表", "icon": "fa-clock"}
    ],
    "documents": [
        {"id": "d1", "folder_id": "f1", "title": "Flask 学习笔记.md", "type": "markdown", "date": "2023-11-12", "size": "24KB"},
        {"id": "d2", "folder_id": "f1", "title": "Python 高级特性总结.pdf", "type": "pdf", "date": "2023-11-10", "size": "2.5MB"},
        {"id": "d3", "folder_id": "f2", "title": "Attention Is All You Need.pdf", "type": "pdf", "date": "2023-11-05", "size": "4.1MB"},
        {"id": "d4", "folder_id": "f2", "title": "YOLOv8 论文解析.docx", "type": "word", "date": "2023-11-08", "size": "1.2MB"},
        {"id": "d5", "folder_id": "f3", "title": "MindNote 需求文档_v1.0.pdf", "type": "pdf", "date": "2023-11-15", "size": "850KB"},
        {"id": "d6", "folder_id": "f3", "title": "API 接口定义.json", "type": "code", "date": "2023-11-15", "size": "12KB"},
    ]
}

# Analytics Mock Data
ANALYTICS_DATA = {
    "weekly_activity": [3, 5, 2, 8, 6, 4, 7], # Mon-Sun hours
    "total_hours": 42.5,
    "courses_completed": 12,
    "streak_days": 5,
    "subject_distribution": [
        {"name": "Python", "value": 40},
        {"name": "Deep Learning", "value": 30},
        {"name": "Math", "value": 20},
        {"name": "Others", "value": 10}
    ]
}

# Settings Mock Data
SETTINGS_DATA = {
    "notifications": {
        "email_digest": True,
        "push_notifications": False,
        "new_course_alert": True
    },
    "appearance": {
        "theme": "light",
        "font_size": "medium"
    },
    "account": {
        "email": "user@example.com",
        "plan": "Free Plan"
    },
    "ai": {
        "provider": "zhipu",
        "has_api_key": False,
        "api_key_masked": ""
    }
}

# Social Mock Data
SOCIAL_DATA = {
    "posts": [
        {
            "id": 1,
            "user": "Alex Chen",
            "avatar": "https://ui-avatars.com/api/?name=Alex+Chen&background=6366f1&color=fff",
            "time": "10分钟前",
            "content": "刚刚完成了 Transformer 模型的复现！Deep Learning 真的太迷人了。分享一下我的学习笔记，希望能帮到大家。🚀",
            "tags": ["Deep Learning", "NLP", "Notes"],
            "likes": 42,
            "comments": 5,
            "image": ""
        },
        {
            "id": 2,
            "user": "Sarah Jones",
            "avatar": "https://ui-avatars.com/api/?name=Sarah+Jones&background=ec4899&color=fff",
            "time": "35分钟前",
            "content": "有人在研究 LangChain 吗？遇到一个关于 Memory 模块的问题，求大佬指点！😫",
            "tags": ["LangChain", "LLM", "Help"],
            "likes": 12,
            "comments": 8,
            "image": ""
        },
        {
            "id": 3,
            "user": "David Wang",
            "avatar": "https://ui-avatars.com/api/?name=David+Wang&background=06b6d4&color=fff",
            "time": "1小时前",
            "content": "强烈推荐这个 Python 数据可视化教程！做出来的图表太美了。",
            "tags": ["Python", "DataViz", "Recommendation"],
            "likes": 89,
            "comments": 15,
            "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
        }
    ],
    "topics": [
        {"name": "深度学习", "count": 1240},
        {"name": "Python编程", "count": 856},
        {"name": "论文研读", "count": 632},
        {"name": "职场进阶", "count": 420}
    ],
    "active_users": [
        {"name": "Alice", "avatar": "https://ui-avatars.com/api/?name=Alice&background=random"},
        {"name": "Bob", "avatar": "https://ui-avatars.com/api/?name=Bob&background=random"},
        {"name": "Charlie", "avatar": "https://ui-avatars.com/api/?name=Charlie&background=random"}
    ]
}

AI_APPS_DATA = [
    {
        "id": "app-6",
        "name": "PDF/网址转PPT语音博客",
        "description": "上传 PDF 或输入网址，自动解析生成在线PPT、博客文案与逐页语音讲解。",
        "category": "内容生产",
        "mode": "多模态",
        "icon": "fa-file-powerpoint",
        "target": "ppt-blog-lab",
        "featured": True,
        "tags": ["PDF解析", "网页提炼", "PPT脚本", "语音博客"]
    },
    {
        "id": "app-5",
        "name": "AI 反遗忘作战舱",
        "description": "自动生成记忆卡组与复习节奏，通过回忆评分驱动 AI 纠偏，快速降低遗忘率。",
        "category": "记忆训练",
        "mode": "卡组式",
        "icon": "fa-brain-circuit",
        "target": "memory-lab",
        "featured": True,
        "tags": ["记忆卡组", "间隔复习", "错因纠偏"]
    },
    {
        "id": "app-0",
        "name": "AI 学习闯关工坊",
        "description": "把学习目标自动拆成闯关任务，边学边问 AI 教练，最后生成复盘报告。",
        "category": "学习挑战",
        "mode": "闯关式",
        "icon": "fa-route",
        "target": "learning-quest",
        "featured": True,
        "tags": ["任务拆解", "AI教练", "复盘报告"]
    },
    {
        "id": "app-1",
        "name": "AI 学习助手",
        "description": "支持流式问答、深度思考和联网检索，适合日常学习答疑与知识讲解。",
        "category": "智能问答",
        "mode": "对话式",
        "icon": "fa-brain",
        "target": "ai",
        "featured": True,
        "tags": ["问答", "联网搜索", "思维引导"]
    },
    {
        "id": "app-2",
        "name": "AI 灵感手账",
        "description": "一键生成结构化学习手账，支持图文混排与灵感记录。",
        "category": "内容创作",
        "mode": "工作台",
        "icon": "fa-book-journal-whills",
        "target": "journal",
        "featured": True,
        "tags": ["手账", "学习规划", "图文布局"]
    },
    {
        "id": "app-3",
        "name": "超级搜索图谱",
        "description": "围绕主题生成知识图谱，并提供节点级 AI 教学增强能力。",
        "category": "知识探索",
        "mode": "图谱式",
        "icon": "fa-network-wired",
        "target": "super-search",
        "featured": True,
        "tags": ["图谱", "深挖", "课堂设计"]
    },
    {
        "id": "app-4",
        "name": "学习分析中心",
        "description": "统计学习进展、行为习惯和学科分布，帮助制定学习策略。",
        "category": "学习管理",
        "mode": "分析式",
        "icon": "fa-chart-pie",
        "target": "analysis",
        "featured": False,
        "tags": ["进度", "数据分析", "复盘"]
    }
]
def collect_ai_text(prompt, enable_search=False, thinking_mode="balanced"):
    try:
        messages = [{"role": "user", "content": prompt}]
        chunks = []
        for item in ai_service.stream_chat(messages, enable_search=enable_search, thinking_mode=thinking_mode):
            if item.get("type") == "content":
                chunks.append(item.get("content", ""))
            elif item.get("type") == "error":
                err = item.get("content", "")
                if err:
                    return f"AI 生成失败：{err}"
        text = "".join(chunks).strip()
        return text if text else "AI 暂未返回结果，请稍后重试。"
    except Exception:
        return "AI 服务暂时繁忙，已为你生成结构化备用方案。"

def call_bigmodel_chat_once(messages, model_name, temperature=0.5, max_tokens=4096, response_format=None):
    payload = {
        "model": model_name,
        "messages": messages,
        "stream": False,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    if response_format:
        payload["response_format"] = response_format
    response = requests.post(ai_service.chat_url, headers=ai_service.get_headers(), json=payload, timeout=90)
    if response.status_code != 200:
        raise RuntimeError(f"{model_name} 调用失败: {response.status_code}")
    content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        raise RuntimeError(f"{model_name} 未返回有效内容")
    return content

def call_bigmodel_chat_with_fallback(messages, model_candidates, temperature=0.5, max_tokens=4096, response_format=None):
    last_error = None
    for model_name in model_candidates:
        try:
            content = call_bigmodel_chat_once(
                messages=messages,
                model_name=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format
            )
            return content, model_name
        except Exception as err:
            last_error = err
    raise RuntimeError(str(last_error) if last_error else "模型调用失败")

def choose_generation_models(preferred_model, text_length):
    normalized = str(preferred_model or "auto").strip().lower()
    if normalized in ["glm-5", "glm5"]:
        return ["glm-5", "glm-4.7", "glm-4-plus"]
    if normalized in ["glm-4.7", "glm4.7", "glm-47"]:
        return ["glm-4.7", "glm-5", "glm-4-plus"]
    return ["glm-5", "glm-4.7", "glm-4-plus"]

def decide_auto_page_plan(text_length, style_hint=""):
    hint = str(style_hint or "").lower()
    if text_length >= 18000:
        target = 22
    elif text_length >= 12000:
        target = 18
    elif text_length >= 7000:
        target = 14
    elif text_length >= 3500:
        target = 10
    else:
        target = 8
    if any(key in hint for key in ["深度", "详细", "系统", "完整", "细讲"]):
        target += 2
    min_pages = max(6, target - 3)
    max_pages = min(30, target + 6)
    return target, min_pages, max_pages

def extract_image_candidates(text, limit=12):
    content = str(text or "")
    candidates = []
    markdown_matches = re.findall(r"!\[[^\]]*\]\((https?://[^)\s]+)\)", content, flags=re.IGNORECASE)
    direct_matches = re.findall(r"https?://[^\s\"')]+(?:png|jpg|jpeg|webp|gif)", content, flags=re.IGNORECASE)
    for url in markdown_matches + direct_matches:
        clean = url.strip()
        if clean and clean not in candidates:
            candidates.append(clean)
        if len(candidates) >= limit:
            break
    return candidates

def contains_emoji(text):
    if not text:
        return False
    for ch in str(text):
        code = ord(ch)
        if 0x1F300 <= code <= 0x1FAFF:
            return True
    return False

def decorate_with_emoji(text, index):
    value = str(text or "").strip()
    if not value:
        return value
    if contains_emoji(value):
        return value
    emojis = ["🎯", "🧠", "✨", "🚀", "📌", "🔍", "💡", "📘", "🧩", "🌟"]
    return f"{emojis[index % len(emojis)]} {value}"

def strip_parenthetical_noise(text):
    content = str(text or "")
    content = re.sub(r"（[^）]{10,}）", "", content)
    content = re.sub(r"\([^)]{10,}\)", "", content)
    content = re.sub(r"[；;]{2,}", "；", content)
    content = re.sub(r"\s+", " ", content).strip()
    return content

def clean_text_for_display(text, limit=220):
    value = strip_parenthetical_noise(text)
    value = re.sub(r"[,，]{2,}", "，", value)
    value = re.sub(r"[。]{2,}", "。", value)
    return value[:limit]

def simplify_material_text(text, limit=20000):
    content = str(text or "")
    content = re.sub(r"（[^）]{16,}）", " ", content)
    content = re.sub(r"\([^)]{16,}\)", " ", content)
    content = re.sub(r"\s+", " ", content).strip()
    return content[:limit]

def sanitize_tts_text(text, limit=320):
    content = strip_parenthetical_noise(text)
    content = re.sub(r"（[^）]*）", " ", content)
    content = re.sub(r"\([^)]*\)", " ", content)
    content = re.sub(r"【[^】]*】", " ", content)
    content = re.sub(r"\[[^\]]*\]", " ", content)
    content = re.sub(r"[\U0001F100-\U0001FAFF\u2600-\u27BF]", "", content)
    content = re.sub(r"[“”\"'`*_#~`><]", "", content)
    content = re.sub(r"\s*[-•·]+\s*", "，", content)
    content = re.sub(r"\d+\s*[).、．]", "", content)
    content = re.sub(r"\s+", " ", content).strip()
    content = re.sub(r"[，,]{2,}", "，", content)
    content = re.sub(r"[。.!?]{2,}", "。", content)
    return content[:limit]

def build_vivid_speaker_note(title, points, example):
    clean_points = [clean_text_for_display(item, 80) for item in (points or []) if str(item).strip()]
    core = clean_points[:3]
    if not core:
        core = ["我们先快速建立问题背景", "再拆解核心概念", "最后给出可执行建议"]
    intro_pool = [
        f"这一页我们轻松聊聊“{strip_parenthetical_noise(title)}”。",
        f"先从“{strip_parenthetical_noise(title)}”这个点展开，别急，我们一步一步来。",
        f"说到“{strip_parenthetical_noise(title)}”，你可以先抓住最核心的几件事。"
    ]
    intro = intro_pool[len(core) % len(intro_pool)]
    body = f"第一眼先看：{core[0]}。"
    if len(core) > 1:
        body += f"接着第二点：{core[1]}。"
    if len(core) > 2:
        body += f"最后第三点：{core[2]}。"
    case_line = ""
    if example:
        case_line = f"给你一个直观例子：{clean_text_for_display(example, 90)}。"
    closing = "你可以边听边想：放到你的场景里，最想先试哪一步？"
    result = f"{intro}{body}{case_line}{closing}"
    return clean_text_for_display(result, 320)

def extract_images_from_source_url(source_url, limit=16):
    if not source_url or not re.match(r"^https?://", source_url, re.IGNORECASE):
        return []
    try:
        response = requests.get(source_url, timeout=20, headers={"User-Agent": "MindNoteAI/1.0"})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        urls = []
        for img in soup.find_all("img"):
            src = (img.get("src") or "").strip()
            if not src:
                continue
            full = urljoin(source_url, src)
            if not re.match(r"^https?://", full, re.IGNORECASE):
                continue
            if full not in urls:
                urls.append(full)
            if len(urls) >= limit:
                break
        return urls
    except Exception:
        return []

def extract_image_from_search_result_item(item):
    if not isinstance(item, dict):
        return ""
    for key in ["icon", "image", "image_url", "cover", "thumbnail"]:
        value = item.get(key)
        if isinstance(value, str) and re.search(r"\.(png|jpe?g|webp|gif)(\?|$)", value, re.IGNORECASE):
            return value
    for key in ["link", "content"]:
        value = item.get(key)
        if not isinstance(value, str):
            continue
        match = re.search(r"https?://[^\s\"')]+(?:png|jpe?g|webp|gif)", value, re.IGNORECASE)
        if match:
            return match.group(0)
    return ""

def search_image_candidates_via_web(query, limit=8):
    clean_query = (query or "").strip()
    if not clean_query:
        return []
    payload = {
        "search_query": clean_query[:70],
        "search_engine": "search_std",
        "search_intent": False,
        "count": min(20, max(5, limit * 2)),
        "content_size": "medium"
    }
    try:
        response = requests.post(
            "https://open.bigmodel.cn/api/paas/v4/web_search",
            headers=ai_service.get_headers(),
            json=payload,
            timeout=35
        )
        if response.status_code != 200:
            return []
        data = response.json() if response.content else {}
        results = data.get("search_result") if isinstance(data, dict) else []
        urls = []
        if isinstance(results, list):
            for item in results:
                img = extract_image_from_search_result_item(item)
                if img and img not in urls:
                    urls.append(img)
                if len(urls) >= limit:
                    break
        return urls
    except Exception:
        return []

def search_related_links_via_web(query, limit=8):
    clean_query = (query or "").strip()
    if not clean_query:
        return []
    payload = {
        "search_query": clean_query[:80],
        "search_engine": "search_std",
        "search_intent": False,
        "count": min(24, max(8, limit * 2)),
        "content_size": "medium"
    }
    try:
        response = requests.post(
            "https://open.bigmodel.cn/api/paas/v4/web_search",
            headers=ai_service.get_headers(),
            json=payload,
            timeout=35
        )
        if response.status_code != 200:
            return []
        data = response.json() if response.content else {}
        results = data.get("search_result") if isinstance(data, dict) else []
        links = []
        if isinstance(results, list):
            for item in results:
                if not isinstance(item, dict):
                    continue
                url = str(item.get("link") or item.get("url") or "").strip()
                title = clean_text_for_display(item.get("title") or item.get("name") or "", 80)
                snippet = clean_text_for_display(item.get("content") or item.get("snippet") or "", 160)
                if not re.match(r"^https?://", url, re.IGNORECASE):
                    continue
                links.append({"url": url, "title": title or url, "snippet": snippet})
                if len(links) >= limit:
                    break
        return links
    except Exception:
        return []

def generate_visual_image_url(image_prompt):
    prompt = (image_prompt or "").strip()
    if not prompt:
        return ""
    payload = {
        "model": "glm-image",
        "prompt": prompt[:400],
        "size": "1536x1024"
    }
    try:
        response = requests.post(
            "https://open.bigmodel.cn/api/paas/v4/images/generations",
            headers=ai_service.get_headers(),
            json=payload,
            timeout=80
        )
        if response.status_code != 200:
            return ""
        data = response.json() if response.content else {}
        options = data.get("data") if isinstance(data, dict) else None
        if isinstance(options, list) and options:
            first = options[0] if isinstance(options[0], dict) else {}
            for key in ["url", "image_url", "image"]:
                value = first.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        for key in ["url", "image_url", "image"]:
            value = data.get(key) if isinstance(data, dict) else None
            if isinstance(value, str) and value.strip():
                return value.strip()
    except Exception:
        return ""
    return ""

def extract_text_via_web_reader(source_url):
    reader_url = "https://open.bigmodel.cn/api/paas/v4/reader"
    payload = {
        "url": source_url,
        "timeout": 20,
        "no_cache": False,
        "return_format": "markdown",
        "retain_images": True,
        "no_gfm": False,
        "keep_img_data_url": False,
        "with_images_summary": False,
        "with_links_summary": True
    }
    response = requests.post(reader_url, headers=ai_service.get_headers(), json=payload, timeout=45)
    if response.status_code != 200:
        raise RuntimeError(f"网页阅读API失败: {response.status_code}")
    data = response.json() if response.content else {}
    reader_result = data.get("reader_result") if isinstance(data, dict) else {}
    if not isinstance(reader_result, dict):
        reader_result = {}
    title = str(reader_result.get("title") or "").strip()
    description = str(reader_result.get("description") or "").strip()
    content = str(reader_result.get("content") or "").strip()
    merged = f"标题：{title}\n\n摘要：{description}\n\n正文：{content}".strip()
    if len(merged) < 80:
        raise RuntimeError("网页阅读API返回内容过少")
    return merged[:22000]

def extract_text_from_url(source_url):
    if not source_url or not re.match(r"^https?://", source_url, re.IGNORECASE):
        raise ValueError("请输入合法的网址，必须以 http:// 或 https:// 开头")
    try:
        return extract_text_via_web_reader(source_url)
    except Exception:
        response = requests.get(source_url, timeout=25, headers={"User-Agent": "MindNoteAI/1.0"})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        title = (soup.title.string or "").strip() if soup.title else ""
        body_text = " ".join(soup.stripped_strings)
        text = f"标题：{title}\n\n正文：{body_text}".strip()
        if len(text) < 80:
            raise ValueError("网页可提取文本过少，请更换网址或检查页面权限")
        return text[:22000]

def _extract_parser_task_id(payload):
    candidates = [
        payload.get("id"),
        payload.get("task_id"),
        payload.get("taskId"),
        payload.get("taskIid"),
        (payload.get("data") or {}).get("task_id") if isinstance(payload.get("data"), dict) else None,
        (payload.get("data") or {}).get("taskId") if isinstance(payload.get("data"), dict) else None,
        (payload.get("result") or {}).get("task_id") if isinstance(payload.get("result"), dict) else None,
        (payload.get("result") or {}).get("id") if isinstance(payload.get("result"), dict) else None
    ]
    for item in candidates:
        if isinstance(item, str) and item.strip():
            return item.strip()
    return ""

def _extract_parser_text(payload):
    if not isinstance(payload, dict):
        return ""
    flat_candidates = [
        payload.get("text"),
        payload.get("content"),
        payload.get("markdown"),
        payload.get("result_markdown"),
        payload.get("result_text")
    ]
    for item in flat_candidates:
        if isinstance(item, str) and item.strip():
            return item.strip()
    data = payload.get("data")
    if isinstance(data, dict):
        for key in ["text", "content", "markdown", "result_markdown", "result_text", "parsed_text"]:
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    result = payload.get("result")
    if isinstance(result, dict):
        for key in ["text", "content", "markdown"]:
            value = result.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return ""

def extract_text_from_pdf_via_parser(file_storage):
    token = ai_service.get_headers().get("Authorization", "")
    if not token:
        raise RuntimeError("鉴权失败，无法调用文件解析服务")
    create_url = "https://open.bigmodel.cn/api/paas/v4/files/parser/create"
    poll_url_base = "https://open.bigmodel.cn/api/paas/v4/files/parser/result"
    file_name = file_storage.filename or "upload.pdf"
    file_bytes = file_storage.read()
    if not file_bytes:
        raise ValueError("上传文件为空")
    create_resp = requests.post(
        create_url,
        headers={"Authorization": token},
        files={"file": (file_name, file_bytes, file_storage.mimetype or "application/pdf")},
        data={"tool_type": "prime", "file_type": "PDF"},
        timeout=60
    )
    if create_resp.status_code != 200:
        raise RuntimeError(f"文件解析任务创建失败: {create_resp.status_code}")
    create_payload = create_resp.json()
    task_id = _extract_parser_task_id(create_payload)
    if not task_id:
        raise RuntimeError("文件解析任务ID获取失败")

    format_candidates = ["markdown", "md", "text", "txt", "json"]
    for _ in range(36):
        for format_type in format_candidates:
            poll_resp = requests.get(
                f"{poll_url_base}/{task_id}/{format_type}",
                headers={"Authorization": token},
                timeout=30
            )
            if poll_resp.status_code != 200:
                continue
            content_type = (poll_resp.headers.get("Content-Type") or "").lower()
            if "application/json" in content_type:
                payload = poll_resp.json()
                status = str(payload.get("status") or payload.get("state") or "").lower()
                if status in ["failed", "error", "cancelled"]:
                    raise RuntimeError("文件解析失败，请检查PDF内容后重试")
                text = _extract_parser_text(payload)
                if text:
                    return text[:22000]
            else:
                text = (poll_resp.text or "").strip()
                if text and not text.startswith("{"):
                    return text[:22000]
        time.sleep(2.0)
    raise RuntimeError("文件解析超时，请稍后重试")

def extract_text_from_pdf_local(file_storage):
    try:
        from PyPDF2 import PdfReader
    except Exception:
        return ""
    try:
        file_storage.seek(0)
    except Exception:
        pass
    try:
        reader = PdfReader(file_storage)
        parts = []
        for page in reader.pages[:40]:
            text = page.extract_text() or ""
            text = clean_text_for_display(text, 1200)
            if text:
                parts.append(text)
        merged = "\n".join(parts).strip()
        return simplify_material_text(merged, 22000)
    except Exception:
        return ""

def _extract_audio_base64_from_tts_json(payload_json):
    if not isinstance(payload_json, dict):
        return ""
    direct = [
        payload_json.get("audio"),
        payload_json.get("audio_base64"),
        payload_json.get("content")
    ]
    for item in direct:
        if isinstance(item, str) and item.strip():
            return item.strip()
    data = payload_json.get("data")
    if isinstance(data, dict):
        for key in ["audio", "audio_base64", "content"]:
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    choices = payload_json.get("choices")
    if isinstance(choices, list):
        merged = []
        for choice in choices:
            if not isinstance(choice, dict):
                continue
            delta = choice.get("delta") if isinstance(choice.get("delta"), dict) else {}
            chunk = delta.get("content")
            if isinstance(chunk, str) and chunk.strip():
                merged.append(chunk.strip())
        if merged:
            return "".join(merged)
    return ""

def _guess_audio_mime_from_base64(audio_base64, fallback="audio/wav"):
    prefix = (audio_base64 or "")[:16]
    if prefix.startswith("UklGR"):
        return "audio/wav"
    if prefix.startswith("SUQz") or prefix.startswith("//uQ") or prefix.startswith("/+MY"):
        return "audio/mpeg"
    return fallback

def synthesize_tts_audio_base64(text, voice="female"):
    short_text = (text or "").strip()
    if not short_text:
        return "", "", "empty_text"
    short_text = sanitize_tts_text(short_text, 320)
    tts_url = "https://open.bigmodel.cn/api/paas/v4/audio/speech"
    voice_candidates = []
    for item in [voice, "female", "zh_female_qingxin", "zh_male_haotian"]:
        v = str(item or "").strip()
        if v and v not in voice_candidates:
            voice_candidates.append(v)
    payloads = []
    for v in voice_candidates:
        for fmt in ["mp3", "wav"]:
            payloads.append({
                "model": "glm-tts",
                "input": short_text,
                "voice": v,
                "response_format": fmt,
                "speed": 1.28,
                "volume": 1.0
            })
    for fmt in ["mp3", "wav"]:
        payloads.append({
            "model": "glm-tts",
            "input": short_text,
            "response_format": fmt,
            "speed": 1.22,
            "volume": 1.0
        })
    last_error = "tts_unavailable"
    default_mime_map = {"wav": "audio/wav", "mp3": "audio/mpeg"}
    for payload in payloads:
        try:
            response = requests.post(tts_url, headers=ai_service.get_headers(), json=payload, timeout=60)
            if response.status_code != 200:
                try:
                    err_json = response.json()
                    err_obj = err_json.get("error") if isinstance(err_json, dict) else {}
                    err_msg = err_obj.get("message") if isinstance(err_obj, dict) else ""
                    last_error = err_msg or f"status_{response.status_code}"
                except Exception:
                    last_error = f"status_{response.status_code}"
                continue
            expected_mime = default_mime_map.get(str(payload.get("response_format") or "").lower(), "audio/wav")
            content_type = (response.headers.get("Content-Type") or "").lower()
            if "application/json" in content_type:
                payload_json = response.json()
                audio = _extract_audio_base64_from_tts_json(payload_json)
                if audio:
                    return audio, _guess_audio_mime_from_base64(audio, expected_mime), ""
                last_error = "no_audio_in_json"
                continue
            text_body = (response.text or "").strip()
            if text_body.startswith("data:"):
                merged = []
                for line in response.text.splitlines():
                    if not line.startswith("data:"):
                        continue
                    line_data = line[5:].strip()
                    if not line_data or line_data == "[DONE]":
                        continue
                    try:
                        evt = json.loads(line_data)
                    except Exception:
                        continue
                    chunk = _extract_audio_base64_from_tts_json(evt)
                    if chunk:
                        merged.append(chunk)
                if merged:
                    merged_audio = "".join(merged)
                    return merged_audio, _guess_audio_mime_from_base64(merged_audio, expected_mime), ""
                last_error = "stream_without_audio"
                continue
            encoded = base64.b64encode(response.content).decode("utf-8")
            if encoded:
                return encoded, expected_mime, ""
        except Exception as ex:
            last_error = str(ex)
            continue
    return "", "", last_error

def parse_json_from_text(text):
    candidate = text.strip()
    if "```json" in candidate:
        candidate = candidate.split("```json", 1)[1]
        candidate = candidate.split("```", 1)[0]
    elif "```" in candidate:
        candidate = candidate.split("```", 1)[1]
        candidate = candidate.split("```", 1)[0]
    candidate = candidate.strip()
    if candidate.startswith("{") and candidate.endswith("}"):
        return json.loads(candidate)
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(candidate[start:end + 1])
    raise ValueError("no json object found")

def parse_json_array_from_text(text):
    candidate = str(text or "").strip()
    if "```json" in candidate:
        candidate = candidate.split("```json", 1)[1]
        candidate = candidate.split("```", 1)[0]
    elif "```" in candidate:
        candidate = candidate.split("```", 1)[1]
        candidate = candidate.split("```", 1)[0]
    candidate = candidate.strip()
    if candidate.startswith("[") and candidate.endswith("]"):
        return json.loads(candidate)
    start = candidate.find("[")
    end = candidate.rfind("]")
    if start != -1 and end != -1 and end > start:
        return json.loads(candidate[start:end + 1])
    raise ValueError("no json array found")

def build_ppt_blog_fallback(extracted_text, max_slides):
    normalized = re.sub(r"\s+", " ", str(extracted_text or "")).strip()
    chunks = [segment.strip() for segment in re.split(r"[。！？\n]", normalized) if segment.strip()]
    if not chunks:
        chunks = ["这是一个值得继续追踪的主题，我们先快速抓住核心变化。"]
    title = (chunks[0][:28] + "…") if len(chunks[0]) > 28 else chunks[0]
    slides = []
    fallback_topics = [
        "背景与趋势", "关键观点", "核心机制", "真实案例",
        "常见误区", "实践建议", "风险提醒", "总结与下一步"
    ]
    per_slide = max(1, len(chunks) // max(1, min(max_slides, len(chunks))))
    for idx in range(max_slides):
        start = idx * per_slide
        end = start + per_slide
        segment = chunks[start:end] if idx < max_slides - 1 else chunks[start:]
        if not segment:
            topic = fallback_topics[idx % len(fallback_topics)]
            segment = [f"{topic}：结合公开资料补全关键事实与观点。"]
        points = [item[:46] for item in segment[:5]]
        slide_title = fallback_topics[idx % len(fallback_topics)]
        slides.append({
            "title": f"{slide_title}",
            "points": points,
            "speaker_note": build_vivid_speaker_note(slide_title, points, points[-1] if points else "")
        })
    blog_markdown = "\n\n".join(
        [f"## {i+1}. {item['title']}\n\n" + "\n".join([f"- {p}" for p in item["points"]]) for i, item in enumerate(slides)]
    )
    lesson_units = []
    for i, item in enumerate(slides):
        lesson_units.append({
            "index": i + 1,
            "unit_title": item["title"],
            "learning_goal": "理解本单元关键概念并能复述。",
            "key_takeaway": item["points"][0] if item["points"] else "掌握核心要点",
            "points": item["points"],
            "explanation": "；".join(item["points"]),
            "example": item["points"][-1] if item["points"] else "结合实际场景补充示例",
            "misconception": "避免只记结论不理解原理。",
            "quiz_question": f"请用一句话总结“{item['title']}”的核心内容。",
            "quiz_answer": item["points"][0] if item["points"] else "请结合本页要点作答。",
            "speaker_note": item["speaker_note"]
        })
    return {
        "title": f"{title} - AI解析版",
        "summary": "本内容由降级策略生成，建议继续微调后发布。",
        "lesson_units": lesson_units,
        "slides": slides,
        "blog_markdown": blog_markdown,
        "prerequisites": ["具备基础阅读能力", "愿意按单元逐步学习"],
        "difficulty_curve": "由浅入深",
        "estimated_minutes": max(20, len(lesson_units) * 6)
    }

def normalize_lesson_units(parsed, max_units):
    raw_units = []
    if isinstance(parsed, dict):
        candidate = parsed.get("lesson_units")
        if isinstance(candidate, list):
            raw_units = candidate
        elif isinstance(parsed.get("slides"), list):
            raw_units = parsed.get("slides")
    units = []
    for idx, unit in enumerate(raw_units[:max_units]):
        if not isinstance(unit, dict):
            continue
        title = clean_text_for_display(unit.get("unit_title") or unit.get("title") or f"单元 {idx + 1}", 64)
        title = decorate_with_emoji(title, idx)
        points = unit.get("points")
        if not isinstance(points, list):
            points = []
        clean_points = [clean_text_for_display(item, 88) for item in points if str(item).strip()][:5]
        if not clean_points:
            clean_points = ["核心信息提炼中", "请结合原文补充细节"]
        explanation = clean_text_for_display(unit.get("explanation") or "", 180) or "本单元围绕核心概念展开讲解。"
        example = clean_text_for_display(unit.get("example") or "", 140) or "请结合真实场景补充一个例子。"
        misconception = clean_text_for_display(unit.get("misconception") or "", 120) or "避免只记结论，不理解过程。"
        learning_goal = clean_text_for_display(unit.get("learning_goal") or "", 120) or "完成本单元后可复述核心概念。"
        key_takeaway = clean_text_for_display(unit.get("key_takeaway") or clean_points[0], 80)
        quiz_question = str(unit.get("quiz_question") or f"请解释“{title}”的核心逻辑。").strip()
        quiz_answer = str(unit.get("quiz_answer") or key_takeaway).strip()
        visual_focus = clean_text_for_display(unit.get("visual_focus") or title, 64)
        highlight = clean_text_for_display(unit.get("highlight") or key_takeaway, 64)
        highlight = decorate_with_emoji(highlight, idx + 1)
        key_takeaway = decorate_with_emoji(key_takeaway, idx + 2)
        speaker_note = str(unit.get("speaker_note") or "").strip()
        speaker_note = strip_parenthetical_noise(speaker_note)
        if not speaker_note or len(speaker_note) < 22:
            speaker_note = build_vivid_speaker_note(title, clean_points, example)
        else:
            speaker_note = build_vivid_speaker_note(title, clean_points, speaker_note)
        layout_styles = ["visual-focus", "text-focus", "split-contrast", "card-magazine"]
        theme_styles = ["aurora", "sunset", "forest", "midnight"]
        units.append({
            "index": idx + 1,
            "unit_title": title,
            "learning_goal": learning_goal,
            "key_takeaway": key_takeaway,
            "points": clean_points,
            "explanation": explanation,
            "example": example,
            "misconception": misconception,
            "quiz_question": quiz_question,
            "quiz_answer": quiz_answer,
            "visual_focus": visual_focus,
            "highlight": highlight,
            "speaker_note": speaker_note,
            "layout_style": layout_styles[idx % len(layout_styles)],
            "theme_style": theme_styles[idx % len(theme_styles)]
        })
    return units

def polish_speaker_notes_with_glm5(lesson_units, global_title="", style_hint=""):
    if not isinstance(lesson_units, list) or not lesson_units:
        return lesson_units
    compact_units = []
    for unit in lesson_units:
        if not isinstance(unit, dict):
            continue
        compact_units.append({
            "index": unit.get("index"),
            "unit_title": clean_text_for_display(unit.get("unit_title") or "", 80),
            "key_takeaway": clean_text_for_display(unit.get("key_takeaway") or "", 90),
            "points": [clean_text_for_display(p, 90) for p in (unit.get("points") or [])[:4]],
            "example": clean_text_for_display(unit.get("example") or "", 120),
            "speaker_note": clean_text_for_display(unit.get("speaker_note") or "", 180)
        })
    if not compact_units:
        return lesson_units
    messages = [
        {
            "role": "system",
            "content": (
                "你是播客文案导演。请把输入数组中的speaker_note逐条改写为自然、生动、口语化的短讲稿。"
                "不要教案腔，不要固定课堂模板，不要空泛口号。"
                "每条讲稿120-210字，包含节奏停顿和场景感，可适度提问。"
                "避免冗长括号、避免机械分点朗读。"
                "speaker_note里不要emoji，不要括号说明，不要编号条目。"
                "只输出JSON数组，元素格式：{\"index\":1,\"speaker_note\":\"...\"}。"
            )
        },
        {
            "role": "user",
            "content": json.dumps({
                "title": clean_text_for_display(global_title, 100),
                "style_hint": clean_text_for_display(style_hint, 120),
                "units": compact_units
            }, ensure_ascii=False)
        }
    ]
    try:
        rewritten_text = call_bigmodel_chat_once(messages, "glm-5", temperature=0.65, max_tokens=8192)
        fixed = parse_json_array_from_text(rewritten_text)
        if not isinstance(fixed, list):
            return lesson_units
        note_map = {}
        for item in fixed:
            if not isinstance(item, dict):
                continue
            idx = item.get("index")
            note = clean_text_for_display(item.get("speaker_note") or "", 320)
            if isinstance(idx, int) and note:
                note_map[idx] = note
        if not note_map:
            return lesson_units
        for unit in lesson_units:
            idx = unit.get("index")
            if isinstance(idx, int) and idx in note_map:
                unit["speaker_note"] = note_map[idx]
        return lesson_units
    except Exception:
        return lesson_units

def fallback_blueprint(learning_topic, learning_goal, target_audience, interaction_style):
    base = build_foundation_blueprint(learning_topic, learning_goal, target_audience, interaction_style)
    dynamic_bundle, _ = generate_dynamic_ui_bundle_with_glm5(
        learning_topic, learning_goal, target_audience, interaction_style
    )
    base["ui_bundle"] = dynamic_bundle if isinstance(dynamic_bundle, dict) else build_adaptive_ui_bundle(
        learning_topic, learning_goal, target_audience, interaction_style
    )
    return base

def build_foundation_blueprint(learning_topic, learning_goal, target_audience, interaction_style):
    app_name = sanitize_app_name(learning_topic) or "学习应用"
    return {
        "app_name": app_name,
        "one_liner": f"围绕{learning_topic}打造的可视化交互学习应用",
        "positioning": f"围绕“{learning_goal}”提供任务化学习、即时反馈和复盘闭环。",
        "feature_modules": [
            f"{learning_topic}知识图谱",
            f"{learning_topic}情景交互练习",
            "进度与能力看板",
            "错因分析与复训",
            "AI 个性化辅导"
        ],
        "learning_flow": [
            "识别当前水平与学习目标",
            "生成主题化交互任务",
            "完成可视化演练并即时纠错",
            "阶段复盘与下一轮强化"
        ],
        "data_schema": [
            "topic_profile",
            "interaction_session",
            "exercise_record",
            "error_pattern",
            "review_snapshot"
        ],
        "evaluation_metrics": ["学习时长", "任务完成率", "正确率提升", "复习覆盖率"],
        "safety_rules": ["不输出违规内容", "不暴露密钥信息", "敏感数据最小化存储"],
        "ui_layout": ["目标设置区", "学习任务区", "练习反馈区", "错题与复盘区"],
        "growth_plan": ["支持班级协作", "支持导师点评", "支持应用模板市场"],
        "interaction_style": interaction_style
    }

def is_bubble_sort_topic(learning_topic):
    topic = (learning_topic or "").lower()
    keys = ["冒泡", "bubble sort", "bubblesort", "排序可视化", "sort visualizer", "sorting"]
    return any(key in topic for key in keys)

def is_red_black_tree_topic(learning_topic):
    topic = (learning_topic or "").lower()
    keys = ["红黑树", "red-black tree", "red black tree", "rbtree", "rbtree"]
    return any(key in topic for key in keys)

def is_vocabulary_topic(learning_topic):
    topic = (learning_topic or "").lower()
    keys = ["背单词", "单词", "词汇", "vocabulary", "word", "words", "英语词汇", "雅思词汇", "托福词汇"]
    return any(key in topic for key in keys)

def sanitize_app_name(raw_name):
    name = (raw_name or "").strip() or "学习应用"
    for suffix in ["学习加速器", "AI学习应用", "智能学习应用", "学习应用"]:
        if name.endswith(suffix):
            name = name[: -len(suffix)].strip(" -_·")
    return name or "学习应用"

def build_adaptive_ui_bundle(learning_topic, learning_goal, target_audience, interaction_style):
    safe_topic = (learning_topic or "通用主题").replace("'", "\\'")
    shell = sum(ord(ch) for ch in f"{learning_topic}{interaction_style}") % 3
    labels = [["概念节点", "路径节点", "误区节点"], ["任务卡", "案例卡", "复盘卡"], ["变量块", "流程块", "结果块"]][shell]
    board_class = ["node", "card", "unit"][shell]
    return {
        "html": f"<div class='adaptive-lab v{shell}'><header><h2>🧩 {sanitize_app_name(learning_topic)}</h2><p>{learning_goal}</p><small>面向：{target_audience} · 风格：{interaction_style}</small></header><section class='toolbar'><input id='ideaInput' placeholder='输入你要探索的问题'><button id='addNodeBtn'>添加{labels[0]}</button><button id='simulateBtn'>运行演练</button><button id='shuffleBtn'>切换路径</button><button id='askAiBtn'>AI解释状态</button></section><section id='canvas' class='canvas {board_class}'></section><section class='panel'><input id='progressRange' type='range' min='1' max='8' value='1'><div id='statusText' class='status'></div><textarea id='userInput' placeholder='输入你的具体疑问'></textarea><div class='actions'><button id='coachBtn'>AI教练</button><button id='practiceBtn'>生成练习</button><button id='explainBtn'>深入讲解</button></div></section><div id='aiOutput' class='out'>应用已就绪，开始构建你的主题工作台。</div></div>",
        "css": ".adaptive-lab{font-family:Inter,'Microsoft YaHei',sans-serif;padding:14px;border-radius:16px;color:#0f172a;background:linear-gradient(135deg,#eef2ff,#ecfeff)}.adaptive-lab.v1{background:linear-gradient(135deg,#fff7ed,#eef2ff)}.adaptive-lab.v2{background:linear-gradient(135deg,#ecfeff,#f5f3ff)}.adaptive-lab header h2{margin:0 0 6px;color:#1e1b4b}.adaptive-lab header p{margin:0 0 4px;color:#334155}.adaptive-lab header small{color:#64748b}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.toolbar input{flex:1;min-width:190px;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px}.toolbar button,.actions button{border:none;border-radius:10px;background:#4338ca;color:#fff;padding:8px 10px;cursor:pointer;font-weight:700}.canvas{margin-top:12px;min-height:170px;border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}.node .item{border-radius:999px}.card .item{border-radius:12px}.unit .item{border-radius:6px}.item{padding:8px 10px;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;font-size:.84rem;font-weight:700}.panel{margin-top:12px;background:#ffffffcc;border:1px solid #cbd5e1;border-radius:12px;padding:10px}.panel textarea{margin-top:10px;width:100%;min-height:84px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#fff}.status{margin-top:8px;color:#1e3a8a;font-size:.9rem;font-weight:700}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.out{margin-top:10px;padding:10px;border-radius:10px;background:#fff;border:1px solid #bfdbfe;white-space:pre-wrap;line-height:1.6;min-height:66px}",
        "js": "const topicTitle='" + safe_topic + "';const baseNodes=" + json.dumps(labels, ensure_ascii=False) + ";const nodes=[...baseNodes];const stageTips=['理解问题','拆解结构','模拟验证','总结迁移'];const canvas=document.getElementById('canvas');const statusText=document.getElementById('statusText');const aiOutput=document.getElementById('aiOutput');function renderNodes(){canvas.innerHTML='';nodes.forEach(name=>{const item=document.createElement('div');item.className='item';item.textContent=name;canvas.appendChild(item);});}function updateStatus(){const idx=Math.max(1,Number(document.getElementById('progressRange').value||1));statusText.textContent='当前阶段：'+(stageTips[(idx-1)%stageTips.length]||stageTips[0]);}function shuffleNodes(){for(let i=nodes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nodes[i],nodes[j]]=[nodes[j],nodes[i]];}renderNodes();aiOutput.textContent='结构已刷新，尝试新的理解路径。';}function addNode(){const val=(document.getElementById('ideaInput').value||'').trim();if(!val){aiOutput.textContent='请先输入内容';return;}nodes.push(val);document.getElementById('ideaInput').value='';renderNodes();aiOutput.textContent='已添加：'+val;}function runSimulation(){updateStatus();aiOutput.textContent='正在模拟“'+topicTitle+'”的关键过程。';}async function runAction(action,seed){const userInput=(document.getElementById('userInput').value||'').trim();const prompt=(userInput||seed)+'\\n\\n主题：'+topicTitle+'\\n当前结构：'+nodes.join('、');aiOutput.textContent='AI处理中...';try{const ans=await window.requestAppAI(action,prompt);aiOutput.textContent=ans;}catch(e){aiOutput.textContent=e.message||'调用失败';}}document.getElementById('addNodeBtn').onclick=addNode;document.getElementById('simulateBtn').onclick=runSimulation;document.getElementById('shuffleBtn').onclick=shuffleNodes;document.getElementById('askAiBtn').onclick=()=>runAction('explain','请解释当前结构并给下一步建议');document.getElementById('coachBtn').onclick=()=>runAction('coach','请给我学习推进策略');document.getElementById('practiceBtn').onclick=()=>runAction('practice','请生成分层练习');document.getElementById('explainBtn').onclick=()=>runAction('explain','请深入讲解关键机制');document.getElementById('progressRange').oninput=updateStatus;renderNodes();updateStatus();"
    }

def build_topic_ui_bundle(learning_topic, learning_goal, target_audience, interaction_style):
    if is_bubble_sort_topic(learning_topic):
        return {
            "html": f"<div class='sort-app'><header><h2>🫧 {learning_topic}</h2><p>{learning_goal}</p></header><section class='panel'><label>数组长度 <input id='sizeInput' type='range' min='6' max='40' value='20'></label><label>速度(ms) <input id='speedInput' type='range' min='30' max='400' value='120'></label><div class='btns'><button id='randomBtn'>随机数组</button><button id='stepBtn'>单步执行</button><button id='playBtn'>自动播放</button><button id='resetBtn'>重置</button><button id='askBtn'>AI解释当前步骤</button></div></section><div id='bars' class='bars'></div><div id='status' class='status'>准备开始</div><div id='aiOutput' class='ai-output'>AI说明会显示在这里</div></div>",
            "css": ".sort-app{font-family:Inter,'Microsoft YaHei',sans-serif;padding:14px;border-radius:16px;background:linear-gradient(135deg,#ecfeff,#eef2ff);color:#0f172a} header h2{margin:0 0 6px;color:#1e3a8a} header p{margin:0 0 12px;color:#334155} .panel{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#ffffffcc;padding:10px;border-radius:12px;border:1px solid #cbd5e1} .btns{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap} button{border:none;border-radius:9px;background:#2563eb;color:#fff;padding:8px 10px;cursor:pointer;font-weight:700} #bars{height:280px;display:flex;align-items:flex-end;gap:4px;background:#ffffffd9;border:1px solid #cbd5e1;border-radius:12px;margin-top:12px;padding:10px;overflow:hidden} .bar{flex:1;background:linear-gradient(180deg,#60a5fa,#2563eb);border-radius:4px 4px 0 0;transition:height .15s ease, background .15s ease} .bar.active{background:linear-gradient(180deg,#f59e0b,#ea580c)} .bar.sorted{background:linear-gradient(180deg,#34d399,#059669)} .status{margin-top:10px;font-size:.88rem;color:#1e3a8a;font-weight:700} .ai-output{margin-top:10px;padding:10px;border-radius:10px;background:#fff;border:1px solid #bfdbfe;white-space:pre-wrap;line-height:1.6;min-height:68px}",
            "js": "let arr=[];let i=0,j=0;let running=false;let timer=null;const barsEl=document.getElementById('bars');const statusEl=document.getElementById('status');const aiOut=document.getElementById('aiOutput');function randomArray(){const size=Number(document.getElementById('sizeInput').value||20);arr=Array.from({length:size},()=>Math.floor(Math.random()*90)+10);i=0;j=0;render();statusEl.textContent='已生成随机数组';}function render(active=[]){barsEl.innerHTML='';arr.forEach((v,idx)=>{const bar=document.createElement('div');bar.className='bar';bar.style.height=`${v*2.2}px`;if(active.includes(idx))bar.classList.add('active');if(i>=arr.length-1-idx)bar.classList.add('sorted');barsEl.appendChild(bar);});}function bubbleStep(){if(arr.length<2){statusEl.textContent='数组太短';return true;}if(i>=arr.length-1){statusEl.textContent='排序完成';render();return true;}const a=j,b=j+1;if(arr[a]>arr[b]){[arr[a],arr[b]]=[arr[b],arr[a]];statusEl.textContent=`交换下标 ${a} 和 ${b}`;}else{statusEl.textContent=`比较下标 ${a} 和 ${b}，无需交换`;}j++;if(j>=arr.length-1-i){j=0;i++;}render([a,b]);return i>=arr.length-1;}function stopPlay(){running=false;if(timer){clearInterval(timer);timer=null;}document.getElementById('playBtn').textContent='自动播放';}function play(){if(running){stopPlay();return;}running=true;document.getElementById('playBtn').textContent='暂停';const speed=Number(document.getElementById('speedInput').value||120);timer=setInterval(()=>{const done=bubbleStep();if(done)stopPlay();},speed);}async function askAI(){const prompt=`当前数组：${arr.join(',')}；当前外层轮次i=${i}，内层位置j=${j}。请解释这一步在冒泡排序中的意义，并给学习建议。`;aiOut.textContent='AI解释中...';try{const ans=await window.requestAppAI('explain',prompt);aiOut.textContent=ans;}catch(e){aiOut.textContent=e.message||'调用失败';}}document.getElementById('randomBtn').onclick=randomArray;document.getElementById('stepBtn').onclick=()=>bubbleStep();document.getElementById('playBtn').onclick=play;document.getElementById('resetBtn').onclick=()=>{stopPlay();randomArray();};document.getElementById('askBtn').onclick=askAI;document.getElementById('sizeInput').onchange=()=>{stopPlay();randomArray();};document.getElementById('speedInput').onchange=()=>{if(running){stopPlay();play();}};randomArray();"
        }
    if is_red_black_tree_topic(learning_topic):
        return {
            "html": "<div class='rbt-app'><header><h2>🌳 红黑树可视化实验室</h2><p>插入节点并观察颜色翻转与旋转修复过程</p></header><section class='ctrl'><input id='nodeInput' type='number' placeholder='输入整数节点'><button id='insertBtn'>插入节点</button><button id='randomTreeBtn'>随机生成</button><button id='resetTreeBtn'>清空</button><button id='askTreeBtn'>AI解释当前树</button></section><div id='treeBoard' class='tree-board'></div><div id='treeStatus' class='tree-status'>当前无节点</div><div id='aiOutput' class='ai-output'>AI解释会显示在这里</div></div>",
            "css": ".rbt-app{font-family:Inter,'Microsoft YaHei',sans-serif;padding:14px;border-radius:16px;background:linear-gradient(135deg,#f5f3ff,#ecfeff)} .rbt-app h2{margin:0 0 6px;color:#4c1d95} .rbt-app p{margin:0 0 12px;color:#475569} .ctrl{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px} .ctrl input{border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px} .ctrl button{border:none;border-radius:8px;padding:8px 10px;background:#7c3aed;color:#fff;font-weight:700;cursor:pointer} .tree-board{min-height:340px;border:1px solid #ddd6fe;border-radius:12px;background:#fff;padding:10px;overflow:auto} .tree-row{display:flex;justify-content:center;gap:12px;margin:8px 0} .node{width:40px;height:40px;border-radius:999px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:0.85rem} .node.red{background:#dc2626} .node.black{background:#111827} .tree-status{margin-top:10px;color:#4c1d95;font-weight:700} .ai-output{margin-top:10px;padding:10px;border-radius:10px;background:#fff;border:1px solid #ddd6fe;white-space:pre-wrap;line-height:1.6;min-height:68px}",
            "js": "const nodes=[];const board=document.getElementById('treeBoard');const statusEl=document.getElementById('treeStatus');const aiOut=document.getElementById('aiOutput');function colorFor(index){if(index===0)return 'black';if(index%3===0)return 'black';return 'red';}function render(){board.innerHTML='';if(!nodes.length){statusEl.textContent='当前无节点';return;}let level=0;let start=0;while(start<nodes.length){const count=Math.pow(2,level);const row=nodes.slice(start,start+count);const rowEl=document.createElement('div');rowEl.className='tree-row';row.forEach((v,idx)=>{const n=document.createElement('div');n.className=`node ${colorFor(start+idx)}`;n.textContent=v;rowEl.appendChild(n);});board.appendChild(rowEl);start+=count;level++;}statusEl.textContent=`节点数 ${nodes.length}，根节点为黑色`; }function insertNode(){const input=document.getElementById('nodeInput');const v=Number(input.value);if(Number.isNaN(v)){statusEl.textContent='请输入有效数字';return;}if(nodes.includes(v)){statusEl.textContent='节点已存在';return;}nodes.push(v);nodes.sort((a,b)=>a-b);input.value='';render();}function randomTree(){nodes.length=0;const size=8+Math.floor(Math.random()*6);const set=new Set();while(set.size<size){set.add(Math.floor(Math.random()*90)+10);}set.forEach(v=>nodes.push(v));nodes.sort((a,b)=>a-b);render();}function resetTree(){nodes.length=0;render();}async function askTree(){const prompt=`当前红黑树节点集合：${nodes.join(',')}。请解释颜色分布、近似平衡性、并给下一步插入建议。`;aiOut.textContent='AI解释中...';try{const ans=await window.requestAppAI('explain',prompt);aiOut.textContent=ans;}catch(e){aiOut.textContent=e.message||'调用失败';}}document.getElementById('insertBtn').onclick=insertNode;document.getElementById('randomTreeBtn').onclick=randomTree;document.getElementById('resetTreeBtn').onclick=resetTree;document.getElementById('askTreeBtn').onclick=askTree;render();"
        }
    if is_vocabulary_topic(learning_topic):
        return {
            "html": f"<div class='vocab-app'><header><h2>📚 {sanitize_app_name(learning_topic)}</h2><p>{learning_goal}</p><small>面向：{target_audience} · 风格：{interaction_style}</small></header><section class='tool'><textarea id='wordInput' placeholder='输入词库，每行一个：word | 中文释义'></textarea><div class='btns'><button id='loadWordsBtn'>加载词库</button><button id='nextCardBtn'>下一词</button><button id='revealBtn'>显示释义</button><button id='knowBtn'>记住了</button><button id='againBtn'>再复习</button><button id='askMnemonicBtn'>AI记忆法</button></div></section><section class='card-wrap'><div id='wordCard' class='word-card'>点击“加载词库”开始</div><div id='meaningCard' class='meaning-card'>释义区域</div></section><section class='stats'><div class='stat'><span>总词数</span><strong id='totalCount'>0</strong></div><div class='stat'><span>已掌握</span><strong id='masteredCount'>0</strong></div><div class='stat'><span>待复习</span><strong id='reviewCount'>0</strong></div><div class='stat'><span>正确率</span><strong id='accuracy'>0%</strong></div></section><div id='aiOutput' class='ai-output'>你可以随时让 AI 生成联想记忆法。</div></div>",
            "css": ".vocab-app{font-family:Inter,'Microsoft YaHei',sans-serif;padding:14px;border-radius:16px;background:linear-gradient(135deg,#eff6ff,#ecfeff);color:#0f172a}.vocab-app h2{margin:0 0 6px;color:#1e3a8a}.vocab-app p{margin:0 0 4px;color:#334155}.vocab-app small{color:#64748b}.tool{margin-top:12px}.tool textarea{width:100%;min-height:92px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#fff}.btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.btns button{border:none;border-radius:9px;background:#2563eb;color:#fff;padding:8px 10px;cursor:pointer;font-weight:700}.card-wrap{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.word-card,.meaning-card{min-height:120px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:1.1rem;font-weight:700}.meaning-card{font-size:1rem;font-weight:600;color:#0f766e}.stats{margin-top:12px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.stat{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:4px}.stat span{font-size:.78rem;color:#64748b}.stat strong{font-size:1.12rem;color:#1e3a8a}.ai-output{margin-top:10px;padding:10px;border-radius:10px;background:#fff;border:1px solid #bfdbfe;white-space:pre-wrap;line-height:1.6;min-height:64px}",
            "js": "let words=[];let queue=[];let current=null;let revealed=false;let mastered=0;let reviewed=0;let correct=0;const input=document.getElementById('wordInput');const wordCard=document.getElementById('wordCard');const meaningCard=document.getElementById('meaningCard');const aiOut=document.getElementById('aiOutput');function parseWords(text){return (text||'').split(/\\n+/).map(line=>line.trim()).filter(Boolean).map(line=>{const parts=line.split('|');return {word:(parts[0]||'').trim(),meaning:(parts[1]||'').trim()||'（未提供释义）'};}).filter(item=>item.word);}function updateStats(){document.getElementById('totalCount').textContent=String(words.length);document.getElementById('masteredCount').textContent=String(mastered);document.getElementById('reviewCount').textContent=String(Math.max(0,queue.length));document.getElementById('accuracy').textContent=reviewed?Math.round(correct/reviewed*100)+'%':'0%';}function showCurrent(){if(!current){wordCard.textContent='暂无单词';meaningCard.textContent='释义区域';return;}wordCard.textContent=current.word;meaningCard.textContent=revealed?current.meaning:'点击“显示释义”查看';}function nextCard(){if(!queue.length){current=null;showCurrent();aiOut.textContent='已完成本轮词汇。可以继续添加词库。';updateStats();return;}current=queue.shift();revealed=false;showCurrent();updateStats();}async function askMnemonic(){if(!current){aiOut.textContent='请先选择一个单词';return;}const prompt='请为单词“'+current.word+'”生成记忆法，并结合释义“'+current.meaning+'”给1个例句。';aiOut.textContent='AI生成中...';try{const ans=await window.requestAppAI('explain',prompt);aiOut.textContent=ans;}catch(e){aiOut.textContent=e.message||'调用失败';}}document.getElementById('loadWordsBtn').onclick=()=>{words=parseWords(input.value);queue=[...words];mastered=0;reviewed=0;correct=0;nextCard();aiOut.textContent=words.length?'词库加载完成，开始背词。':'未识别到有效词条';};document.getElementById('nextCardBtn').onclick=nextCard;document.getElementById('revealBtn').onclick=()=>{revealed=true;showCurrent();};document.getElementById('knowBtn').onclick=()=>{if(!current)return;reviewed++;correct++;mastered++;nextCard();};document.getElementById('againBtn').onclick=()=>{if(!current)return;reviewed++;queue.push(current);nextCard();};document.getElementById('askMnemonicBtn').onclick=askMnemonic;updateStats();"
        }
    safe_topic = (learning_topic or "通用主题").replace("'", "\\'")
    return {
        "html": f"<div class='topic-lab'><header><h2>🧪 {learning_topic} 交互实验室</h2><p>学习目标：{learning_goal}</p><small>面向：{target_audience} · 风格：{interaction_style}</small></header><section class='lab-controls'><input id='conceptInput' placeholder='输入关键概念'><button id='addConceptBtn'>加入概念图</button><button id='shuffleBtn'>重排结构</button><button id='askCoachBtn'>AI讲解结构</button></section><div id='conceptCanvas' class='concept-canvas'></div><section class='practice-zone'><h3>情景推演</h3><div class='stepper'><button id='prevStepBtn'>上一步</button><input id='stepRange' type='range' min='1' max='6' value='1'><button id='nextStepBtn'>下一步</button></div><div id='stepText' class='step-text'></div><textarea id='userInput' placeholder='输入你想深入提问的点'></textarea><div class='btn-row'><button id='coachBtn'>AI教练答疑</button><button id='practiceBtn'>生成练习</button><button id='explainBtn'>AI讲解</button></div></section><div id='aiOutput' class='out'>准备就绪，先添加概念开始探索。</div></div>",
        "css": ".topic-lab{font-family:Inter,'Microsoft YaHei',sans-serif;padding:16px;border-radius:16px;background:linear-gradient(135deg,#eef2ff,#ecfeff);color:#0f172a}.topic-lab header h2{margin:0 0 8px;color:#1e1b4b}.topic-lab header p{margin:0 0 4px;color:#334155}.topic-lab header small{color:#64748b}.lab-controls{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}.lab-controls input{flex:1;min-width:180px;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px}.lab-controls button,.btn-row button,.stepper button{border:none;border-radius:10px;padding:9px 12px;background:#4338ca;color:#fff;cursor:pointer;font-weight:700}.concept-canvas{margin-top:12px;min-height:190px;border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start}.concept-node{padding:8px 12px;border-radius:999px;background:linear-gradient(135deg,#6366f1,#14b8a6);color:#fff;font-size:.86rem;font-weight:700;cursor:pointer;user-select:none;transition:transform .15s ease}.concept-node.active{transform:scale(1.08)}.practice-zone{margin-top:14px;padding:12px;border:1px solid #cbd5e1;border-radius:12px;background:#ffffffcc}.practice-zone h3{margin:0 0 8px;color:#1e1b4b}.stepper{display:flex;align-items:center;gap:8px}.stepper input{flex:1}.step-text{margin-top:10px;font-size:.9rem;line-height:1.6;color:#334155;min-height:46px}.practice-zone textarea{width:100%;min-height:82px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#fff;margin-top:10px}.btn-row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.out{margin-top:12px;padding:10px;border-radius:10px;background:#fff;border:1px solid #dbeafe;color:#1e293b;min-height:72px;white-space:pre-wrap;line-height:1.6}",
        "js": "const topicTitle='" + safe_topic + "';const concepts=['核心概念','关键机制','常见误区'];const stepTexts=['建立'+topicTitle+'直觉模型','识别'+topicTitle+'关键组成','理解输入输出关系','用示例走通完整流程','定位常见错误与修正','总结迁移场景与实战方法'];const conceptCanvas=document.getElementById('conceptCanvas');const conceptInput=document.getElementById('conceptInput');const stepRange=document.getElementById('stepRange');const stepText=document.getElementById('stepText');const aiOutput=document.getElementById('aiOutput');function renderConcepts(active){if(active===undefined)active=-1;conceptCanvas.innerHTML='';concepts.forEach((name,idx)=>{const node=document.createElement('button');node.className='concept-node'+(idx===active?' active':'');node.textContent=name;node.onclick=()=>{renderConcepts(idx);aiOutput.textContent='已聚焦概念：'+name+'。可点击“AI讲解结构”。';};conceptCanvas.appendChild(node);});}function updateStep(){const idx=Math.max(1,Number(stepRange.value||1));stepText.textContent='第'+idx+'步：'+(stepTexts[idx-1]||stepTexts[0]);}function shuffleConcepts(){for(let i=concepts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[concepts[i],concepts[j]]=[concepts[j],concepts[i]];}renderConcepts();aiOutput.textContent='概念结构已重排，尝试对比不同学习顺序。';}async function runAction(action,seed){const userInput=(document.getElementById('userInput').value||'').trim();const currentStep=stepRange.value||'1';const context='主题：'+topicTitle+'\\n概念图：'+concepts.join('、')+'\\n当前步骤：'+currentStep;const prompt=(userInput||seed)+'\\n\\n请结合以下上下文回答：\\n'+context;aiOutput.textContent='AI处理中...';try{const ans=await window.requestAppAI(action,prompt);aiOutput.textContent=ans;}catch(e){aiOutput.textContent=e.message||'调用失败';}}document.getElementById('addConceptBtn').onclick=()=>{const value=(conceptInput.value||'').trim();if(!value){aiOutput.textContent='请先输入概念';return;}if(!concepts.includes(value))concepts.push(value);conceptInput.value='';renderConcepts();aiOutput.textContent='已加入概念：'+value;};document.getElementById('shuffleBtn').onclick=shuffleConcepts;document.getElementById('askCoachBtn').onclick=()=>runAction('explain','请解释当前概念图中各节点关系并给学习顺序建议');document.getElementById('prevStepBtn').onclick=()=>{stepRange.value=Math.max(1,Number(stepRange.value)-1);updateStep();};document.getElementById('nextStepBtn').onclick=()=>{stepRange.value=Math.min(6,Number(stepRange.value)+1);updateStep();};stepRange.oninput=updateStep;document.getElementById('coachBtn').onclick=()=>runAction('coach','请按当前步骤给我一个可执行学习计划');document.getElementById('practiceBtn').onclick=()=>runAction('practice','请基于当前概念图生成3道进阶练习');document.getElementById('explainBtn').onclick=()=>runAction('explain','请用例子解释当前步骤');renderConcepts();updateStep();"
    }

def is_sorting_bundle(ui_bundle):
    if not isinstance(ui_bundle, dict):
        return False
    html = (ui_bundle.get("html") or "").lower()
    js = (ui_bundle.get("js") or "").lower()
    return "bar" in html and ("bubble" in js or "sort" in js)

def is_red_black_bundle(ui_bundle):
    if not isinstance(ui_bundle, dict):
        return False
    html = (ui_bundle.get("html") or "").lower()
    js = (ui_bundle.get("js") or "").lower()
    return ("tree" in html or "node" in html) and ("red" in js and "black" in js)

def is_generic_bundle(ui_bundle):
    if not isinstance(ui_bundle, dict):
        return True
    html = (ui_bundle.get("html") or "").lower()
    js = (ui_bundle.get("js") or "").lower()
    css = (ui_bundle.get("css") or "").lower()
    if not all(isinstance(ui_bundle.get(key), str) and ui_bundle.get(key).strip() for key in ["html", "css", "js"]):
        return True
    if "window.requestappai" not in js:
        return True
    controls = len(re.findall(r"<button|<input|<select|<textarea", html))
    visual_hits = len(re.findall(r"canvas|svg|chart|graph|node|timeline|board|matrix|network|map", html + " " + js + " " + css))
    if controls < 4:
        return True
    if visual_hits < 2:
        return True
    return False

def is_vocab_bundle(ui_bundle):
    if not isinstance(ui_bundle, dict):
        return False
    html = (ui_bundle.get("html") or "").lower()
    js = (ui_bundle.get("js") or "").lower()
    keys = ["wordinput", "loadwordsbtn", "记忆法", "单词", "vocab", "wordcard", "meaning"]
    return any(key in html or key in js for key in keys)

def generate_dynamic_ui_bundle_with_glm5(learning_topic, learning_goal, target_audience, interaction_style):
    style_seed = sum(ord(ch) for ch in f"{learning_topic}{target_audience}{interaction_style}") % 9973
    system_prompt = (
        "你是资深前端交互设计师。你要先根据主题自主决策应用交互形态，再输出可运行代码。"
        "你只能输出JSON对象，不要解释。"
        "JSON字段必须包含：html, css, js。"
        "要求："
        "1) 不允许套固定模板，不允许复用统一外壳文案。"
        "2) 先自行确定最合适的交互范式（模拟器/卡片系统/流程沙盘/图谱/实验台等）。"
        "3) 必须有可视化区域与动态状态变化。"
        "4) 至少4个可操作控件。"
        "5) 必须支持调用 window.requestAppAI(action, input)。"
        "6) 不允许外链脚本与<script>标签。"
    )
    user_prompt = (
        f"学习主题：{learning_topic}\n"
        f"学习目标：{learning_goal}\n"
        f"目标人群：{target_audience}\n"
        f"交互风格：{interaction_style}\n"
        f"风格随机种子：{style_seed}\n"
        "请输出一个主题自适应、强交互、可视化、可运行的学习应用UI JSON。"
        "总代码尽量精简，html+css+js总长度控制在5000字符以内。"
    )
    headers = ai_service.get_headers()
    for model in ["glm-5", "glm-4-plus"]:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False,
            "temperature": 0.6,
            "response_format": {"type": "json_object"}
        }
        try:
            response = requests.post(ai_service.chat_url, headers=headers, json=payload, timeout=90)
            if response.status_code != 200:
                continue
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            bundle = parse_json_from_text(content)
            if isinstance(bundle, dict) and isinstance(bundle.get("ui_bundle"), dict):
                bundle = bundle.get("ui_bundle")
            if not isinstance(bundle, dict):
                continue
            html = bundle.get("html")
            css = bundle.get("css")
            js = bundle.get("js")
            candidate = {"html": html, "css": css, "js": js}
            if all(isinstance(item, str) and item.strip() for item in [html, css, js]) and not is_generic_bundle(candidate):
                return {"html": html, "css": css, "js": js}, model
        except Exception:
            continue
    return None, "fallback"

def generate_tuned_ui_bundle(app_title, learning_topic, instruction, current_bundle):
    current_html = str((current_bundle or {}).get("html") or "")[:6000]
    current_css = str((current_bundle or {}).get("css") or "")[:6000]
    current_js = str((current_bundle or {}).get("js") or "")[:6000]
    system_prompt = (
        "你是资深前端交互工程师。请根据用户微调要求，修改现有应用UI。"
        "只输出JSON对象，字段必须包含html, css, js。"
        "必须保留 window.requestAppAI(action, input) 调用能力。"
        "不允许输出解释文字，不允许<script>标签，不允许外链资源。"
    )
    user_prompt = (
        f"应用名称：{app_title}\n"
        f"学习主题：{learning_topic}\n"
        f"微调要求：{instruction}\n"
        "以下是当前代码，请在此基础上做针对性修改：\n"
        f"[HTML]\n{current_html}\n"
        f"[CSS]\n{current_css}\n"
        f"[JS]\n{current_js}\n"
        "请输出修改后的完整html/css/js JSON。"
    )
    headers = ai_service.get_headers()
    for model in ["glm-5", "glm-4-plus"]:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False,
            "temperature": 0.5,
            "response_format": {"type": "json_object"}
        }
        try:
            response = requests.post(ai_service.chat_url, headers=headers, json=payload, timeout=90)
            if response.status_code != 200:
                continue
            content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
            data = parse_json_from_text(content)
            if isinstance(data, dict) and isinstance(data.get("ui_bundle"), dict):
                data = data.get("ui_bundle")
            if not isinstance(data, dict):
                continue
            html = data.get("html")
            css = data.get("css")
            js = data.get("js")
            if all(isinstance(x, str) and x.strip() for x in [html, css, js]):
                bundle = {"html": html, "css": css, "js": js}
                if not is_generic_bundle(bundle):
                    return bundle, model
        except Exception:
            continue
    return None, "fallback"

def repair_blueprint_from_text(raw_text):
    repair_prompt = (
        "请把以下内容修复为合法JSON对象。"
        "字段必须包含：app_name, one_liner, positioning, feature_modules, learning_flow, data_schema, "
        "evaluation_metrics, safety_rules, ui_layout, growth_plan。"
        "只输出JSON对象。"
    )
    payload = {
        "model": "glm-4-plus",
        "messages": [
            {"role": "system", "content": repair_prompt},
            {"role": "user", "content": raw_text or ""}
        ],
        "stream": False,
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    try:
        response = requests.post(ai_service.chat_url, headers=ai_service.get_headers(), json=payload, timeout=40)
        if response.status_code != 200:
            return None
        content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        data = parse_json_from_text(content)
        return data if isinstance(data, dict) else None
    except Exception:
        return None

def generate_app_blueprint_with_glm5(learning_topic, learning_goal, target_audience, interaction_style, duration_weeks):
    system_prompt = (
        "你是教育AI产品架构师。请根据用户需求输出一个学习类AI应用蓝图。"
        "你只能输出JSON对象，不要输出解释文字。"
        "JSON字段必须包含：app_name, one_liner, positioning, feature_modules, learning_flow, data_schema, "
        "evaluation_metrics, safety_rules, ui_layout, growth_plan。"
        "不要输出ui_bundle。字段内容必须紧扣学习主题，不要空泛。"
    )
    user_prompt = (
        f"学习主题：{learning_topic}\n"
        f"学习目标：{learning_goal}\n"
        f"目标人群：{target_audience}\n"
        f"交互风格：{interaction_style}\n"
        "请输出可直接落地的教育应用蓝图JSON。"
    )
    payload = {
        "model": "glm-5",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "temperature": 0.5,
        "response_format": {"type": "json_object"}
    }
    headers = ai_service.get_headers()
    try:
        response = None
        try:
            response = requests.post(ai_service.chat_url, headers=headers, json=payload, timeout=70)
        except Exception:
            response = None
        if response is None or response.status_code != 200:
            payload["model"] = "glm-4-plus"
            try:
                response = requests.post(ai_service.chat_url, headers=headers, json=payload, timeout=70)
            except Exception:
                response = None
        base = build_foundation_blueprint(learning_topic, learning_goal, target_audience, interaction_style)
        if response is not None and response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            try:
                blueprint = parse_json_from_text(content)
            except Exception:
                blueprint = {}
            if not isinstance(blueprint, dict):
                repaired = repair_blueprint_from_text(content)
                blueprint = repaired if isinstance(repaired, dict) else {}
            for key in ["app_name", "one_liner", "positioning", "feature_modules", "learning_flow", "data_schema", "evaluation_metrics", "safety_rules", "ui_layout", "growth_plan"]:
                value = blueprint.get(key)
                if value:
                    base[key] = value
        generated_bundle, bundle_model = generate_dynamic_ui_bundle_with_glm5(
            learning_topic, learning_goal, target_audience, interaction_style
        )
        base["ui_bundle"] = generated_bundle if isinstance(generated_bundle, dict) else build_adaptive_ui_bundle(
            learning_topic, learning_goal, target_audience, interaction_style
        )
        return base, f"{payload['model']}+{bundle_model}"
    except Exception:
        return fallback_blueprint(learning_topic, learning_goal, target_audience, interaction_style), "fallback"

def build_runtime_config(blueprint, learning_topic, learning_goal, target_audience, interaction_style, duration_weeks):
    seed = sum(ord(ch) for ch in f"{learning_topic}{target_audience}{interaction_style}")
    themes = ["indigo", "teal", "rose", "violet", "sky"]
    module_pool = [item for item in (blueprint.get("feature_modules") or []) if isinstance(item, str)]
    flow_pool = [item for item in (blueprint.get("learning_flow") or []) if isinstance(item, str)]
    tasks = []
    for idx, title in enumerate(flow_pool[:6], start=1):
        tasks.append({
            "id": idx,
            "title": title,
            "minutes": 20 + idx * 5,
            "done": False
        })
    if not tasks:
        tasks = [
            {"id": 1, "title": "完成基础概念诊断", "minutes": 25, "done": False},
            {"id": 2, "title": "完成核心题型练习", "minutes": 35, "done": False},
            {"id": 3, "title": "完成复盘与错题整理", "minutes": 30, "done": False}
        ]
    quiz_bank = []
    for idx in range(3):
        feature = module_pool[idx % len(module_pool)] if module_pool else f"{learning_topic}核心点{idx + 1}"
        quiz_bank.append({
            "id": idx + 1,
            "question": f"请说明“{feature}”在{learning_topic}学习中的作用。",
            "reference": f"围绕“{learning_goal}”说明定义、步骤与常见误区。"
        })
    return {
        "theme": themes[seed % len(themes)],
        "persona": f"{learning_topic}专属AI教练",
        "duration_weeks": duration_weeks,
        "target_audience": target_audience,
        "interaction_style": interaction_style,
        "module_pool": module_pool[:8],
        "tasks": tasks,
        "quiz_bank": quiz_bank,
        "ai_actions": [
            {"key": "coach", "label": "AI教练答疑"},
            {"key": "explain", "label": "AI讲解知识点"},
            {"key": "practice", "label": "AI出练习题"}
        ]
    }

def ensure_blueprint_runtime(blueprint, learning_topic, learning_goal, target_audience, interaction_style, duration_weeks, generation_model="", enable_heavy_regen=True):
    result = blueprint if isinstance(blueprint, dict) else {}
    runtime_config = result.get("runtime_config")
    if not isinstance(runtime_config, dict):
        result["runtime_config"] = build_runtime_config(
            result,
            learning_topic,
            learning_goal,
            target_audience,
            interaction_style,
            duration_weeks
        )
    ui_bundle = result.get("ui_bundle")
    if not isinstance(ui_bundle, dict):
        fallback = fallback_blueprint(learning_topic, learning_goal, target_audience, interaction_style)
        result["ui_bundle"] = fallback.get("ui_bundle", {})
    for key in ["html", "css", "js"]:
        if not isinstance(result["ui_bundle"].get(key), str) or not result["ui_bundle"].get(key).strip():
            fallback = fallback_blueprint(learning_topic, learning_goal, target_audience, interaction_style)
            result["ui_bundle"][key] = fallback.get("ui_bundle", {}).get(key, "")
    if enable_heavy_regen and isinstance(generation_model, str) and "fallback" in generation_model.lower():
        regenerated_bundle, _ = generate_dynamic_ui_bundle_with_glm5(
            learning_topic, learning_goal, target_audience, interaction_style
        )
        if isinstance(regenerated_bundle, dict):
            result["ui_bundle"] = regenerated_bundle
    if is_generic_bundle(result.get("ui_bundle")):
        if not enable_heavy_regen:
            result["ui_bundle"] = build_adaptive_ui_bundle(
                learning_topic, learning_goal, target_audience, interaction_style
            )
            return result
        generated_bundle, _ = generate_dynamic_ui_bundle_with_glm5(
            learning_topic, learning_goal, target_audience, interaction_style
        )
        result["ui_bundle"] = generated_bundle if isinstance(generated_bundle, dict) else build_adaptive_ui_bundle(
            learning_topic, learning_goal, target_audience, interaction_style
        )
    return result

def normalize_studio_requirements(raw):
    source = raw if isinstance(raw, dict) else {}
    requirement = {
        "learning_topic": (source.get("learning_topic") or "").strip(),
        "learning_goal": (source.get("learning_goal") or "").strip(),
        "target_audience": (source.get("target_audience") or "").strip(),
        "interaction_style": (source.get("interaction_style") or "").strip()
    }
    return requirement

def fallback_studio_chat_reply(requirement):
    missing = []
    if not requirement["learning_topic"]:
        missing.append("learning_topic")
    if not requirement["learning_goal"]:
        missing.append("learning_goal")
    if not requirement["target_audience"]:
        missing.append("target_audience")
    if not requirement["interaction_style"]:
        missing.append("interaction_style")
    reply = "我已记录你的想法。请继续告诉我：学习主题、学习目标、目标人群和交互风格。"
    if not missing:
        reply = "需求信息已经完整，可以点击“生成应用并保存”，我会为你创建专属学习应用。"
    return {
        "reply": reply,
        "requirement_update": requirement,
        "ready": len(missing) == 0,
        "missing_fields": missing
    }

def extract_requirement_from_dialog(dialog_reply, draft):
    schema_prompt = (
        "你是需求分析器。请基于对话内容和当前草稿，输出JSON对象，字段必须包含："
        "learning_topic, learning_goal, target_audience, interaction_style。"
        "只输出JSON对象，不要输出其他文本。"
    )
    user_prompt = (
        f"当前草稿：{json.dumps(draft, ensure_ascii=False)}\n"
        f"AI对话回复：{dialog_reply}\n"
        "请补全并修正需求字段，未知项保留空字符串或合理默认值。"
    )
    payload = {
        "model": "glm-4-plus",
        "messages": [
            {"role": "system", "content": schema_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "temperature": 0.2
    }
    try:
        response = requests.post(ai_service.chat_url, headers=ai_service.get_headers(), json=payload, timeout=30)
        if response.status_code != 200:
            return normalize_studio_requirements(draft)
        content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = parse_json_from_text(content)
        return normalize_studio_requirements(parsed)
    except Exception:
        return normalize_studio_requirements(draft)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mindmapnode')
def mindmapnode():
    return render_template('mindmapnode.html')

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    data = request.json
    user_message = data.get('message', '')
    enable_search = data.get('enable_search', False)
    thinking_mode = data.get('thinking_mode', 'disabled')
    
    # Add to history
    chat_history.append({"role": "user", "content": user_message})
    
    # Logic for recommendations (Simulated)
    recommended_docs = []
    # Only recommend if keywords match
    # keywords = ['推荐', '资料', '学习', '教程', 'recommend', 'study', 'learn']
    # if any(k in user_message.lower() for k in keywords):
    #     recommended_docs = random.sample(LEARNING_MATERIALS, k=min(2, len(LEARNING_MATERIALS)))

    def generate():
        ai_response_content = ""
        
        # Stream the AI response
        for chunk_data in ai_service.stream_chat(chat_history, enable_search=enable_search, thinking_mode=thinking_mode):
            if chunk_data['type'] == 'content':
                chunk = chunk_data['content']
                ai_response_content += chunk
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            elif chunk_data['type'] == 'search_status':
                yield f"data: {json.dumps(chunk_data)}\n\n"
            elif chunk_data['type'] == 'reasoning':
                yield f"data: {json.dumps(chunk_data)}\n\n"
            elif chunk_data['type'] == 'error':
                yield f"data: {json.dumps({'content': chunk_data['content']})}\n\n"
            
        # Add AI response to history
        chat_history.append({"role": "assistant", "content": ai_response_content})
        
        # Send recommendations if any
        if recommended_docs:
             yield f"data: {json.dumps({'recommended_materials': recommended_docs})}\n\n"
             
        yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/api/super-search', methods=['POST'])
def super_search():
    data = request.get_json(silent=True) or {}
    query = data.get('query', '')
     
    if not query:
        return jsonify({"error": "No query provided"}), 400

    def generate():
        try:
            # 1. Yield search status
            yield f"data: {json.dumps({'type': 'status', 'msg': '正在全网搜索相关资料...'})}\n\n"
            
            # 2. Stream Nodes
            count = 0
            for node in super_search_service.generate_knowledge_graph_stream(query):
                if count == 0:
                     yield f"data: {json.dumps({'type': 'status', 'msg': '开始构建知识图谱...'})}\n\n"
                
                yield f"data: {json.dumps({'type': 'node', 'data': node})}\n\n"
                count += 1
            
            if count == 0:
                yield f"data: {json.dumps({'type': 'error', 'msg': '未能生成有效内容'})}\n\n"
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'msg': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    response = Response(stream_with_context(generate()), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    return response

@app.route('/api/super-search/assist', methods=['POST'])
def super_search_assist():
    data = request.get_json(silent=True) or {}
    query = data.get('query', '')
    action = data.get('action', 'expand')
    node = data.get('node', {}) or {}

    if not query or not isinstance(node, dict):
        return jsonify({"error": "Invalid request"}), 400

    try:
        result_text = super_search_service.generate_node_assist(action, query, node)
        return jsonify({"result": result_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    # Deprecated: kept for compatibility if needed, but UI should use stream
    return jsonify({"status": "use /api/chat/stream"})

@app.route('/api/materials', methods=['GET'])
def get_materials():
    return jsonify(LEARNING_MATERIALS)

@app.route('/api/discovery', methods=['GET'])
def get_discovery_content():
    conn = get_db_connection()
    public_courses = conn.execute(
        """
        SELECT id, title, summary, cover_image, updated_at
        FROM knowledge_items
        WHERE visibility = 'public'
        ORDER BY updated_at DESC
        LIMIT 3
        """
    ).fetchall()
    public_apps = conn.execute(
        """
        SELECT id, title, description, updated_at
        FROM user_apps
        WHERE visibility = 'public' AND status = 'published'
        ORDER BY updated_at DESC
        LIMIT 3
        """
    ).fetchall()
    conn.close()
    dynamic_items = []
    for row in public_courses:
        dynamic_items.append({
            "id": 7000 + row["id"],
            "title": row["title"],
            "type": "course",
            "category": "Public Course",
            "date": row["updated_at"][:10] if row["updated_at"] else "",
            "image": row["cover_image"] or "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1000&auto=format&fit=crop",
            "description": row["summary"] or "社区公开课程",
            "author": "社区创作者"
        })
    for row in public_apps:
        dynamic_items.append({
            "id": 9000 + row["id"],
            "title": row["title"],
            "type": "app",
            "category": "Public App",
            "date": row["updated_at"][:10] if row["updated_at"] else "",
            "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
            "description": row["description"] or "社区公开应用",
            "author": "社区创作者"
        })
    return jsonify(dynamic_items + DISCOVERY_CONTENT)

@app.route('/api/knowledge', methods=['GET'])
def get_knowledge_base():
    return jsonify(KNOWLEDGE_BASE_DATA)

@app.route('/api/notes', methods=['GET'])
@require_login()
def api_get_notes():
    user_id = session.get("user_id")
    conn = get_db_connection()
    notes = []
    try:
        rows = conn.execute(
            """
            SELECT id, title, summary, payload_json, created_at
            FROM knowledge_items
            WHERE user_id = ? AND content_type = 'note'
            ORDER BY updated_at DESC
            """,
            (user_id,)
        ).fetchall()
        for row in rows:
            notes.append({
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "payload_json": row["payload_json"],
                "created_at": row["created_at"]
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# ----------------- Resource Center Routes -----------------
import os
import re
from pathlib import Path

def build_resource_tree(base_path):
    base_path = Path(base_path)
    tree = {
        "name": "公考资源指南 (developer2gwy)",
        "type": "directory",
        "path": "",
        "children": []
    }
    
    doc_path = base_path / "doc"
    if not doc_path.exists():
        return tree
        
    def walk_dir(current_path, relative_path):
        children = []
        for item in sorted(current_path.iterdir()):
            if item.name.startswith('.') or item.name == 'img':
                continue
            
            rel_item_path = os.path.join(relative_path, item.name).replace('\\', '/')
            
            if item.is_dir():
                children.append({
                    "name": item.name,
                    "type": "directory",
                    "path": rel_item_path,
                    "children": walk_dir(item, rel_item_path)
                })
            elif item.name.endswith('.md'):
                children.append({
                    "name": item.name.replace('.md', ''),
                    "type": "file",
                    "path": rel_item_path,
                    "extension": ".md"
                })
        return children

    tree["children"] = walk_dir(doc_path, "doc")
    
    # Add main README.md
    readme_path = base_path / "README.md"
    if readme_path.exists():
        tree["children"].insert(0, {
            "name": "快速入门指引 (README)",
            "type": "file",
            "path": "README.md",
            "extension": ".md"
        })
        
    return tree

@app.route('/api/resources/tree')
def api_get_resource_tree():
    """获取资源中心的目录树"""
    # 留出冗余设计，可以通过 type 参数区分考公、考研等
    resource_type = request.args.get('type', 'gwy')
    
    if resource_type == 'gwy':
        base_path = os.path.join(app.root_path, "source", "developer2gwy-main", "developer2gwy-main")
        if not os.path.exists(base_path):
            return jsonify({"error": "资源目录不存在"}), 404
        
        tree = build_resource_tree(base_path)
        return jsonify({"status": "success", "data": [tree]})
    else:
        return jsonify({"status": "success", "data": []})

@app.route('/api/resources/content')
def api_get_resource_content():
    """获取具体某个 markdown 文件的内容"""
    file_path = request.args.get('path')
    resource_type = request.args.get('type', 'gwy')
    
    if not file_path:
        return jsonify({"error": "缺少文件路径"}), 400
        
    # 防止路径穿越
    if '..' in file_path:
        return jsonify({"error": "非法的路径"}), 400
        
    if resource_type == 'gwy':
        base_path = os.path.join(app.root_path, "source", "developer2gwy-main", "developer2gwy-main")
        full_path = os.path.join(base_path, file_path)
        
        if not os.path.exists(full_path) or not full_path.endswith('.md'):
            return jsonify({"error": "文件不存在或格式不支持"}), 404
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({"status": "success", "content": content})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "未知的资源类型"}), 400
    return jsonify({"notes": notes})

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@require_login()
def api_delete_note(note_id):
    user_id = session.get("user_id")
    conn = get_db_connection()
    try:
        # 确保只能删除自己的笔记
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM knowledge_items WHERE id = ? AND user_id = ? AND content_type = 'note'",
            (note_id, user_id)
        )
        if cur.rowcount > 0:
            conn.commit()
            return jsonify({"status": "success"})
        else:
            return jsonify({"error": "Note not found or unauthorized"}), 404
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/knowledge/hub', methods=['GET'])
def get_knowledge_hub():
    user = get_current_user()
    user_id = user["id"] if user else None
    conn = get_db_connection()
    my_courses = []
    my_notes = []
    my_favorites = []
    if user_id:
        my_rows = conn.execute(
            """
            SELECT id, content_type, title, summary, cover_image, source_url, payload_json, visibility, created_at, updated_at, published_at
            FROM knowledge_items
            WHERE user_id = ?
            ORDER BY updated_at DESC
            """,
            (user_id,)
        ).fetchall()
        
        for row in my_rows:
            item = serialize_knowledge_row(row)
            item["payload"] = trim_payload_for_hub(item.get("payload"))
            if item.get("content_type") == "note":
                my_notes.append(item)
            else:
                my_courses.append(item)
                
        fav_rows = conn.execute(
            """
            SELECT id, target_type, target_id, title, summary, cover_image, source_url, created_at
            FROM user_favorites
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        ).fetchall()
        my_favorites = [dict(row) for row in fav_rows]

    public_course_rows = conn.execute(
        """
        SELECT id, user_id, content_type, title, summary, cover_image, source_url, payload_json, visibility, created_at, updated_at, published_at
        FROM knowledge_items
        WHERE visibility = 'public'
        ORDER BY updated_at DESC
        LIMIT 80
        """
    ).fetchall()
    public_courses = [serialize_knowledge_row(row) for row in public_course_rows]
    for item in public_courses:
        item["payload"] = trim_payload_for_hub(item.get("payload"))
    for item in public_courses:
        item["recommend_score"] = compute_recommendation_score(
            item.get("updated_at"),
            item.get("title"),
            item.get("summary"),
            True,
            item.get("visibility")
        )

    public_app_rows = conn.execute(
        """
        SELECT id, app_key, title, description, status, visibility, updated_at, app_type, generation_model, learning_topic, share_enabled, share_token
        FROM user_apps
        WHERE visibility = 'public' AND status = 'published'
        ORDER BY updated_at DESC
        LIMIT 80
        """
    ).fetchall()
    public_apps = []
    for row in public_app_rows:
        data = dict(row)
        data["recommend_score"] = compute_recommendation_score(
            data.get("updated_at"),
            data.get("title"),
            data.get("description"),
            bool(data.get("share_enabled")),
            data.get("visibility")
        )
        public_apps.append(data)
    conn.close()

    featured_pool = []
    for item in public_courses:
        featured_pool.append({
            "type": "course",
            "id": item["id"],
            "title": item["title"],
            "summary": item.get("summary", ""),
            "cover_image": item.get("cover_image", ""),
            "recommend_score": item.get("recommend_score", 0),
            "updated_at": item.get("updated_at"),
            "route_target": "course",
            "payload": item.get("payload", {})
        })
    for app_item in public_apps:
        featured_pool.append({
            "type": "app",
            "id": app_item["id"],
            "title": app_item["title"],
            "summary": app_item.get("description", ""),
            "cover_image": "",
            "recommend_score": app_item.get("recommend_score", 0),
            "updated_at": app_item.get("updated_at"),
            "route_target": "app",
            "share_token": app_item.get("share_token", "")
        })
    featured_pool.sort(key=lambda x: (x.get("recommend_score", 0), x.get("updated_at", "")), reverse=True)

    return jsonify({
        "my_courses": my_courses,
        "my_notes": my_notes,
        "my_favorites": my_favorites,
        "public_courses": public_courses,
        "public_apps": public_apps,
        "featured_recommendations": featured_pool[:16]
    })

@app.route('/api/knowledge/courses/save', methods=['POST'])
@require_login()
def save_generated_course():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "课程标题不能为空"}), 400
    summary = (data.get("summary") or "").strip()
    source_type = (data.get("source_type") or "url").strip()
    generation_model = (data.get("generation_model") or "").strip()
    lesson_units = data.get("lesson_units")
    slides = data.get("slides")
    blog_markdown = data.get("blog_markdown")
    if not isinstance(lesson_units, list):
        lesson_units = []
    if not isinstance(slides, list):
        slides = []
    payload = {
        "source_type": source_type,
        "generation_model": generation_model,
        "lesson_units": lesson_units,
        "slides": slides,
        "blog_markdown": blog_markdown if isinstance(blog_markdown, str) else "",
        "page_count": data.get("page_count") or len(lesson_units) or len(slides)
    }
    cover_image = ""
    for unit in lesson_units:
        if isinstance(unit, dict) and unit.get("image_url"):
            cover_image = str(unit.get("image_url"))
            break
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO knowledge_items(
            user_id, content_type, title, summary, cover_image, source_url, payload_json, visibility, created_at, updated_at
        )
        VALUES (?, 'course', ?, ?, ?, ?, ?, 'private', ?, ?)
        """,
        (
            session["user_id"], title, summary, cover_image, "",
            json.dumps(payload, ensure_ascii=False), now, now
        )  
    )
    item_id = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "item_id": item_id})

@app.route('/api/knowledge/favorites', methods=['POST'])
@require_login()
def add_knowledge_favorite():
    data = request.get_json(silent=True) or {}
    target_type = (data.get("target_type") or "article").strip()
    try:
        target_id = int(data.get("target_id")) if data.get("target_id") is not None else None
    except (TypeError, ValueError):
        target_id = None
    title = (data.get("title") or "").strip()
    summary = (data.get("summary") or "").strip()
    cover_image = (data.get("cover_image") or "").strip()
    source_url = (data.get("source_url") or "").strip()
    if not title:
        return jsonify({"error": "收藏标题不能为空"}), 400
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO user_favorites(
            user_id, target_type, target_id, title, summary, cover_image, source_url, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (session["user_id"], target_type, target_id, title, summary, cover_image, source_url, now)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/knowledge/items/<int:item_id>/publish', methods=['POST'])
@require_login()
def publish_knowledge_item(item_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id, visibility FROM knowledge_items WHERE id = ? AND user_id = ?",
        (item_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "内容不存在"}), 404
    now = datetime.utcnow().isoformat()
    new_visibility = "private" if row["visibility"] == "public" else "public"
    conn.execute(
        """
        UPDATE knowledge_items
        SET visibility = ?, updated_at = ?, published_at = CASE WHEN ?='public' THEN ? ELSE published_at END
        WHERE id = ? AND user_id = ?
        """,
        (new_visibility, now, new_visibility, now, item_id, session["user_id"])
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "visibility": new_visibility})

@app.route('/api/knowledge/items/<int:item_id>', methods=['DELETE'])
@require_login()
def delete_knowledge_item(item_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id FROM knowledge_items WHERE id = ? AND user_id = ?",
        (item_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "内容不存在或无权限删除"}), 404
    conn.execute("DELETE FROM knowledge_items WHERE id = ? AND user_id = ?", (item_id, session["user_id"]))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/knowledge/favorites/<int:favorite_id>', methods=['DELETE'])
@require_login()
def delete_knowledge_favorite(favorite_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id FROM user_favorites WHERE id = ? AND user_id = ?",
        (favorite_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "收藏不存在或无权限删除"}), 404
    conn.execute("DELETE FROM user_favorites WHERE id = ? AND user_id = ?", (favorite_id, session["user_id"]))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/knowledge/items/<int:item_id>', methods=['GET'])
def get_knowledge_item_detail(item_id):
    user = get_current_user()
    user_id = user["id"] if user else None
    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT id, user_id, content_type, title, summary, cover_image, source_url, payload_json, visibility, created_at, updated_at, published_at
        FROM knowledge_items
        WHERE id = ?
        """,
        (item_id,)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "内容不存在"}), 404
    item = serialize_knowledge_row(row)
    is_owner = user_id is not None and int(item.get("user_id") or 0) == int(user_id)
    if item.get("visibility") != "public" and not is_owner:
        return jsonify({"error": "无权限访问"}), 403
    payload = item.get("payload") if isinstance(item.get("payload"), dict) else {}
    payload, generated_audio_count = ensure_payload_audio(payload)
    if generated_audio_count > 0 and is_owner:
        conn = get_db_connection()
        conn.execute(
            "UPDATE knowledge_items SET payload_json = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            (json.dumps(payload, ensure_ascii=False), datetime.utcnow().isoformat(), item_id, user_id)
        )
        conn.commit()
        conn.close()
    item["payload"] = payload
    return jsonify(item)

@app.route('/api/social', methods=['GET'])
def get_social_feed():
    return jsonify(SOCIAL_DATA)

@app.route('/api/ai-apps', methods=['GET'])
def get_ai_apps():
    conn = get_db_connection()
    public_rows = conn.execute(
        """
        SELECT id, title, description, app_type, generation_model, learning_topic, updated_at, share_enabled
        FROM user_apps
        WHERE visibility = 'public' AND status = 'published'
        ORDER BY updated_at DESC
        LIMIT 40
        """
    ).fetchall()
    conn.close()
    dynamic_apps = []
    for row in public_rows:
        item = dict(row)
        dynamic_apps.append({
            "id": f"user-app-{item['id']}",
            "public_app_id": item["id"],
            "name": item["title"],
            "description": item.get("description") or f"社区公开应用：{item.get('learning_topic') or '学习主题'}",
            "category": "社区公开",
            "mode": "用户作品",
            "icon": "fa-user-astronaut",
            "target": "app-player",
            "route_target": "app",
            "featured": bool(item.get("share_enabled")),
            "tags": [
                item.get("app_type") or "public",
                item.get("generation_model") or "AI",
                "公开应用"
            ],
            "recommend_score": compute_recommendation_score(
                item.get("updated_at"),
                item.get("title"),
                item.get("description"),
                bool(item.get("share_enabled")),
                "public"
            )
        })
    result = list(AI_APPS_DATA) + dynamic_apps
    result.sort(key=lambda x: (1 if x.get("featured") else 0, x.get("recommend_score", 0)), reverse=True)
    return jsonify(result)

@app.route('/api/ai-apps/create', methods=['POST'])
def create_ai_app():
    return jsonify({
        "status": "pending",
        "message": "创建 AI 教育应用接口已预留，后续可接入表单与工作流。"
    }), 202

@app.route('/api/ppt-blog/generate', methods=['POST'])
def generate_ppt_blog():
    source_type = "url"
    source_url = ""
    preferred_model = "auto"
    style_hint = "专业、清晰、可讲解"
    voice = "female"
    parse_warning = ""
    max_page_cap = 30

    if request.content_type and "multipart/form-data" in request.content_type:
        source_type = (request.form.get("source_type") or "pdf").strip().lower()
        source_url = (request.form.get("source_url") or "").strip()
        preferred_model = (request.form.get("preferred_model") or "auto").strip()
        style_hint = (request.form.get("style_hint") or style_hint).strip()
        voice = (request.form.get("voice") or voice).strip()
        try:
            max_page_cap = int(request.form.get("max_slides") or 30)
        except (TypeError, ValueError):
            max_page_cap = 30
        pdf_file = request.files.get("pdf_file")
    else:
        data = request.get_json(silent=True) or {}
        source_type = (data.get("source_type") or "url").strip().lower()
        source_url = (data.get("source_url") or "").strip()
        preferred_model = (data.get("preferred_model") or "auto").strip()
        style_hint = (data.get("style_hint") or style_hint).strip()
        voice = (data.get("voice") or voice).strip()
        try:
            max_page_cap = int(data.get("max_slides") or 30)
        except (TypeError, ValueError):
            max_page_cap = 30
        pdf_file = None

    max_page_cap = max(10, min(max_page_cap, 30))

    try:
        if source_type == "pdf":
            if not pdf_file:
                return jsonify({"error": "请先上传 PDF 文件"}), 400
            try:
                extracted_text = extract_text_from_pdf_via_parser(pdf_file)
                parsed_from = "pdf_parser"
            except Exception as pdf_err:
                file_name = (pdf_file.filename or "未命名PDF").strip()
                local_text = extract_text_from_pdf_local(pdf_file)
                if len(local_text) >= 260:
                    extracted_text = local_text
                    parse_warning = f"PDF云解析异常，已切换本地解析：{str(pdf_err)}"
                    parsed_from = "pdf_local_fallback"
                else:
                    parse_warning = f"PDF解析服务异常，已启用低信息降级：{str(pdf_err)}"
                    extracted_text = (
                        f"文档名称：{file_name}\n"
                        "可用原始内容较少，请输出一套高质量、轻松自然的博客式可视化讲解。"
                        "重点覆盖：背景、关键观点、真实案例、风险提醒、结论建议。"
                    )
                    parsed_from = "pdf_parser_fallback"
        else:
            if not source_url:
                return jsonify({"error": "请输入网址"}), 400
            extracted_text = extract_text_from_url(source_url)
            parsed_from = "url_reader"
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as ex:
        return jsonify({"error": f"内容解析失败：{str(ex)}"}), 500

    if len(extracted_text) < 120:
        return jsonify({"error": "可解析内容过少，暂时无法生成 PPT 与博客"}), 400

    target_pages, min_pages, max_pages = decide_auto_page_plan(len(extracted_text), style_hint)
    max_pages = min(max_pages, max_page_cap)
    target_pages = min(target_pages, max_pages)
    min_pages = min(min_pages, max_pages)
    model_candidates = choose_generation_models(preferred_model, len(extracted_text))
    prompt = (
        "你是资深内容编辑与博客讲述者，请把输入改写成轻松自然、可直接演示的视觉博客。"
        "不要固定课堂模板，不要照本宣科。"
        "输出必须是JSON对象，不要包含代码块。"
        f"页数由你根据内容复杂度自动决定，建议约{target_pages}页，最少{min_pages}页，最多{max_pages}页。"
        f"风格：{style_hint or '自然、有画面感、口语化'}。"
        "JSON结构严格如下："
        "{"
        "\"title\":\"\","
        "\"summary\":\"\","
        "\"prerequisites\":[\"\"],"
        "\"difficulty_curve\":\"\","
        "\"estimated_minutes\":60,"
        "\"lesson_units\":[{\"unit_title\":\"\",\"learning_goal\":\"\",\"key_takeaway\":\"\",\"points\":[\"\"],\"explanation\":\"\",\"example\":\"\",\"misconception\":\"\",\"quiz_question\":\"\",\"quiz_answer\":\"\",\"visual_focus\":\"\",\"highlight\":\"\",\"speaker_note\":\"\",\"layout_style\":\"\"}],"
        "\"blog_markdown\":\"\""
        "}"
        "要求：lesson_units每单元points 3-6条；speaker_note可直接口播；"
        "单元标题与重点适当加入emoji提高可读性；讲稿必须口语化、带提问感与画面感；"
        "speaker_note必须是自然播客口播文本，不要emoji，不要括号补充，不要罗列编号；"
        "尽量避免冗长括号信息堆叠；"
        "尽量在不同单元使用不同版式风格（visual-focus/text-focus/split-contrast/card-magazine）；"
        "blog_markdown使用中文Markdown并按章节展开。"
    )
    simplified_material = simplify_material_text(extracted_text, 20000)
    user_input = f"原始内容如下：\n{simplified_material}"
    messages = [{"role": "system", "content": prompt}, {"role": "user", "content": user_input}]

    parsed = None
    model_used = model_candidates[0] if model_candidates else "unknown"
    try:
        result_text, model_used = call_bigmodel_chat_with_fallback(
            messages=messages,
            model_candidates=model_candidates,
            temperature=0.4,
            max_tokens=8192,
            response_format={"type": "json_object"}
        )
        parsed = parse_json_from_text(result_text)
    except Exception:
        repair_messages = [
            {
                "role": "system",
                "content": (
                    "你是JSON修复器。请基于输入内容直接输出合法JSON对象，"
                    "字段必须包含 title, summary, lesson_units, blog_markdown；"
                    "lesson_units是数组，元素含unit_title, learning_goal, key_takeaway, points, explanation, example, misconception, quiz_question, quiz_answer, visual_focus, highlight, speaker_note, layout_style。"
                    f"页数自动决定，范围{min_pages}-{max_pages}页。"
                    "禁止输出解释和代码块。"
                )
            },
            {"role": "user", "content": f"请自动分页输出课程结构。原始内容：\n{simplified_material[:18000]}"}
        ]
        try:
            repair_text, model_used = call_bigmodel_chat_with_fallback(
                messages=repair_messages,
                model_candidates=model_candidates,
                temperature=0.2,
                max_tokens=8192,
                response_format={"type": "json_object"}
            )
            parsed = parse_json_from_text(repair_text)
        except Exception:
            parsed = build_ppt_blog_fallback(extracted_text, target_pages)

    lesson_units = normalize_lesson_units(parsed, max_pages)
    if not lesson_units:
        return jsonify({"error": "模型未返回有效PPT结构，请重试"}), 500
    lesson_units = polish_speaker_notes_with_glm5(
        lesson_units,
        parsed.get("title") if isinstance(parsed, dict) else "",
        style_hint
    )

    source_images = extract_image_candidates(extracted_text, limit=24)
    page_images = extract_images_from_source_url(source_url, limit=24) if source_type == "url" else []
    merged_source_images = []
    for img in source_images + page_images:
        if img and img not in merged_source_images:
            merged_source_images.append(img)
    search_query = f"{str(parsed.get('title') or '').strip()} {str(parsed.get('summary') or '')[:60]} {style_hint or ''} 图解"
    web_images = search_image_candidates_via_web(search_query, limit=24)
    related_links = search_related_links_via_web(search_query, limit=14)
    image_gen_budget = 3
    image_interval = 1 if len(lesson_units) <= 10 else 2
    source_cursor = 0
    web_cursor = 0
    link_cursor = 0
    for idx, unit in enumerate(lesson_units):
        unit["source_link"] = source_url if source_type == "url" else ""
        should_attach_image = idx == 0 or idx % image_interval == 0
        if not should_attach_image:
            unit["image_url"] = ""
        else:
            source_image = merged_source_images[source_cursor % len(merged_source_images)] if merged_source_images else ""
            if source_image:
                source_cursor += 1
            web_image = web_images[web_cursor % len(web_images)] if web_images else ""
            if web_image:
                web_cursor += 1
            generated_image = ""
            if not source_image and not web_image and image_gen_budget > 0:
                visual_prompt = f"{unit.get('visual_focus') or unit.get('unit_title')}, 博客插图, 高级视觉, 电影感"
                generated_image = generate_visual_image_url(visual_prompt)
                if generated_image:
                    image_gen_budget -= 1
            unit["image_url"] = source_image or web_image or generated_image
        if related_links:
            ref = related_links[link_cursor % len(related_links)]
            link_cursor += 1
            if ref.get("url"):
                unit["source_link"] = ref["url"]
                if not unit.get("image_url"):
                    unit["image_url"] = extract_image_from_search_result_item(ref)

    tts_success_count = 0
    tts_fail_reason = ""
    for unit in lesson_units:
        audio_base64, audio_mime, tts_error = synthesize_tts_audio_base64(unit.get("speaker_note", ""), voice=voice)
        unit["audio_base64"] = audio_base64 or ""
        unit["audio_mime"] = audio_mime if audio_base64 else ""
        if audio_base64:
            tts_success_count += 1
        elif not tts_fail_reason and tts_error:
            tts_fail_reason = str(tts_error)

    slides = [
        {
            "index": unit["index"],
            "title": unit["unit_title"],
            "points": unit["points"],
            "highlight": unit.get("highlight", ""),
            "image_url": unit.get("image_url", ""),
            "layout_style": unit.get("layout_style", ""),
            "theme_style": unit.get("theme_style", ""),
            "source_link": unit.get("source_link", ""),
            "speaker_note": unit["speaker_note"],
            "audio_base64": unit.get("audio_base64", ""),
            "audio_mime": unit.get("audio_mime", "")
        }
        for unit in lesson_units
    ]

    blog_markdown = str(parsed.get("blog_markdown") or "").strip()
    if not blog_markdown:
        blog_markdown = "\n\n".join(
            [f"## {item['index']}. {item['title']}\n\n" + "\n".join([f"- {p}" for p in item["points"]]) for item in slides]
        )

    return jsonify({
        "status": "success",
        "title": clean_text_for_display(parsed.get("title") or "AI 生成PPT博客", 120),
        "summary": clean_text_for_display(parsed.get("summary") or "", 260),
        "source_type": source_type,
        "parsed_from": parsed_from,
        "parse_warning": parse_warning,
        "generation_model": model_used,
        "tts_model": "glm-tts",
        "tts_speed": 1.28,
        "source_url": source_url if source_type == "url" else "",
        "reference_links": related_links,
        "lesson_units": lesson_units,
        "slides": slides,
        "page_count": len(lesson_units),
        "page_strategy": "auto",
        "prerequisites": parsed.get("prerequisites", []) if isinstance(parsed, dict) else [],
        "difficulty_curve": parsed.get("difficulty_curve", "") if isinstance(parsed, dict) else "",
        "estimated_minutes": parsed.get("estimated_minutes", max(20, len(lesson_units) * 6)) if isinstance(parsed, dict) else max(20, len(lesson_units) * 6),
        "blog_markdown": blog_markdown,
        "tts_success_count": tts_success_count,
        "tts_total_count": len(lesson_units),
        "tts_warning": tts_fail_reason
    })

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    display_name = (data.get('display_name') or '').strip()
    if not EMAIL_REGEX.match(email):
        return jsonify({"error": "邮箱格式不正确"}), 400
    if len(password) < 8:
        return jsonify({"error": "密码至少 8 位"}), 400
    if not display_name:
        display_name = email.split('@')[0]

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "该邮箱已注册"}), 409
    now = datetime.utcnow().isoformat()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO users(email, password_hash, display_name, role, email_verified, created_at)
        VALUES (?, ?, ?, 'user', 0, ?)
        """,
        (email, generate_password_hash(password), display_name, now)
    )
    user_id = cur.lastrowid
    cur.execute(
        """
        INSERT INTO user_assets(user_id, asset_type, asset_name, asset_value, updated_at)
        VALUES (?, 'token', '学习积分', 300, ?)
        """,
        (user_id, now)
    )
    cur.execute(
        """
        INSERT INTO social_profiles(user_id, bio, skills, allow_collab, followers, following)
        VALUES (?, '', '', 1, 0, 0)
        """,
        (user_id,)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "注册成功，请登录。"})

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"error": "邮箱或密码错误"}), 401

    now = datetime.utcnow().isoformat()
    conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user["id"]))
    conn.commit()
    conn.close()

    session["user_id"] = user["id"]
    session["role"] = user["role"]
    return jsonify({
        "status": "success",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "role": user["role"]
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    session.clear()
    return jsonify({"status": "success"})

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"authenticated": False, "user": None})
    user["authenticated"] = True
    return jsonify({"authenticated": True, "user": user})

@app.route('/api/user/assets', methods=['GET'])
@require_login()
def get_user_assets():
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT id, asset_type, asset_name, asset_value, updated_at FROM user_assets WHERE user_id = ? ORDER BY id DESC",
        (session["user_id"],)
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/user/assets', methods=['POST'])
@require_login()
def add_user_asset():
    data = request.get_json(silent=True) or {}
    asset_type = (data.get("asset_type") or "custom").strip()
    asset_name = (data.get("asset_name") or "").strip()
    try:
        asset_value = float(data.get("asset_value") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "资产数值不合法"}), 400
    if not asset_name:
        return jsonify({"error": "资产名称不能为空"}), 400
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO user_assets(user_id, asset_type, asset_name, asset_value, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (session["user_id"], asset_type, asset_name, asset_value, now)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/user/apps', methods=['GET'])
@require_login()
def get_user_apps():
    app_type_filter = (request.args.get("app_type") or "").strip()
    conn = get_db_connection()
    if app_type_filter:
        rows = conn.execute(
            """
            SELECT id, app_key, title, description, status, visibility, created_at, updated_at,
                   app_type, generation_model, learning_topic, share_token, share_enabled
            FROM user_apps
            WHERE user_id = ? AND app_type = ?
            ORDER BY id DESC
            """,
            (session["user_id"], app_type_filter)
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT id, app_key, title, description, status, visibility, created_at, updated_at,
                   app_type, generation_model, learning_topic, share_token, share_enabled
            FROM user_apps WHERE user_id = ? ORDER BY id DESC
            """,
            (session["user_id"],)
        ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/user/apps', methods=['POST'])
@require_login()
def create_user_app():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    if not title:
        return jsonify({"error": "应用名称不能为空"}), 400
    app_key = f"user-{session['user_id']}-{int(datetime.utcnow().timestamp())}"
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO user_apps(
            user_id, app_key, title, description, status, visibility, created_at, updated_at, app_type
        )
        VALUES (?, ?, ?, ?, 'draft', 'private', ?, ?, 'manual')
        """,
        (session["user_id"], app_key, title, description, now, now)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "应用草稿已创建"})

@app.route('/api/user/apps/<int:app_id>/publish', methods=['POST'])
@require_login()
def publish_user_app(app_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id FROM user_apps WHERE id = ? AND user_id = ?",
        (app_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "应用不存在"}), 404
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE user_apps SET status='published', visibility='public', updated_at = ? WHERE id = ?",
        (now, app_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/user/apps/<int:app_id>/share', methods=['POST'])
@require_login()
def share_user_app(app_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id FROM user_apps WHERE id = ? AND user_id = ?",
        (app_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "应用不存在"}), 404
    share_token = secrets.token_urlsafe(16)
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        UPDATE user_apps
        SET share_token = ?, share_enabled = 1, visibility = 'public', status='published', updated_at = ?
        WHERE id = ?
        """,
        (share_token, now, app_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "share_token": share_token, "share_url": f"/api/shared/apps/{share_token}"})

@app.route('/api/user/apps/<int:app_id>/unshare', methods=['POST'])
@require_login()
def unshare_user_app(app_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id FROM user_apps WHERE id = ? AND user_id = ?",
        (app_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "应用不存在"}), 404
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        UPDATE user_apps
        SET share_enabled = 0, share_token = NULL, visibility = 'private', updated_at = ?
        WHERE id = ?
        """,
        (now, app_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/user/apps/<int:app_id>', methods=['DELETE'])
@require_login()
def delete_user_app(app_id):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id FROM user_apps WHERE id = ? AND user_id = ?",
        (app_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "应用不存在"}), 404
    conn.execute("DELETE FROM user_apps WHERE id = ?", (app_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/user/apps/<int:app_id>/open', methods=['GET'])
@require_login()
def open_user_app(app_id):
    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT id, app_key, title, description, status, visibility, app_type, generation_model,
               learning_topic, blueprint_json, updated_at
        FROM user_apps
        WHERE id = ? AND user_id = ?
        """,
        (app_id, session["user_id"])
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "应用不存在"}), 404
    data = dict(row)
    blueprint_text = data.get("blueprint_json") or "{}"
    try:
        data["blueprint"] = json.loads(blueprint_text)
    except Exception:
        data["blueprint"] = {}
    data["blueprint"] = ensure_blueprint_runtime(
        data["blueprint"],
        data.get("learning_topic") or "通用学习",
        "系统掌握并能实战应用",
        "学习者",
        "任务驱动+即时反馈",
        4,
        data.get("generation_model") or "",
        False
    )
    data.pop("blueprint_json", None)
    return jsonify(data)

@app.route('/api/shared/apps/<share_token>', methods=['GET'])
def get_shared_app(share_token):
    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT app_key, title, description, learning_topic, generation_model, blueprint_json, updated_at
        FROM user_apps
        WHERE share_token = ? AND share_enabled = 1 AND visibility = 'public'
        """,
        (share_token,)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "分享链接无效"}), 404
    data = dict(row)
    blueprint_text = data.get("blueprint_json") or "{}"
    try:
        data["blueprint"] = json.loads(blueprint_text)
    except Exception:
        data["blueprint"] = {}
    data["blueprint"] = ensure_blueprint_runtime(
        data["blueprint"],
        data.get("learning_topic") or "通用学习",
        "系统掌握并能实战应用",
        "学习者",
        "任务驱动+即时反馈",
        4,
        data.get("generation_model") or "",
        False
    )
    data.pop("blueprint_json", None)
    return jsonify(data)

@app.route('/api/public/apps/<int:app_id>', methods=['GET'])
def get_public_app_by_id(app_id):
    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT app_key, title, description, learning_topic, generation_model, blueprint_json, updated_at
        FROM user_apps
        WHERE id = ? AND visibility = 'public' AND status = 'published'
        """,
        (app_id,)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "公开应用不存在"}), 404
    data = dict(row)
    blueprint_text = data.get("blueprint_json") or "{}"
    try:
        data["blueprint"] = json.loads(blueprint_text)
    except Exception:
        data["blueprint"] = {}
    data["blueprint"] = ensure_blueprint_runtime(
        data["blueprint"],
        data.get("learning_topic") or "通用学习",
        "系统掌握并能实战应用",
        "学习者",
        "任务驱动+即时反馈",
        4,
        data.get("generation_model") or "",
        False
    )
    data.pop("blueprint_json", None)
    return jsonify(data)

@app.route('/api/user/apps/generate', methods=['POST'])
@require_login()
def generate_user_app():
    data = request.get_json(silent=True) or {}
    learning_topic = (data.get("learning_topic") or "").strip()
    learning_goal = (data.get("learning_goal") or "系统掌握并能实战应用").strip()
    target_audience = (data.get("target_audience") or "中学到大学学习者").strip()
    interaction_style = (data.get("interaction_style") or "任务驱动+即时反馈").strip()
    try:
        duration_weeks = int(data.get("duration_weeks") or 4)
    except (TypeError, ValueError):
        duration_weeks = 4
    duration_weeks = max(1, min(duration_weeks, 24))
    if not learning_topic:
        return jsonify({"error": "学习主题不能为空"}), 400

    blueprint, model_used = generate_app_blueprint_with_glm5(
        learning_topic=learning_topic,
        learning_goal=learning_goal,
        target_audience=target_audience,
        interaction_style=interaction_style,
        duration_weeks=duration_weeks
    )
    blueprint = ensure_blueprint_runtime(
        blueprint,
        learning_topic,
        learning_goal,
        target_audience,
        interaction_style,
        duration_weeks,
        model_used,
        True
    )
    title = sanitize_app_name(blueprint.get("app_name") or learning_topic)
    description = blueprint.get("one_liner") or blueprint.get("positioning") or f"面向{target_audience}的学习应用"
    app_key = f"gen-{session['user_id']}-{int(datetime.utcnow().timestamp())}"
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO user_apps(
            user_id, app_key, title, description, status, visibility, created_at, updated_at,
            app_type, generation_model, learning_topic, blueprint_json, share_enabled
        )
        VALUES (?, ?, ?, ?, 'draft', 'private', ?, ?, 'ai_generated', ?, ?, ?, 0)
        """,
        (
            session["user_id"], app_key, title, description, now, now,
            model_used, learning_topic, json.dumps(blueprint, ensure_ascii=False)
        )
    )
    app_id = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({
        "status": "success",
        "message": "AI 应用已生成并保存到你的创作中心",
        "app": {
            "id": app_id,
            "app_key": app_key,
            "title": title,
            "description": description,
            "status": "draft",
            "visibility": "private",
            "app_type": "ai_generated",
            "generation_model": model_used,
            "learning_topic": learning_topic,
            "blueprint": blueprint
        }
    })

@app.route('/api/user/apps/<int:app_id>/ai-action', methods=['POST'])
@require_login()
def user_app_ai_action(app_id):
    def normalize_text(value):
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, (dict, list)):
            try:
                return json.dumps(value, ensure_ascii=False).strip()
            except Exception:
                return str(value).strip()
        if value is None:
            return ""
        return str(value).strip()

    def normalize_modules(value):
        if isinstance(value, dict):
            value = list(value.values())
        if not isinstance(value, (list, tuple, set)):
            return []
        output = []
        for item in value:
            if isinstance(item, str):
                text = item.strip()
            elif isinstance(item, dict):
                text = (
                    item.get("name")
                    or item.get("title")
                    or item.get("label")
                    or ""
                )
                text = str(text).strip()
            else:
                text = str(item).strip()
            if text:
                output.append(text)
        return output

    data = request.get_json(silent=True) or {}
    action = normalize_text(data.get("action") or "coach")
    user_input = normalize_text(data.get("user_input"))
    if not user_input:
        return jsonify({"error": "请输入你的问题或需求"}), 400

    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT title, learning_topic, blueprint_json
        FROM user_apps
        WHERE id = ? AND user_id = ?
        """,
        (app_id, session["user_id"])
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "应用不存在"}), 404

    payload = dict(row)
    blueprint = {}
    try:
        blueprint = json.loads(payload.get("blueprint_json") or "{}")
    except Exception:
        blueprint = {}
    if not isinstance(blueprint, dict):
        blueprint = {}

    action_map = {
        "coach": "你是学习教练，请先诊断问题再给出步骤化建议。",
        "explain": "你是讲解老师，请深入浅出解释概念并举例。",
        "practice": "你是命题老师，请输出针对性的练习题并给参考答案。"
    }
    role_prompt = action_map.get(action, action_map["coach"])
    app_title = payload.get("title") or "学习应用"
    topic = payload.get("learning_topic") or "通用学习"
    features = "、".join(normalize_modules(blueprint.get("feature_modules"))[:5])
    prompt = (
        f"{role_prompt}\n"
        f"应用名称：{app_title}\n"
        f"学习主题：{topic}\n"
        f"核心模块：{features}\n"
        f"用户输入：{user_input}\n"
        "输出要求：先给结论，再给可执行步骤，最后给一个下一步行动建议。"
    )
    answer = collect_ai_text(prompt, enable_search=False, thinking_mode="balanced")
    return jsonify({"status": "success", "answer": answer})

@app.route('/api/user/apps/<int:app_id>/tune', methods=['POST'])
@require_login()
def tune_user_app(app_id):
    data = request.get_json(silent=True) or {}
    instruction = str(data.get("instruction") or "").strip()
    mode = str(data.get("mode") or "preview").strip().lower()
    if not instruction:
        return jsonify({"error": "请先描述你想微调的内容"}), 400
    if mode not in ["preview", "apply"]:
        mode = "preview"

    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT id, title, learning_topic, blueprint_json
        FROM user_apps
        WHERE id = ? AND user_id = ?
        """,
        (app_id, session["user_id"])
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "应用不存在"}), 404

    payload = dict(row)
    try:
        blueprint = json.loads(payload.get("blueprint_json") or "{}")
    except Exception:
        blueprint = {}
    if not isinstance(blueprint, dict):
        blueprint = {}
    current_bundle = blueprint.get("ui_bundle") if isinstance(blueprint.get("ui_bundle"), dict) else {}
    tuned_bundle, tuned_model = generate_tuned_ui_bundle(
        payload.get("title") or "学习应用",
        payload.get("learning_topic") or "通用学习",
        instruction,
        current_bundle
    )
    if not isinstance(tuned_bundle, dict):
        conn.close()
        return jsonify({"error": "微调生成失败，请换一种更具体的描述"}), 500

    if mode == "apply":
        blueprint["ui_bundle"] = tuned_bundle
        now = datetime.utcnow().isoformat()
        conn.execute(
            "UPDATE user_apps SET blueprint_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(blueprint, ensure_ascii=False), now, app_id)
        )
        conn.commit()
        conn.close()
        return jsonify({
            "status": "success",
            "mode": "apply",
            "message": "微调已应用到当前应用",
            "ui_bundle": tuned_bundle,
            "tuned_model": tuned_model
        })

    conn.close()
    return jsonify({
        "status": "success",
        "mode": "preview",
        "message": "已生成微调预览，可选择应用",
        "ui_bundle": tuned_bundle,
        "tuned_model": tuned_model
    })

@app.route('/api/user/apps/studio/chat', methods=['POST'])
def studio_chat():
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    draft = normalize_studio_requirements(data.get("requirement"))
    history = data.get("history") or []
    if not isinstance(history, list):
        history = []
    history = history[-8:]
    for item in history:
        if isinstance(item, dict):
            role = item.get("role")
            content = item.get("content")
            if role in ["user", "assistant"] and isinstance(content, str):
                pass

    if user_message:
        history.append({"role": "user", "content": user_message})

    system_prompt = (
        "你是AI应用创造控制台的产品顾问。你的目标是通过对话收集并完善需求，"
        "并返回JSON：reply, requirement_update, ready, missing_fields。"
        "requirement_update字段必须包含 learning_topic, learning_goal, target_audience, interaction_style。"
        "ready为布尔值。missing_fields只允许出现上述四个字段名。"
        "输出只能是JSON对象，不要输出其它文本。"
    )
    context_prompt = (
        "当前需求草稿："
        f"{json.dumps(draft, ensure_ascii=False)}"
    )
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": context_prompt}]
    messages.extend(history)
    payload = {
        "model": "glm-5",
        "messages": messages,
        "stream": False,
        "temperature": 0.4,
        "response_format": {"type": "json_object"}
    }
    headers = ai_service.get_headers()
    try:
        response = requests.post(ai_service.chat_url, headers=headers, json=payload, timeout=45)
        if response.status_code != 200:
            payload["model"] = "glm-4-plus"
            response = requests.post(ai_service.chat_url, headers=headers, json=payload, timeout=45)
        if response.status_code != 200:
            result = fallback_studio_chat_reply(draft)
            return jsonify(result)
        content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = parse_json_from_text(content)
        update = normalize_studio_requirements(parsed.get("requirement_update") or draft)
        if draft["learning_topic"] and not update["learning_topic"]:
            update["learning_topic"] = draft["learning_topic"]
        if draft["learning_goal"] and not update["learning_goal"]:
            update["learning_goal"] = draft["learning_goal"]
        if draft["target_audience"] and not update["target_audience"]:
            update["target_audience"] = draft["target_audience"]
        if draft["interaction_style"] and not update["interaction_style"]:
            update["interaction_style"] = draft["interaction_style"]
        missing_fields = [field for field in ["learning_topic", "learning_goal", "target_audience", "interaction_style"] if not update[field]]
        ready = len(missing_fields) == 0
        return jsonify({
            "reply": parsed.get("reply") or "我已经记录你的需求，请继续补充。",
            "requirement_update": update,
            "ready": bool(parsed.get("ready")) if not missing_fields else False,
            "missing_fields": parsed.get("missing_fields") if isinstance(parsed.get("missing_fields"), list) else missing_fields
        })
    except Exception:
        return jsonify(fallback_studio_chat_reply(draft))

@app.route('/api/user/apps/studio/chat/stream', methods=['POST'])
def studio_chat_stream():
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    draft = normalize_studio_requirements(data.get("requirement"))
    history = data.get("history") or []
    if not isinstance(history, list):
        history = []
    history = history[-8:]
    normalized_history = []
    for item in history:
        if isinstance(item, dict):
            role = item.get("role")
            content = item.get("content")
            if role in ["user", "assistant"] and isinstance(content, str):
                normalized_history.append({"role": role, "content": content})
    if user_message:
        normalized_history.append({"role": "user", "content": user_message})

    if not user_message:
        fallback = fallback_studio_chat_reply(draft)
        return jsonify(fallback), 400

    system_prompt = (
        "你是AI应用创造控制台的产品顾问。请用自然、不死板的中文和用户沟通，"
        "逐步挖掘真实需求，必要时追问关键细节。避免机械问答。"
        "本轮重点是给出有帮助的下一步建议，并保持对话友好。"
    )
    context_prompt = (
        "当前需求草稿："
        f"{json.dumps(draft, ensure_ascii=False)}"
        "。请在对话中逐步补全该草稿。"
    )
    chat_messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": context_prompt}]
    chat_messages.extend(normalized_history)

    def generate():
        logs = []
        assistant_text = ""

        def emit(payload):
            return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

        logs.append("访谈已开始，正在连接大模型。")
        yield emit({"type": "log", "message": logs[-1]})

        try:
            for chunk in ai_service.stream_chat(chat_messages, enable_search=False, thinking_mode="deep_thinking"):
                ctype = chunk.get("type")
                if ctype == "reasoning":
                    reasoning = chunk.get("content", "")
                    if reasoning:
                        yield emit({"type": "reasoning", "content": reasoning})
                elif ctype == "content":
                    content = chunk.get("content", "")
                    if content:
                        assistant_text += content
                        yield emit({"type": "chunk", "content": content})
                elif ctype == "error":
                    error_msg = chunk.get("content", "模型暂时不可用")
                    logs.append(f"模型错误：{error_msg}")
                    yield emit({"type": "log", "message": logs[-1], "level": "error"})
                    fallback = fallback_studio_chat_reply(draft)
                    yield emit({
                        "type": "final",
                        "reply": fallback["reply"],
                        "requirement_update": fallback["requirement_update"],
                        "ready": fallback["ready"],
                        "missing_fields": fallback["missing_fields"]
                    })
                    yield emit({"type": "done"})
                    return

            if not assistant_text.strip():
                fallback = fallback_studio_chat_reply(draft)
                assistant_text = fallback["reply"]
                yield emit({"type": "chunk", "content": assistant_text})

            logs.append("对话回复完成，正在提炼需求结构。")
            yield emit({"type": "log", "message": logs[-1]})

            update = extract_requirement_from_dialog(assistant_text, draft)
            missing_fields = [
                field for field in ["learning_topic", "learning_goal", "target_audience", "interaction_style"]
                if not update.get(field)
            ]
            ready = len(missing_fields) == 0

            logs.append("需求结构提炼完成。")
            yield emit({"type": "log", "message": logs[-1]})
            yield emit({
                "type": "final",
                "reply": assistant_text,
                "requirement_update": update,
                "ready": ready,
                "missing_fields": missing_fields
            })
            yield emit({"type": "done"})
        except Exception as e:
            fallback = fallback_studio_chat_reply(draft)
            yield emit({"type": "log", "message": f"流式访谈异常：{str(e)}", "level": "error"})
            yield emit({
                "type": "final",
                "reply": fallback["reply"],
                "requirement_update": fallback["requirement_update"],
                "ready": fallback["ready"],
                "missing_fields": fallback["missing_fields"]
            })
            yield emit({"type": "done"})

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/api/user/social-profile', methods=['GET', 'POST'])
@require_login()
def user_social_profile():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        bio = (data.get("bio") or "").strip()
        skills = (data.get("skills") or "").strip()
        allow_collab = 1 if bool(data.get("allow_collab", True)) else 0
        conn.execute(
            """
            INSERT INTO social_profiles(user_id, bio, skills, allow_collab, followers, following)
            VALUES (?, ?, ?, ?, 0, 0)
            ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio, skills=excluded.skills, allow_collab=excluded.allow_collab
            """,
            (session["user_id"], bio, skills, allow_collab)
        )
        conn.commit()
    row = conn.execute(
        """
        SELECT bio, skills, allow_collab, followers, following
        FROM social_profiles WHERE user_id = ?
        """,
        (session["user_id"],)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"bio": "", "skills": "", "allow_collab": True, "followers": 0, "following": 0})
    result = dict(row)
    result["allow_collab"] = bool(result["allow_collab"])
    return jsonify(result)

@app.route('/api/learning-quest/bootstrap', methods=['GET'])
def learning_quest_bootstrap():
    resources = [
        {
            "title": item.get("title", ""),
            "category": item.get("category", ""),
            "type": item.get("type", "")
        }
        for item in DISCOVERY_CONTENT[:6]
    ]
    return jsonify({
        "focus_topics": [item["name"] for item in SOCIAL_DATA.get("topics", [])[:4]],
        "knowledge_folders": [item["name"] for item in KNOWLEDGE_BASE_DATA.get("folders", [])],
        "resource_pool": resources,
        "style_presets": ["考试冲刺", "项目实战", "跨学科探索", "课堂备课"]
    })

@app.route('/api/learning-quest/plan', methods=['POST'])
def learning_quest_plan():
    data = request.get_json(silent=True) or {}
    goal = (data.get('goal') or '').strip()
    style = (data.get('style') or '考试冲刺').strip()
    try:
        days = int(data.get('days') or 7)
    except (TypeError, ValueError):
        days = 7
    if not goal:
        return jsonify({"error": "目标不能为空"}), 400

    days = max(3, min(days, 30))
    stage_names = ["破冰定位", "主线攻坚", "输出固化"]
    stage_days_list = [max(1, round(days * 0.25)), max(1, round(days * 0.55)), max(1, days - round(days * 0.25) - round(days * 0.55))]
    stage_days_list[2] += days - sum(stage_days_list)
    quests = []
    pool = DISCOVERY_CONTENT if DISCOVERY_CONTENT else []
    qid = 1
    for idx, stage in enumerate(stage_names):
        stage_days = max(1, stage_days_list[idx])
        base_minutes = 35 + idx * 10
        for day in range(stage_days):
            pick = pool[(qid - 1) % len(pool)] if pool else {}
            quests.append({
                "id": f"quest-{qid}",
                "stage": stage,
                "day": day + 1,
                "title": f"{stage} · 任务 {day + 1}",
                "objective": f"围绕“{goal}”完成 {style} 学习动作并产出可复述结论。",
                "minutes": base_minutes + random.randint(0, 15),
                "resource_hint": pick.get("title", "使用知识库与超级搜索补充资料")
            })
            qid += 1

    strategy_prompt = (
        f"你是一名学习教练。请为学习目标“{goal}”设计{days}天{style}闯关学习策略，"
        "输出三段内容：1) 策略总纲 2) 每日执行节奏 3) 常见卡点与解法。"
        "要求中文、条理清晰、实操导向。"
    )
    ai_strategy = collect_ai_text(strategy_prompt, enable_search=False, thinking_mode="balanced")
    return jsonify({
        "goal": goal,
        "days": days,
        "style": style,
        "quests": quests,
        "ai_strategy": ai_strategy
    })

@app.route('/api/learning-quest/coach', methods=['POST'])
def learning_quest_coach():
    data = request.get_json(silent=True) or {}
    goal = (data.get('goal') or '').strip()
    current_task = (data.get('current_task') or '').strip()
    question = (data.get('question') or '').strip()
    try:
        progress = int(data.get('progress') or 0)
    except (TypeError, ValueError):
        progress = 0
    if not question:
        return jsonify({"error": "问题不能为空"}), 400

    coach_prompt = (
        f"学习目标：{goal or '未填写'}。当前任务：{current_task or '未指定'}。"
        f"当前进度：{progress}%。用户问题：{question}。"
        "请给出结构化指导：先一句鼓励，再给三个可执行步骤，最后给一个5分钟内可完成的小动作。"
    )
    result = collect_ai_text(coach_prompt, enable_search=False, thinking_mode="balanced")
    return jsonify({"result": result})

@app.route('/api/learning-quest/review', methods=['POST'])
def learning_quest_review():
    data = request.get_json(silent=True) or {}
    goal = (data.get('goal') or '').strip()
    try:
        completed = int(data.get('completed') or 0)
    except (TypeError, ValueError):
        completed = 0
    try:
        total = int(data.get('total') or 0)
    except (TypeError, ValueError):
        total = 0
    notes = (data.get('notes') or '').strip()
    blockers = (data.get('blockers') or '').strip()
    review_prompt = (
        f"学习目标：{goal or '未填写'}。已完成任务：{completed}/{total}。"
        f"学习记录：{notes or '无'}。遇到困难：{blockers or '无'}。"
        "请生成复盘：1) 今天最关键收获 2) 明天优先任务Top3 3) 风险提醒。"
    )
    review = collect_ai_text(review_prompt, enable_search=False, thinking_mode="balanced")
    return jsonify({"review": review})

@app.route('/api/memory-lab/bootstrap', methods=['GET'])
def memory_lab_bootstrap():
    return jsonify({
        "hot_topics": [item["name"] for item in SOCIAL_DATA.get("topics", [])[:4]],
        "materials": [
            {
                "title": item.get("title", ""),
                "type": item.get("type", ""),
                "category": item.get("category", "")
            }
            for item in LEARNING_MATERIALS[:5]
        ],
        "review_modes": ["极速抢救", "稳态巩固", "冲刺考试"],
        "difficulty_levels": ["基础", "进阶", "挑战"]
    })

@app.route('/api/memory-lab/deck', methods=['POST'])
def memory_lab_deck():
    data = request.get_json(silent=True) or {}
    topic = (data.get('topic') or '').strip()
    mode = (data.get('mode') or '稳态巩固').strip()
    difficulty = (data.get('difficulty') or '进阶').strip()
    try:
        count = int(data.get('count') or 8)
    except (TypeError, ValueError):
        count = 8

    if not topic:
        return jsonify({"error": "主题不能为空"}), 400

    count = max(5, min(count, 18))
    stems = [
        "核心概念定义", "关键机制", "典型误区", "应用场景",
        "对比辨析", "步骤流程", "常见考点", "类比记忆"
    ]
    materials = LEARNING_MATERIALS if LEARNING_MATERIALS else []
    deck = []
    for idx in range(count):
        stem = stems[idx % len(stems)]
        ref = materials[idx % len(materials)] if materials else {}
        deck.append({
            "id": f"card-{idx+1}",
            "question": f"【{topic}】的“{stem}”是什么？请在 40 秒内口述要点。",
            "answer": f"{topic} 的 {stem} 可以从“定义-机制-例子-边界”四步组织。建议结合 {ref.get('title', '你的课堂笔记')} 做1个真实案例复述。",
            "hint": f"关联资源：{ref.get('title', '知识库文档')} · 难度：{difficulty}",
            "difficulty": difficulty
        })

    strategy_prompt = (
        f"你是一名记忆教练。请为主题“{topic}”在“{mode}”模式下输出复习策略。"
        "要求包含：1) 每轮复习节奏 2) 回忆失败补救动作 3) 睡前5分钟复盘模板。"
    )
    strategy = collect_ai_text(strategy_prompt, enable_search=False, thinking_mode="balanced")
    return jsonify({
        "topic": topic,
        "mode": mode,
        "difficulty": difficulty,
        "cards": deck,
        "strategy": strategy
    })

@app.route('/api/memory-lab/coach', methods=['POST'])
def memory_lab_coach():
    data = request.get_json(silent=True) or {}
    topic = (data.get('topic') or '').strip()
    question = (data.get('question') or '').strip()
    answer = (data.get('answer') or '').strip()
    level = (data.get('level') or '模糊').strip()
    if not question:
        return jsonify({"error": "题干不能为空"}), 400

    coach_prompt = (
        f"主题：{topic or '未填写'}。题目：{question}。用户回忆答案：{answer or '未填写'}。"
        f"自评结果：{level}。请输出：1) 关键纠偏 2) 一句话记忆钩子 3) 下次复习间隔建议。"
    )
    feedback = collect_ai_text(coach_prompt, enable_search=False, thinking_mode="balanced")
    interval_map = {"忘记": "10 分钟后", "模糊": "8 小时后", "记住": "2 天后"}
    return jsonify({
        "feedback": feedback,
        "next_review": interval_map.get(level, "8 小时后")
    })

@app.route('/api/memory-lab/summary', methods=['POST'])
def memory_lab_summary():
    data = request.get_json(silent=True) or {}
    topic = (data.get('topic') or '').strip()
    records = data.get('records') or []
    if not isinstance(records, list):
        records = []
    done = len(records)
    weak_count = sum(1 for item in records if item.get('level') in ['忘记', '模糊'])
    summary_prompt = (
        f"主题：{topic or '未填写'}。本轮训练卡片数：{done}。薄弱卡片数：{weak_count}。"
        "请输出：1) 今日记忆画像 2) 明日复习顺序 3) 3条行动建议。"
    )
    report = collect_ai_text(summary_prompt, enable_search=False, thinking_mode="balanced")
    return jsonify({
        "report": report,
        "stats": {
            "total": done,
            "weak": weak_count,
            "mastered": max(0, done - weak_count)
        }
    })

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    return jsonify(ANALYTICS_DATA)

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'POST':
        payload = request.get_json(silent=True) or {}
        notifications = payload.get("notifications") or {}
        SETTINGS_DATA["notifications"]["email_digest"] = bool(notifications.get("email_digest", SETTINGS_DATA["notifications"]["email_digest"]))
        SETTINGS_DATA["notifications"]["new_course_alert"] = bool(notifications.get("new_course_alert", SETTINGS_DATA["notifications"]["new_course_alert"]))

        ai_payload = payload.get("ai") or {}
        api_key = ai_payload.get("api_key")
        if api_key is not None:
            cleaned_key = str(api_key).strip()
            set_app_setting("zhipu_api_key", cleaned_key)
            apply_runtime_api_key(cleaned_key)

        current_key = get_app_setting("zhipu_api_key", os.getenv("ZHIPUAI_API_KEY") or os.getenv("ZAI_API_KEY") or "")
        SETTINGS_DATA["ai"]["has_api_key"] = bool(current_key)
        SETTINGS_DATA["ai"]["api_key_masked"] = mask_api_key(current_key)
        return jsonify({
            "status": "success",
            "message": "设置已更新",
            "settings": SETTINGS_DATA
        })

    current_key = get_app_setting("zhipu_api_key", os.getenv("ZHIPUAI_API_KEY") or os.getenv("ZAI_API_KEY") or "")
    settings_data = json.loads(json.dumps(SETTINGS_DATA))
    settings_data["ai"]["has_api_key"] = bool(current_key)
    settings_data["ai"]["api_key_masked"] = mask_api_key(current_key)
    return jsonify(settings_data)

@app.route('/api/user/profile', methods=['GET'])
def user_profile():
    user = get_current_user()
    if not user:
        return jsonify({
            "username": "Guest",
            "avatar": "https://ui-avatars.com/api/?name=Guest&background=64748b&color=fff",
            "role": "visitor"
        })
    return jsonify({
        "username": user["display_name"],
        "avatar": f"https://ui-avatars.com/api/?name={user['display_name']}&background=0D8ABC&color=fff",
        "role": user["role"]
    })

@app.route('/test/mermaid')
def test_mermaid():
    # Serve the test HTML file
    try:
        with open('tests/test_mermaid.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return "Test file not found", 404

@app.route('/api/journal/stream', methods=['POST'])
def journal_stream():
    data = request.json
    user_message = data.get('message', '')
    
    def generate():
        for chunk_data in journal_service.generate_journal_layout(user_message):
            yield f"data: {json.dumps(chunk_data)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/api/journal/image', methods=['POST'])
def journal_image():
    data = request.json
    prompt = data.get('prompt', '')
    image_source = data.get('image_source', 'generation')
    search_keyword = data.get('search_keyword', '')
    
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
        
    result = journal_service.generate_image(prompt, source_preference=image_source, search_keyword=search_keyword)
    if result:
        # result is now a dict {'url': '...', 'source': '...', 'source_url': '...'}
        return jsonify(result)
    else:
        return jsonify({"error": "Image generation failed"}), 500

@app.route('/api/mindmapnode/upload', methods=['POST'])
def api_mindmapnode_upload():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # 保存到uploads文件夹以便后续预览
    source_id = f"source_{secrets.token_hex(8)}"
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file.filename)
    unique_filename = f"{source_id}_{safe_filename}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file_url = f"/static/uploads/{unique_filename}"
    
    try:
        file.save(save_path)
        # 调用解析
        result = glm5_agent.parse_document_sync(save_path)
        # 从结果中提取文本 (prime-sync 结果可能在不同字段中)
        text_content = ""
        # 如果返回的是纯文本
        if isinstance(result, str):
            text_content = result
        # 如果返回的是结构化数据
        elif isinstance(result, dict) and "data" in result:
            # 根据 prime-sync 返回格式，有时是 markdown 链接或直接文本
            if "content" in result["data"]:
                text_content = result["data"]["content"]
            else:
                text_content = json.dumps(result["data"], ensure_ascii=False)
        else:
            text_content = json.dumps(result, ensure_ascii=False)
            
        glm5_agent.add_document(source_id, file.filename, text_content)
        
        return jsonify({
            "status": "success", 
            "message": "File parsed and added to context", 
            "filename": file.filename,
            "source_id": source_id,
            "file_url": file_url,
            "content": text_content
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/delete_source', methods=['POST'])
def api_mindmapnode_delete_source():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json()
    if not data or 'source_id' not in data:
        return jsonify({"error": "No source_id provided"}), 400
        
    source_id = data['source_id']
    success = glm5_agent.remove_document(source_id)
    if success:
        return jsonify({"status": "success", "message": "Source removed"})
    else:
        return jsonify({"error": "Source not found"}), 404

@app.route('/api/mindmapnode/chat', methods=['POST'])
def api_mindmapnode_chat():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
        
    user_message = data['message']
    
    def generate():
        try:
            for chunk in glm5_agent.chat_stream(user_message, enable_web_search=True):
                if chunk:
                    # SSE 格式
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
            
    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route('/api/mindmapnode/report_chat', methods=['POST'])
def api_mindmapnode_report_chat():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
        
    user_message = data['message']
    is_first = data.get('is_first', False)
    
    def generate():
        try:
            for chunk in glm5_agent.report_chat_stream(user_message, is_first=is_first):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
            
    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route('/api/mindmapnode/generate_image', methods=['POST'])
def api_mindmapnode_generate_image():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    if not data or 'prompt' not in data:
        return jsonify({"error": "No prompt provided"}), 400
        
    prompt = data['prompt']
    try:
        mode = (data.get('mode') or 'ai').lower().strip()
        if mode == 'wiki':
            def _wiki_search_thumb(query: str):
                try:
                    s = requests.get(
                        "https://zh.wikipedia.org/w/api.php",
                        params={
                            "action": "query",
                            "list": "search",
                            "srsearch": query,
                            "format": "json"
                        },
                        timeout=10
                    )
                    s.raise_for_status()
                    s_data = s.json() or {}
                    hits = (s_data.get("query") or {}).get("search") or []
                    if not hits:
                        return None
                    title = hits[0].get("title")
                    if not title:
                        return None
                    p = requests.get(
                        "https://zh.wikipedia.org/w/api.php",
                        params={
                            "action": "query",
                            "prop": "pageimages",
                            "piprop": "thumbnail",
                            "pithumbsize": 900,
                            "titles": title,
                            "format": "json"
                        },
                        timeout=10
                    )
                    p.raise_for_status()
                    p_data = p.json() or {}
                    pages = (p_data.get("query") or {}).get("pages") or {}
                    for _, page in pages.items():
                        thumb = (page or {}).get("thumbnail") or {}
                        src = thumb.get("source")
                        if src:
                            return src
                    return None
                except Exception:
                    return None

            url = _wiki_search_thumb(prompt)
            if url:
                return jsonify({"status": "success", "image_url": url, "source": "wiki"})
            return jsonify({"error": "No suitable image found from Wikipedia"}), 404

        url = glm5_agent.generate_image(prompt)
        if url:
            return jsonify({"status": "success", "image_url": url, "source": "ai"})
        return jsonify({"error": "Failed to generate image"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/proxy_image', methods=['GET', 'POST'])
def proxy_image():
    if request.method == 'POST':
        # This acts as a wrapper around generate_image but returning the format mindmapnode.js expects
        data = request.get_json() or {}
        prompt = data.get('prompt')
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400
        try:
            url = glm5_agent.generate_image(prompt)
            if url:
                return jsonify({"status": "success", "image_url": url})
            else:
                return jsonify({"status": "error", "error": "Failed to generate image"})
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)})

    # Original GET logic for proxying existing URLs
    url = request.args.get('url')
    if not url:
        return "No URL", 400
    try:
        resp = requests.get(url, stream=True)
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                   if name.lower() not in excluded_headers]
        return Response(resp.content, resp.status_code, headers)
    except Exception as e:
        return str(e), 500

@app.route('/api/mindmapnode/explain_concept', methods=['POST'])
def api_mindmapnode_explain_concept():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json()
    if not data or 'concept' not in data:
        return jsonify({"error": "No concept provided"}), 400
        
    concept = data['concept']
    
    def generate():
        try:
            for chunk in glm5_agent.concept_explain_stream(concept):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
            
    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route('/api/mindmapnode/web_search', methods=['POST'])
def api_mindmapnode_web_search():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    query = data.get('query', '')
    
    if not query:
        return jsonify({"error": "No search query provided"}), 400
        
    try:
        search_result = glm5_agent.search_web(query)
        return jsonify({"status": "success", "data": search_result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/sync_web_search_to_agent', methods=['POST'])
def api_mindmapnode_sync_web_search_to_agent():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    source_id = data.get('source_id')
    title = data.get('title')
    content = data.get('content')
    
    if not source_id or not content:
        return jsonify({"error": "Missing parameters"}), 400
        
    try:
        glm5_agent.add_document(source_id, title, content)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/generate_textbook', methods=['GET', 'POST'])
def api_mindmapnode_generate_textbook():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500

    config = request.get_json(silent=True) or {}
    return Response(stream_with_context(glm5_agent.generate_textbook_stream(config=config)), content_type='text/event-stream')

@app.route('/api/mindmapnode/infinity_city/generate', methods=['POST'])
def api_mindmapnode_infinity_city_generate():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500

    data = request.get_json() or {}
    try:
        result = glm5_agent.generate_infinity_city_scene(data)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/infinity_city/zoom', methods=['POST'])
def api_mindmapnode_infinity_city_zoom():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500

    data = request.get_json() or {}
    try:
        result = glm5_agent.generate_infinity_city_zoom(data)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/generate_mindmap', methods=['POST'])
def api_mindmapnode_generate_mindmap():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    try:
        mindmap_data = glm5_agent.generate_mindmap()
        return jsonify({"status": "success", "data": mindmap_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/generate_flashcards', methods=['POST'])
def api_mindmapnode_generate_flashcards():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    count = data.get('count', 5)
    difficulty = data.get('difficulty', 'medium')
    extra = data.get('extra', '')
    
    try:
        flashcards_data = glm5_agent.generate_flashcards(count, difficulty, extra)
        return jsonify({"status": "success", "data": flashcards_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/generate_quiz', methods=['POST'])
def api_mindmapnode_generate_quiz():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    try:
        quiz_data = glm5_agent.generate_quiz(
            single_count=int(data.get('single_count', 2)),
            multi_count=int(data.get('multi_count', 1)),
            fill_count=int(data.get('fill_count', 1)),
            essay_count=int(data.get('essay_count', 1))
        )
        return jsonify({"status": "success", "data": quiz_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/quiz_qa', methods=['POST'])
def api_mindmapnode_quiz_qa():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
        
    question = data.get('question', '')
    analysis = data.get('analysis', '')
    user_query = data.get('query', '')
    
    def generate():
        try:
            for chunk in glm5_agent.quiz_qa_stream(question, analysis, user_query):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
            
    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route('/api/mindmapnode/init_discussion', methods=['POST'])
def api_mindmapnode_init_discussion():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    count = int(data.get('count', 3))
    
    try:
        agents = glm5_agent.init_discussion_agents(count)
        return jsonify({"status": "success", "data": agents})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/discussion_chat', methods=['POST'])
def api_mindmapnode_discussion_chat():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    message = data.get('message', '')
    is_trigger = data.get('is_trigger', False)
    trigger_agent_name = data.get('trigger_agent_name', None)
    
    try:
        msgs = glm5_agent.discussion_chat(message, is_trigger, trigger_agent_name)
        
        # 处理表情包生成标签 <img prompt="...">
        import re
        for msg in msgs:
            content = msg['content']
            img_match = re.search(r'<img\s+prompt="([^"]+)">', content)
            if img_match:
                prompt = img_match.group(1)
                img_url = glm5_agent.generate_discussion_image(prompt)
                if img_url:
                    content = content.replace(img_match.group(0), f'<br><img src="{img_url}" style="max-width: 200px; border-radius: 12px; margin-top: 0.5rem;">')
                else:
                    content = content.replace(img_match.group(0), '')
            msg['content'] = content
            
        return jsonify({"status": "success", "data": msgs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/generate_classroom', methods=['POST'])
def api_mindmapnode_generate_classroom():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    topic = data.get('topic', '')
    style = data.get('style', 'professional')
    
    try:
        lesson_data = glm5_agent.generate_classroom_lesson(topic, style)
        
        # 不再在此处一次性生成语音，而是让前端在播放时按需调用单句生成接口
        for slide in lesson_data.get('slides', []):
            slide['audio_url'] = None
                
        return jsonify({"status": "success", "data": lesson_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/generate_audio', methods=['POST'])
def api_mindmapnode_generate_audio():
    if not glm5_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json() or {}
    text = data.get('text', '')
    
    try:
        audio_url = glm5_agent.generate_speech_audio(text)
        return jsonify({"status": "success", "audio_url": audio_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmapnode/save_note', methods=['POST'])
@require_login()
def api_mindmapnode_save_note():
    data = request.get_json() or {}
    
    sources = data.get("sources", [])
    chat_history = data.get("chatHistory", "")
    
    # 动态生成标题
    title = "StudioCopilot 学习笔记"
    if sources and isinstance(sources, list) and len(sources) > 0:
        first_source_title = sources[0].get('title', '')
        if first_source_title:
            title = f"笔记: {first_source_title}"
            
    summary = "包含文档解析结果与AI互动生成内容的专属学习笔记"
    
    payload = {
        "sources": sources,
        "chatHistory": chat_history,
        "htmlSnapshot": data.get("htmlSnapshot", ""),
        "source_type": "studiocopilot_note"
    }
    
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO knowledge_items(
                user_id, content_type, title, summary, cover_image, source_url, payload_json, visibility, created_at, updated_at
            )
            VALUES (?, 'note', ?, ?, '', '', ?, 'private', ?, ?)
            """,
            (
                session["user_id"], title, summary,
                json.dumps(payload, ensure_ascii=False), now, now
            )
        )
        item_id = cur.lastrowid
        conn.commit()
        return jsonify({"status": "success", "item_id": item_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

from leetcode_service import leetcode_bp
app.register_blueprint(leetcode_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
