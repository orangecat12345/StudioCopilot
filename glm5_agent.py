# glm5_agent.py
import os
import json
import requests
from typing import Generator, List, Dict, Any
from zhipuai import ZhipuAI

class MissingZhipuClient:
    def __getattr__(self, _name):
        return self

    def __call__(self, *args, **kwargs):
        raise ValueError("当前尚未配置智谱 API Key。请先进入“设置”页面填写 API Key。")

class GLM5Agent:
    def __init__(self, api_key: str = None):
        """
        初始化 GLM-5 智能体。
        包含记忆管理和与智谱大模型的交互配置。
        
        :param api_key: 智谱 API Key，如果不提供则从环境变量 ZHIPUAI_API_KEY 或 ZAI_API_KEY 中获取
        """
        self.api_key = (api_key or os.getenv("ZHIPUAI_API_KEY") or os.getenv("ZAI_API_KEY") or "").strip() or None
        
        # 实例化原生 ZhipuAI 客户端
        self.client = ZhipuAI(api_key=self.api_key) if self.api_key else MissingZhipuClient()
        
        # 注意：这里使用 "glm-4-plus" 作为占位，如果后续上线了确切的 "glm-5" 模型字符串，只需在这里修改即可。
        self.model_name = "glm-4-plus"
        
        # 记忆管理：保存对话历史 (原生长列表方式，更稳健)
        self.memory = []
        self.report_memory = []
        
        # 知识库：保存解析后的文档内容，作为背景知识传给 AI
        self.document_context = {}

    def set_api_key(self, api_key: str | None):
        self.api_key = (api_key or "").strip() or None
        self.client = ZhipuAI(api_key=self.api_key) if self.api_key else MissingZhipuClient()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def add_document(self, source_id: str, filename: str, content: str) -> bool:
        """
        将解析后的文档内容传给 AI，作为后续回答的上下文。
        
        :param source_id: 唯一来源ID
        :param filename: 文档名称
        :param content: 解析出的纯文本内容
        :return: 是否添加成功
        """
        doc_info = f"【文档名称】: {filename}\n【文档内容】:\n{content}\n"
        self.document_context[source_id] = doc_info
        return True

    def remove_document(self, source_id: str) -> bool:
        """
        删除指定的文档上下文
        """
        if source_id in self.document_context:
            del self.document_context[source_id]
            return True
        return False

    def clear_documents(self):
        """
        清空当前会话的文档上下文。
        """
        self.document_context = {}

    def clear_memory(self):
        """
        清空对话记忆。
        """
        self.memory = []

    def get_system_prompt(self) -> str:
        """
        构建系统提示词，包含角色设定和上传的文档内容。
        """
        base_prompt = (
            "你是 MindMapNode 工作室的智能助手，由 GLM-5 驱动。你的目标是作为用户专属的思维助理，"
            "利用你的多模态分析能力、逻辑推理能力和联网检索能力，为用户提供准确、详尽且有洞察力的回答。\n"
        )
        
        if self.document_context:
            base_prompt += "\n以下是用户上传的文档解析内容，请将其作为背景知识参考：\n"
            base_prompt += "\n---\n".join(self.document_context.values())
            base_prompt += "\n---\n请务必结合上述文档内容来回答用户的问题。如果问题与文档无关，请正常回答。"
            
        return base_prompt

    def chat_stream(self, user_input: str, enable_web_search: bool = True) -> Generator[str, None, None]:
        """
        与用户进行流式交互，并支持智谱内置的联网搜索功能（Web Search in Chat）。
        
        :param user_input: 用户当前的提问
        :param enable_web_search: 是否开启智谱原生的联网搜索工具
        :return: 生成器，返回流式的字符串响应
        """
        # 构建消息列表
        messages = [{"role": "system", "content": self.get_system_prompt()}]
        
        # 加载历史记忆
        messages.extend(self.memory)
                    
        # 加入当前用户的输入
        messages.append({"role": "user", "content": user_input})
        
        # 构建请求参数
        kwargs = {
            "model": self.model_name,
            "messages": messages,
            "stream": True,
            "temperature": 0.5
        }
        
        # 如果需要开启联网搜索
        if enable_web_search:
            kwargs["tools"] = [{
                "type": "web_search",
                "web_search": {
                    "enable": True,
                    "search_engine": "search_pro", # 使用高级版自研引擎
                    "search_result": True
                }
            }]
        
        response_content = ""
        try:
            response = self.client.chat.completions.create(**kwargs)
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    response_content += content
                    yield content
        except Exception as e:
            error_msg = f"\n[大模型请求发生错误: {str(e)}]"
            response_content += error_msg
            yield error_msg
            
        # 将本次对话存入记忆
        self.memory.append({"role": "user", "content": user_input})
        self.memory.append({"role": "assistant", "content": response_content})
        
        # 防止记忆过长，保留最近 30 轮对话 (60条消息)
        if len(self.memory) > 60:
            self.memory = self.memory[-60:]

    def report_chat_stream(self, user_input: str, is_first: bool = False) -> Generator[str, None, None]:
        """
        用于研究报告工作流的流式生成，维护独立的 report_memory
        """
        if is_first:
            self.report_memory = []
            sys_prompt = (
                "你是一个专业的研究报告生成器。请根据用户上传的文档，生成一份详尽的、排版精美的 HTML 研究报告。"
                "要求：\n"
                "1. 直接输出合法的 HTML 标签，如 <h1>, <h2>, <p>, <ul>, <table> 等，不要输出 ```html 代码块的包裹。也不要输出任何外层的 <html>, <body>, 或根级别的 <div style='...'> 容器底色，只需输出纯粹的内容标签。\n"
                "2. 标签内部可以适当使用内联 CSS 样式以保证美观，例如标题可以有底边框，重点文字有颜色，表格有斑马线等。请利用 HTML 的优势，设计引言卡片、重点引用区块（blockquote）、并列对比卡片等现代排版结构来提升阅读和学习体验。\n"
                "3. 报告应当详实、结构清晰，尽量生成完整的长篇内容，不要自己截断。**不要完全照搬原文**，你需要对内容进行提炼、重组，突出核心观点，用可视化的排版结构（如知识卡片、高亮文本、数据表格等）来呈现。\n"
                "4. 为了增加交互性，请在报告的**大量**关键概念、专有名词或重要论点上，使用具有可点击样式的 <span> 标签包裹它们，并加上类名 `concept-link`，例如：`<span class=\"concept-link\">深度学习</span>`。这样用户点击后可以获取该概念的详细解释。请尽可能多地标记出值得钻研的概念，不要吝啬。\n"
                "5. 如果用户有新的补充需求，请在你的上下文中理解，并直接输出**补充的 HTML 内容**（可以作为一个新的章节或段落），不要输出寒暄语。请保持和之前一样的 HTML 结构风格，不要重新生成整个页面的骨架。\n"
                #"6. 【重要】你可以在报告中适当加入AI配图以丰富视觉体验。如果你认为某段内容需要配图，请直接在 HTML 中插入自定义标签：<ai-image prompt=\"这里写详细的画面描述提示词，要求生成横版 16:9 比例的图片，例如：一张商业海报，展现...\"></ai-image>。前端会自动解析该标签并调用绘图大模型生成图片，你只需提供 prompt 即可。**注意：如果原文上下文中已经包含了图片的 URL（例如 markdown 格式的图片链接），请优先直接使用 `<img>` 标签展示原文图片，而不是生成新的 AI 图片。**"
            )
            if self.document_context:
                sys_prompt += "\n以下是用户提供的文档内容：\n" + "\n---\n".join(self.document_context.values())
            self.report_memory.append({"role": "system", "content": sys_prompt})
            
        self.report_memory.append({"role": "user", "content": user_input})
        
        kwargs = {
            "model": self.model_name,
            "messages": self.report_memory,
            "stream": True,
            "temperature": 0.5,
            "max_tokens": 8192
        }
        
        response_content = ""
        try:
            response = self.client.chat.completions.create(**kwargs)
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    response_content += content
                    yield content
        except Exception as e:
            error_msg = f"<div style='color:red; padding: 1rem; border: 1px solid red; margin-top: 1rem;'>[生成发生错误: {str(e)}]</div>"
            response_content += error_msg
            yield error_msg
            
        self.report_memory.append({"role": "assistant", "content": response_content})
        
        if len(self.report_memory) > 30:
            # 保留 system prompt 和最近的对话
            self.report_memory = [self.report_memory[0]] + self.report_memory[-29:]

    def generate_image(self, prompt: str, model: str = "cogview-3-plus", size: str = None) -> str:
        """
        调用 GLM-Image 模型生成图片。
        """
        try:
            kwargs = {
                "model": model,
                "prompt": prompt
            }
            if size:
                kwargs["size"] = size
            response = self.client.images.generations(**kwargs)
            if response and response.data and len(response.data) > 0:
                return response.data[0].url
            return ""
        except Exception as e:
            print(f"Image generation failed: {e}")
            return ""

    def _get_document_context_excerpt(self, limit: int = 14000) -> str:
        if not self.document_context:
            return ""
        content = "\n---\n".join(self.document_context.values())
        return content[:limit]

    def _parse_json_content(self, content: str) -> Dict[str, Any]:
        raw = (content or "").strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        try:
            return json.loads(raw)
        except Exception:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(raw[start:end + 1])
            raise

    def generate_infinity_city_scene(self, config: Dict[str, Any]) -> Dict[str, Any]:
        topic = (config.get("topic") or "").strip()
        metaphor = (config.get("metaphor") or "auto").strip()
        visual_style = (config.get("visual_style") or "cinematic").strip()
        size = (config.get("size") or "1280x1280").strip()
        extra = (config.get("extra") or "").strip()

        context_excerpt = self._get_document_context_excerpt()
        if not context_excerpt and not topic:
            raise ValueError("请先添加知识来源，或至少填写一个主题。")

        system_prompt = (
            "你是一个“知识世界架构师”。"
            "你的任务是把知识材料转化为一个可探索、可放大的视觉世界。"
            "这个世界可以是城市、城堡、地图、森林、微观世界或其他具有空间隐喻的结构。"
            "请根据材料提炼一个最适合探索和逐级放大的场景方案，并严格输出 JSON。"
        )
        user_prompt = (
            f"用户主题：{topic or '请从材料中自动提炼主题'}\n"
            f"场景隐喻偏好：{metaphor}\n"
            f"视觉风格：{visual_style}\n"
            f"附加要求：{extra or '无'}\n"
            f"材料摘录：\n{context_excerpt or '无材料，仅使用主题生成'}\n\n"
            "请返回 JSON，格式如下：\n"
            "{\n"
            '  "title": "这张知识场景图的标题",\n'
            '  "scene_brief": "对这个世界隐喻的简短解释",\n'
            '  "scene_prompt": "给 glm-image 的完整中文生图提示词，要求画面宏大、可点击探索、无UI按钮、无水印、尽量不要直接出现大段文字、适合继续局部放大，细节丰富且风格统一"\n'
            "}\n"
            "要求：\n"
            "1. 场景必须服务于知识理解，不只是好看。\n"
            "2. 需要天然适合后续点击某个局部继续放大，局部中仍然有很多层级结构。\n"
            "3. 如果主题是科学对象，例如细胞、地理系统、历史结构，要优先把真实结构和隐喻场景融合。\n"
            "4. 不要输出 markdown。"
        )

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6,
            max_tokens=1800,
            response_format={"type": "json_object"}
        )
        plan = self._parse_json_content(response.choices[0].message.content)
        scene_prompt = (plan.get("scene_prompt") or "").strip()
        if not scene_prompt:
            raise ValueError("无限城场景提示词生成失败。")

        image_url = self.generate_image(
            prompt=scene_prompt,
            model="glm-image",
            size=size
        )
        if not image_url:
            raise ValueError("无限城主场景生成失败。")

        return {
            "title": plan.get("title") or topic or "无限城",
            "scene_brief": plan.get("scene_brief") or "AI 已为当前知识材料构建可探索世界。",
            "image_url": image_url,
            "prompt": scene_prompt,
            "size": size,
            "topic": topic,
            "metaphor": metaphor,
            "visual_style": visual_style,
            "extra": extra
        }

    def generate_infinity_city_zoom(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        image_url = (payload.get("image_url") or "").strip()
        current_title = (payload.get("current_title") or "当前场景").strip()
        current_prompt = (payload.get("current_prompt") or "").strip()
        topic = (payload.get("topic") or "").strip()
        metaphor = (payload.get("metaphor") or "auto").strip()
        visual_style = (payload.get("visual_style") or "cinematic").strip()
        extra = (payload.get("extra") or "").strip()
        size = (payload.get("size") or "1280x1280").strip()
        depth = int(payload.get("depth") or 0)
        x = int(payload.get("x") or 0)
        y = int(payload.get("y") or 0)
        image_width = max(1, int(payload.get("image_width") or 1280))
        image_height = max(1, int(payload.get("image_height") or 1280))

        if not image_url:
            raise ValueError("缺少当前场景图片。")

        box_w = max(120, image_width // 5)
        box_h = max(120, image_height // 5)
        xmin = max(0, x - box_w // 2)
        ymin = max(0, y - box_h // 2)
        xmax = min(image_width, x + box_w // 2)
        ymax = min(image_height, y + box_h // 2)

        context_excerpt = self._get_document_context_excerpt(limit=8000)
        system_prompt = (
            "你是一个“知识视觉导航师”。"
            "用户正在浏览一张知识场景图，并点击了其中一个像素位置。"
            "你要分析用户点击区域最可能对应的知识对象/结构/机制，并为下一层更细节的放大图生成稳定一致的生图提示词。"
            "请严格输出 JSON。"
        )
        text_prompt = (
            f"全局主题：{topic or '从上下文中理解'}\n"
            f"当前层标题：{current_title}\n"
            f"当前层提示词：{current_prompt[:2500]}\n"
            f"场景隐喻：{metaphor}\n"
            f"视觉风格：{visual_style}\n"
            f"附加要求：{extra or '无'}\n"
            f"图片尺寸：{image_width}x{image_height}\n"
            f"用户点击像素：({x}, {y})\n"
            f"建议关注框：[[{xmin},{ymin},{xmax},{ymax}]]\n"
            f"当前层深度：{depth}\n"
            f"材料摘录：{context_excerpt or '无'}\n\n"
            "请返回 JSON：\n"
            "{\n"
            '  "region_title": "这个点最可能对应的区域标题",\n'
            '  "region_summary": "这个区域在当前知识世界中的意义",\n'
            '  "hotspot_label": "用于前端标注的小标签，尽量短",\n'
            '  "zoom_prompt": "给 glm-image 的完整中文生图提示词。必须强调：这是对当前图中该坐标区域的连续放大图；构图要像镜头向内深入；保留风格一致性；增加更多内部结构、纹理、部件、层级和空间线索；不要出现UI、边框、水印、大段文字"\n'
            "}\n"
            "要求：\n"
            "1. 结果必须和当前图保持世界观与风格连贯。\n"
            "2. 要像真正钻入这个点看到更深层细节，而不是重新画一张无关图片。\n"
            "3. 如果主题是科学结构，如细胞/器官/机器/地图，要尽可能贴近真实内部构造。\n"
            "4. 不要输出 markdown。"
        )

        response = self.client.chat.completions.create(
            model="glm-4.6v",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": text_prompt}
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=1800
        )

        plan = self._parse_json_content(response.choices[0].message.content)
        zoom_prompt = (plan.get("zoom_prompt") or "").strip()
        if not zoom_prompt:
            raise ValueError("无限城局部放大提示词生成失败。")

        image_url = self.generate_image(
            prompt=zoom_prompt,
            model="glm-image",
            size=size
        )
        if not image_url:
            raise ValueError("无限城局部放大图生成失败。")

        return {
            "title": plan.get("region_title") or f"{current_title} · 细节层",
            "summary": plan.get("region_summary") or "已生成该区域的细节放大图。",
            "hotspot_label": plan.get("hotspot_label") or "细节",
            "image_url": image_url,
            "prompt": zoom_prompt,
            "roi": {
                "x": x,
                "y": y,
                "image_width": image_width,
                "image_height": image_height,
                "bbox": [xmin, ymin, xmax, ymax]
            }
        }

    def concept_explain_stream(self, concept: str) -> Generator[str, None, None]:
        """
        专门用于解释报告中的核心概念，生成生动形象的 HTML 解释网页。
        """
        sys_prompt = (
            "你是一个专业且生动的知识科普专家。用户在阅读研究报告时点击了一个核心概念，请你结合上传的文档上下文，为这个概念生成一个独立、精美、生动形象的 HTML 解释卡片内容。"
            "要求：\n"
            "1. 直接输出合法的 HTML 标签，不要输出 ```html 代码块的包裹，也不要输出外层的 <html> 或 <body>。\n"
            "2. 使用内联 CSS 样式，设计成一个精美的科普卡片风格（例如带有淡色背景、圆角、大号标题、重点高亮等）。\n"
            "3. 解释要通俗易懂，最好能结合具体的例子或比喻。\n"
            "4. 适当使用 `<ai-image prompt=\"...\">` 标签生成一张 16:9 的科普插图帮助理解。"
        )
        if self.document_context:
            sys_prompt += "\n以下是相关的文档上下文：\n" + "\n---\n".join(self.document_context.values())
            
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"请详细解释概念：【{concept}】"}
        ]
        
        kwargs = {
            "model": self.model_name,
            "messages": messages,
            "stream": True,
            "temperature": 0.6,
            "max_tokens": 4096
        }
        
        try:
            response = self.client.chat.completions.create(**kwargs)
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"<div style='color:red;'>[解释生成错误: {str(e)}]</div>"

    def parse_document_sync(self, file_path: str) -> dict:
        """
        调用智谱同步解析接口(prime-sync)解析文档。
        此方法供后端在接收到文件时调用。
        
        :param file_path: 本地文件路径
        :return: 解析结果的文本
        """
        url = "https://open.bigmodel.cn/api/paas/v4/files/parser/sync"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # 提取文件扩展名并转大写
        ext = os.path.splitext(file_path)[1][1:].upper()
        if not ext:
            ext = "TXT" # 默认 fallback
            
        files = {
            "file": open(file_path, "rb")
        }
        data = {
            "tool_type": "prime-sync",
            "file_type": ext
        }
        
        response = requests.post(url, headers=headers, files=files, data=data)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"文档解析失败: HTTP {response.status_code} - {response.text}")

    def generate_mindmap(self) -> dict:
        """
        根据当前文档上下文生成思维导图数据结构。
        """
        if not self.document_context:
            raise ValueError("没有可用的文档内容来生成思维导图。请先添加来源。")
            
        system_prompt = (
            "你是一个专业的知识结构化分析器。请根据用户提供的所有文档内容，提取核心概念和层级关系，生成思维导图数据。\n"
            "请严格输出为 JSON 格式，结构如下：\n"
            "{\n"
            "  \"name\": \"中心主题\",\n"
            "  \"children\": [\n"
            "    {\n"
            "      \"name\": \"子主题1\",\n"
            "      \"keyword\": \"用于搜索的简短关键词\",\n"
            "      \"source_text\": \"提取自原文的一句具有代表性的话，用于帮助用户在原文中定位\",\n"
            "      \"children\": [ ... ]\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "要求：\n"
            "1. 只输出合法的 JSON，不要输出任何额外的 markdown 标记或解释说明。\n"
            "2. 提取最重要和最核心的信息，层级不要过深（建议3-4层）。\n"
            "3. 如果文档是PDF或长文本，务必在 source_text 字段保留最能体现该节点内容的原文原句。\n"
        )
        
        user_content = "\n---\n".join(self.document_context.values())
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请根据以下内容生成思维导图 JSON:\n{user_content}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.3,
                max_tokens=8192,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            # 移除可能存在的 markdown 代码块标记
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            return json.loads(content.strip())
        except Exception as e:
            raise Exception(f"生成思维导图失败: {str(e)}")

    def generate_textbook_stream(self, config=None):
        """
        基于上下文生成符合 BOPPPS 模型的沉浸式 AI 课本数据结构
        使用 SSE 流式返回进度和最终数据。
        """
        config = config or {}
        difficulty = (config.get("difficulty") or "medium").strip()
        style = (config.get("style") or "balanced").strip()
        image_mode = (config.get("image_mode") or "auto").strip()
        stream_chapters = bool(config.get("stream_chapters", True))
        extra = (config.get("extra") or "").strip()

        if not self.document_context:
            yield f"data: {json.dumps({'status': 'error', 'message': '没有可用的文档内容来生成课本。请先添加来源。'})}\n\n"
            return
            
        user_content = "\n---\n".join(self.document_context.values())
        
        # Step 1: 生成课本大纲
        yield f"data: {json.dumps({'status': 'progress', 'step': 'outline', 'message': '正在分析材料并规划课本大纲...'})}\n\n"
        
        outline_prompt = (
            "你是一位顶级的教育学专家和教材主编。请根据用户提供的资料，规划一份符合 BOPPPS 教学模型（引入、目标、前测、参与式学习、后测、总结）的课本大纲。\n"
            + f"讲解风格：{style}\n"
            + f"难度等级：{difficulty}\n"
            + ((f"其他要求：{extra}\n") if extra else "")
            + "严格输出为 JSON 格式，结构如下：\n"
            + "{\n"
            + "  \"title\": \"课本主标题\",\n"
            + "  \"chapters\": [\n"
            + "    {\n"
            + "      \"id\": \"唯一英文ID(如: ch1_hook)\",\n"
            + "      \"title\": \"章节标题(如: 1. 引入(Hook) - 免疫系统的危机)\",\n"
            + "      \"type\": \"BOPPPS环节名称(如: hook, objective, pre-assessment, participatory, post-assessment, summary)\",\n"
            + "      \"instruction\": \"这一章节需要详细写什么内容？请给出详细的写作指导和素材指引\"\n"
            + "    }\n"
            + "  ]\n"
            + "}\n"
            + "要求：必须完整覆盖 BOPPPS 的 6 个阶段。核心的'参与式学习(participatory)'必须拆分为 3 到 5 个子章节。"
        )
        
        try:
            print("正在生成课本大纲...")
            outline_response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": outline_prompt},
                    {"role": "user", "content": f"请基于以下材料规划BOPPPS课本大纲：\n{user_content}"}
                ],
                temperature=0.5,
                max_tokens=4096,
                response_format={"type": "json_object"}
            )
            outline_content = outline_response.choices[0].message.content.strip()
            if outline_content.startswith("```json"): outline_content = outline_content[7:]
            if outline_content.startswith("```"): outline_content = outline_content[3:]
            if outline_content.endswith("```"): outline_content = outline_content[:-3]
            outline_data = json.loads(outline_content.strip())
            
            yield f"data: {json.dumps({'status': 'progress', 'step': 'outline_done', 'outline': outline_data, 'message': '大纲规划完成，准备生成详细内容...'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': f'生成课本大纲失败: {str(e)}'})}\n\n"
            return

        # Step 2: 根据大纲逐个章节生成详细内容
        final_textbook = {
            "title": outline_data.get("title", "AI 沉浸式课本"),
            "chapters": []
        }
        
        chapter_prompt_template = (
            "你是一位顶级的教材撰写专家。现在正在编写《{textbook_title}》的其中一个章节。\n"
            + "章节标题：{chapter_title}\n"
            + "章节类型：{chapter_type}\n"
            + "写作指引：{chapter_instruction}\n"
            + f"讲解风格：{style}\n"
            + f"难度等级：{difficulty}\n"
            + ((f"其他要求：{extra}\n") if extra else "")
            + "\n请你根据上述指引和用户提供的长篇原始材料，撰写这个章节的极度详实的 HTML 内容正文。\n"
            + "严格输出为 JSON 格式，结构如下：\n"
            + "{{\n"
            + "  \"content\": \"章节的极其详实的 HTML 内容正文。对于'参与式学习'阶段，必须包含极其丰富的内容（至少800字）、长篇论述、生活中的比喻、多层级的<ul>列表等。如果要插入配图，请使用 <img prompt='极其详细的生图提示词：画面主体是什么？光影如何？里面如果要有文字，请明确写出“画面中包含文字：XXX”等'> 标签让后续系统生成图片。如果要插入互动选择题，请严格使用以下 HTML 结构：\\n<div class='textbook-quiz-box' data-correct-answer='B'>\\n  <p class='quiz-question'>问题描述？</p>\\n  <div class='quiz-options'>\\n    <div class='quiz-option' data-value='A'>A. 选项内容</div>\\n    <div class='quiz-option' data-value='B'>B. 选项内容</div>\\n    <div class='quiz-option' data-value='C'>C. 选项内容</div>\\n    <div class='quiz-option' data-value='D'>D. 选项内容</div>\\n  </div>\\n  <div class='quiz-explanation' style='display:none;'><strong>解析：</strong>这里写详细解析...</div>\\n</div>\\n注意在属性中强制使用单引号，绝不允许出现双引号！\"\n"
            + "}}\n"
            + "要求：\n"
            + "1. 只有 content 字段的合法 JSON，不要 markdown 标记。\n"
            + "2. 前测(pre-assessment)和后测(post-assessment)章节必须提供至少1道互动选择题的 HTML 结构。\n"
            + f"3. 配图策略：{image_mode}。当 image_mode 为 none 时，严禁输出任何 <img ...> 标签。允许配图时，必须使用单引号属性，建议使用 <img prompt='...' kind='diagram|science|illustration'> 标注类型。\n"
            + "4. 极其重要：由于你需要输出严格的 JSON 格式，在 `content` 字段的字符串内部，**绝对、绝对不能**出现任何未经转义的英文双引号（`\"`）。HTML 属性必须全部使用单引号（例如 `<div class='box'>`）。正文中的引用必须全部改用中文双引号（`“”`）或单引号。如果你在字符串内部使用了未经转义的英文双引号，将会导致严重的系统崩溃！"
        )

        def manual_sanitize_quotes(json_str, key_name):
            search_key = f'"{key_name}": "'
            parts = json_str.split(search_key)
            if len(parts) <= 1: return json_str
            sanitized = parts[0]
            for part in parts[1:]:
                end_idx = -1
                for i in range(len(part) - 1, -1, -1):
                    if part[i] == '"':
                        remainder_stripped = part[i+1:].strip()
                        if remainder_stripped.startswith('}') or remainder_stripped.startswith(',') or remainder_stripped.startswith(']') or remainder_stripped == '':
                            end_idx = i
                            break
                if end_idx != -1:
                    value = part[:end_idx]
                    remainder = part[end_idx:]
                    value = value.replace('"', '”').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                    sanitized += search_key + value + remainder
                else:
                    sanitized += search_key + part
            return sanitized

        chapters = outline_data.get("chapters", [])
        total_chapters = len(chapters)
        
        for idx, chap in enumerate(chapters):
            chap_title = chap.get("title", f"第{idx+1}章")
            yield f"data: {json.dumps({'status': 'progress', 'step': 'chapter', 'current': idx + 1, 'total': total_chapters, 'chapter_title': chap_title, 'message': f'正在撰写章节：{chap_title} ...'})}\n\n"
            
            sys_prompt = chapter_prompt_template.format(
                textbook_title=final_textbook["title"],
                chapter_title=chap_title,
                chapter_type=chap.get("type", ""),
                chapter_instruction=chap.get("instruction", "")
            )
            
            try:
                chap_res = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": f"原始材料如下：\n{user_content}"}
                    ],
                    temperature=0.7,
                    max_tokens=8192,
                    response_format={"type": "json_object"}
                )
                chap_content = chap_res.choices[0].message.content.strip()
                if chap_content.startswith("```json"): chap_content = chap_content[7:]
                if chap_content.startswith("```"): chap_content = chap_content[3:]
                if chap_content.endswith("```"): chap_content = chap_content[:-3]
                
                try:
                    parsed_chap = json.loads(chap_content.strip())
                except json.JSONDecodeError:
                    import re
                    sanitized_content = re.sub(r'[\x00-\x1f]+', '', chap_content.strip())
                    sanitized_str = manual_sanitize_quotes(sanitized_content, "content")
                    try:
                        parsed_chap = json.loads(sanitized_str)
                    except Exception as inner_e:
                        parsed_chap = {"content": f"<p>该章节内容生成解析失败: {str(inner_e)}</p>"}
                
                chapter_obj = {
                    "id": chap.get("id", f"ch_{len(final_textbook['chapters'])}"),
                    "title": chap_title,
                    "type": chap.get("type", "participatory"),
                    "content": parsed_chap.get("content", "")
                }
                final_textbook["chapters"].append(chapter_obj)
                if stream_chapters:
                    yield f"data: {json.dumps({'status': 'progress', 'step': 'chapter_done', 'current': idx + 1, 'total': total_chapters, 'chapter': chapter_obj, 'message': f'章节完成：{chap_title}'})}\n\n"
            except Exception as e:
                chapter_obj = {
                    "id": chap.get("id", f"ch_{len(final_textbook['chapters'])}"),
                    "title": chap_title,
                    "type": chap.get("type", "participatory"),
                    "content": f"<p>该章节生成失败，请重试。错误信息：{str(e)}</p>"
                }
                final_textbook["chapters"].append(chapter_obj)
                if stream_chapters:
                    yield f"data: {json.dumps({'status': 'progress', 'step': 'chapter_done', 'current': idx + 1, 'total': total_chapters, 'chapter': chapter_obj, 'message': f'章节完成：{chap_title}'})}\n\n"
                
        yield f"data: {json.dumps({'status': 'success', 'data': final_textbook})}\n\n"

    def search_web(self, query: str):
        """
        调用智谱 Web Search API 进行网络搜索。
        供左侧面板的“在网络中搜索新来源”使用。
        """
        url = "https://open.bigmodel.cn/api/paas/v4/web_search"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "search_query": query,
            "search_engine": "search_pro",
            "search_intent": False,
            "count": 5,
            "search_recency_filter": "noLimit",
            "content_size": "high"
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"API Error {response.status_code}: {response.text}")
        except Exception as e:
            raise Exception(f"网络搜索失败: {str(e)}")

    def init_discussion_agents(self, count: int) -> list:
        """
        初始化小组讨论，生成几个带人设和头像的AI同学
        """
        if not self.document_context:
            raise ValueError("没有可用的文档内容来生成讨论角色。请先添加来源。")
            
        system_prompt = (
            "你是一个角色设计专家。请基于用户提供的文档内容，设计几个AI学生角色来进行小组讨论。\n"
            f"请生成 {count} 个角色。每个角色要有不同的性格（比如：学霸、好奇宝宝、杠精、幽默等）。\n"
            "严格输出为JSON数组，格式如下（不要任何注释）：\n"
            "[\n"
            "  {\n"
            "    \"id\": \"agent_1\",\n"
            "    \"name\": \"名字\",\n"
            "    \"personality\": \"简短性格描述\",\n"
            "    \"system_prompt\": \"该角色的详细人设提示词，说明他/她的知识背景和说话风格（必须要求该角色喜欢发emoji表情，并且说话非常简短、口语化，像真实的微信群聊一样）\",\n"
            "    \"avatar_prompt\": \"用于生成该角色可爱头像的画面描述，只需描述外貌特征，不需要前缀\"\n"
            "  }\n"
            "]\n"
        )
        
        user_content = "\n---\n".join(self.document_context.values())
        if len(user_content) > 100000:
            user_content = user_content[:100000]
            
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请根据以下内容生成角色 JSON 数组:\n{user_content}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.8,
                max_tokens=8192,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            agents = json.loads(content.strip())
            
            # 使用 CogView-3-Flash 生成头像
            for agent in agents:
                try:
                    res = self.client.images.generations(
                        model="cogview-3-flash",
                        prompt=f"可爱的二次元Q版头像，{agent.get('avatar_prompt', '学生') }，白色背景，高质量，精美细节"
                    )
                    agent['avatar'] = res.data[0].url
                except Exception as e:
                    # 如果生成失败，使用兜底的文字头像
                    agent['avatar'] = f"https://ui-avatars.com/api/?name={agent['name']}&background=random"
            
            self.discussion_agents = agents
            self.discussion_history = []
            return agents
        except Exception as e:
            raise Exception(f"生成讨论角色失败: {str(e)}")

    def discussion_chat(self, message: str, is_trigger: bool = False, trigger_agent_name: str = None) -> list:
        """
        小组讨论对话处理，返回多个角色的回复列表。
        如果是 is_trigger=True，且传入了 trigger_agent_name，则只让这一个指定的角色发言。
        """
        if not hasattr(self, 'discussion_agents') or not self.discussion_agents:
            # 尝试通过一种安全的机制恢复兜底，但这里最好还是抛出异常并由前端处理重新初始化
            raise ValueError("未初始化讨论组")
            
        if message:
            self.discussion_history.append({"role": "user", "name": "我", "content": message})
            
        # 截取最近15条历史
        recent_history = self.discussion_history[-15:]
        
        agents_info = "\n".join([f"- {a['name']} ({a['personality']}): {a['system_prompt']}" for a in self.discussion_agents])
        
        history_text = ""
        for h in recent_history:
            history_text += f"[{h['name']}]: {h['content']}\n"
            
        if is_trigger and trigger_agent_name:
            # 伪随机触发：只让指定的单个角色发言
            system_prompt = (
                f"你是一个群聊模拟器，当前你需要专门扮演AI同学【{trigger_agent_name}】。\n"
                f"这是群里的所有角色设定：\n{agents_info}\n\n"
                "要求：\n"
                "1. 你必须紧密结合当前的聊天记录进行接话。如果刚才有人（特别是'我'）问了问题或表达了观点，你必须直接回应或评价。\n"
                "2. 如果群里很安静，你就主动抛出一个新话题或问题。\n"
                "3. 说话必须极度简短、像真实人类微信聊天（一般不超过20个字）。\n"
                "4. 必须包含emoji表情。\n"
                "5. 可以选择性地生成一张表情包配图，如果需要发图，请在回复中插入类似这样的标签：<img prompt=\"描述表情包画面的提示词，比如：一个震惊的猫咪表情包\">。\n"
                "6. 严格只输出一行内容，格式为：\n"
                f"[{trigger_agent_name}]: 回复内容\n"
                "不要任何其他废话。"
            )
            user_prompt = f"聊天记录：\n{history_text}\n(群里安静了一会儿)\n请【{trigger_agent_name}】结合上下文主动发一条消息回应或者活跃气氛。"
        else:
            # 用户发言后，由系统决定1-2个角色回复
            system_prompt = (
                "你是一个群聊模拟器，负责扮演以下几个AI同学进行关于给定文档的小组讨论：\n"
                f"{agents_info}\n\n"
                "要求：\n"
                "1. 你必须仔细阅读聊天记录中'我'（即用户）最新发送的消息，并让 1 到 2 个同学针对'我'的话进行直接的回应、解答或反问。\n"
                "2. 说话必须极度简短、像真实人类微信聊天（单句不超过20个字）。\n"
                "3. 必须包含emoji表情。\n"
                "4. 可以选择性地发表情包，如果发图，在内容中插入：<img prompt=\"表情包画面描述\">。\n"
                "5. 严格使用以下格式输出，每一行是一个人的发言：\n"
                "[同学名字]: 回复内容\n"
                "不要任何其他废话和Markdown代码块标记。"
            )
            user_prompt = f"聊天记录：\n{history_text}\n请生成同学们对'我'的最新发言的简短回应。"
            
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.8
            )
            
            full_response = response.choices[0].message.content.strip()
            
            import re
            matches = re.finditer(r'\[(.*?)\]:\s*(.*?)(?=\n\[|$)', full_response, re.DOTALL)
            msgs = []
            for m in matches:
                name = m.group(1).strip()
                content = m.group(2).strip()
                self.discussion_history.append({"role": "ai", "name": name, "content": content})
                msgs.append({"name": name, "content": content})
                
            if not msgs:
                msgs.append({"name": "系统解析异常", "content": full_response})
                
            return msgs
        except Exception as e:
            raise Exception(f"生成回复失败: {str(e)}")

    def generate_classroom_lesson(self, topic: str, style: str) -> dict:
        """
        生成模拟课堂的课件（PPT大纲、HTML内容、讲稿）
        """
        if not self.document_context:
            raise ValueError("没有可用的文档内容来备课。请先添加来源。")
            
        system_prompt = (
            "你是一位顶级的金牌讲师和幻灯片设计师。请根据用户提供的文档内容和课程主题，设计一堂精彩的模拟课程。\n"
            f"用户的授课重点/主题：{topic}\n"
            f"授课风格要求：{style}（professional=严谨专业, humorous=幽默风趣, storytelling=故事化叙述）\n"
            "你需要将课程拆分为 3 到 5 页 PPT（Slide）。\n"
            "严格输出为 JSON 格式，结构如下（不要包含任何注释）：\n"
            "{\n"
            "  \"title\": \"课程主标题\",\n"
            "  \"slides\": [\n"
            "    {\n"
            "      \"page\": 1,\n"
            "      \"html_content\": \"该页PPT的HTML内容（包含 <h1> <h2> <ul> 等，要求排版极其美观、重点内容必须加粗或使用有颜色的标记突出。绝不要生成任何<img>标签！在HTML属性中只使用单引号！千万不要使用双引号，避免破坏JSON结构！）\",\n"
            "      \"speech_text\": \"老师讲解这一页时的口语化讲稿，字数控制在100-200字，要生动自然，符合所选风格\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "要求：\n"
            "1. 只输出合法的 JSON，不要 markdown 标记。\n"
            "2. html_content尽量精简结构，不要嵌套过深的 div 标签。\n"
            "3. 绝对不要在 html_content 中插入任何形式的 <img ...> 标签或配图占位符。\n"
            "4. 极其重要：由于你需要输出严格的 JSON 格式，在 `html_content` 和 `speech_text` 字段的字符串内部，**绝对、绝对不能**出现任何未经转义的英文双引号（`\"`）。HTML 属性必须全部使用单引号（例如 `<div class='box'>`）。正文和讲稿中的引用必须全部改用中文双引号（`“”`）或单引号。如果你在字符串内部使用了未经转义的英文双引号，将会导致严重的系统崩溃！\n"
        )
        
        user_content = "\n---\n".join(self.document_context.values())
        if len(user_content) > 100000:
            user_content = user_content[:100000]
            
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请开始备课:\n{user_content}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.8,
                max_tokens=8192,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            try:
                # 尝试直接解析
                parsed_data = json.loads(content.strip())
            except json.JSONDecodeError as e:
                import re
                sanitized_content = re.sub(r'[\x00-\x1f]+', '', content.strip())
                try:
                    parsed_data = json.loads(sanitized_content)
                except json.JSONDecodeError:
                    # 终极兜底：大模型可能在 content 的正文中混入了未转义的英文双引号
                    # 我们通过手动分割和重组来清理 content, html_content, speech_text 中的非法双引号
                    def manual_sanitize_quotes(json_str, key_name):
                        search_key = f'"{key_name}": "'
                        parts = json_str.split(search_key)
                        if len(parts) <= 1:
                            return json_str
                            
                        sanitized = parts[0]
                        for part in parts[1:]:
                            # 寻找值的结束位置：即最后一个"后面跟着空白和 } 或 , 或 ]
                            end_idx = -1
                            # 我们从后往前找可能的结束引号
                            # 为了避免把内容里的 " 当成结束引号，我们寻找最近的一个满足条件的 "
                            for i in range(len(part) - 1, -1, -1):
                                if part[i] == '"':
                                    remainder_stripped = part[i+1:].strip()
                                    # 处理 \n, \r 等可能导致的空白
                                    if remainder_stripped.startswith('}') or remainder_stripped.startswith(',') or remainder_stripped.startswith(']') or remainder_stripped == '':
                                        end_idx = i
                                        break
                                        
                            if end_idx != -1:
                                value = part[:end_idx]
                                remainder = part[end_idx:]
                                # 将值内部所有的英文双引号替换为中文双引号，并清理换行符（不转义而是替换为空格避免 JSON 解析报错，因为这是 HTML 正文）
                                value = value.replace('"', '”').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                                sanitized += search_key + value + remainder
                            else:
                                sanitized += search_key + part
                        return sanitized

                    sanitized_str = manual_sanitize_quotes(sanitized_content, "content")
                    sanitized_str = manual_sanitize_quotes(sanitized_str, "speech_text")
                    sanitized_str = manual_sanitize_quotes(sanitized_str, "html_content")
                    
                    try:
                        parsed_data = json.loads(sanitized_str)
                    except json.JSONDecodeError:
                        print(f"JSON Parse Failed. Raw content:\n{content}")
                        raise Exception(f"模型生成的JSON格式存在严重错误（通常是由于正文中包含未转义的英文双引号导致），请重试。错误详情: {str(e)}")
                
            return parsed_data
        except Exception as e:
            print("RAW CONTENT:", locals().get('content', 'NO CONTENT'))
            raise Exception(f"备课失败: {str(e)}")

    def generate_speech_audio(self, text: str) -> str:
        """
        调用 MiMo TTS 生成语音，返回音频数据的 base64 编码或可播放格式
        """
        import base64
        import requests
        import os
        try:
            api_key = os.environ.get("MIMO_API_KEY")
            if not api_key:
                raise ValueError("未找到 MIMO_API_KEY 环境变量，请先配置小米 MiMo API Key。")
            url = "https://api.xiaomimimo.com/v1/chat/completions"
            headers = {
                "api-key": api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "model": "mimo-v2-tts",
                "messages": [
                    {
                        "role": "assistant",
                        "content": text
                    }
                ],
                "audio": {
                    "format": "mp3",
                    "voice": "mimo_default"
                }
            }
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            if response.status_code != 200:
                raise Exception(f"API Error {response.status_code}: {response.text}")
            
            res_json = response.json()
            message = res_json.get("choices", [{}])[0].get("message", {})
            audio_data = message.get("audio", {}).get("data")
            
            if not audio_data:
                raise Exception("No audio data returned in the response")
                
            data_uri = f"data:audio/mp3;base64,{audio_data}"
            return data_uri
            
        except Exception as e:
            print(f"TTS Error: {e}")
            raise e

    def generate_flashcards(self, count: int, difficulty: str, extra: str) -> list:
        """
        根据当前文档上下文生成记忆闪卡数据结构。
        """
        if not self.document_context:
            raise ValueError("没有可用的文档内容来生成记忆闪卡。请先添加来源。")
            
        system_prompt = (
            "你是一个专业的教育专家和记忆闪卡生成器。请根据用户提供的文档内容，生成用于学习和记忆的闪卡。\n"
            f"要求生成 {count} 张闪卡，难度级别为：{difficulty}。\n"
            f"用户的额外要求：{extra}\n"
            "请严格输出为 JSON 数组格式，结构如下：\n"
            "[\n"
            "  {\n"
            "    \"front\": \"闪卡正面的问题或概念（简短、清晰）\",\n"
            "    \"back\": \"闪卡背面的答案或详细解析（可以使用少量 HTML 标签如 <strong>, <br> 等增强格式，要求具有教育性和启发性）\"\n"
            "  }\n"
            "]\n"
            "要求：\n"
            "1. 只输出合法的 JSON 数组，不要输出任何额外的 markdown 标记或解释说明。\n"
            "2. 正面的问题要能够引发思考，背面的答案要准确且易于记忆。\n"
        )
        
        user_content = "\n---\n".join(self.document_context.values())
        
        # 为了防止输入过长，截取前部分文档内容（或者可以按需优化）
        if len(user_content) > 100000:
            user_content = user_content[:100000]
            
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请根据以下内容生成记忆闪卡 JSON 数组:\n{user_content}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=8192,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            # 移除可能存在的 markdown 代码块标记
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            return json.loads(content.strip())
        except Exception as e:
            raise Exception(f"生成记忆闪卡失败: {str(e)}")

    def generate_quiz(self, single_count: int, multi_count: int, fill_count: int, essay_count: int) -> list:
        """
        根据文档上下文生成随堂测验试卷。
        """
        if not self.document_context:
            raise ValueError("没有可用的文档内容来生成测验。请先添加来源。")
            
        system_prompt = (
            "你是一个专业的考试命题专家。请根据用户提供的文档内容，生成一份随堂测验卷。\n"
            f"题型及数量要求：单选题 {single_count} 道，多选题 {multi_count} 道，填空题 {fill_count} 道，大题（简答题） {essay_count} 道。\n"
            "请严格输出为 JSON 数组格式，每一道题是一个对象。数据结构要求如下（严禁在JSON中输出任何注释）：\n"
            "[\n"
            "  {\n"
            "    \"id\": \"唯一ID如 q1\",\n"
            "    \"type\": \"single_choice | multiple_choice | fill_blanks | essay\",\n"
            "    \"question\": \"题目内容（对于填空题，请使用 ___ 代表填空位置）\",\n"
            "    \"options\": [\"A. 选项内容\", \"B. 选项内容\", \"C. 选项内容\", \"D. 选项内容\"],\n"
            "    \"answer\": \"答案。单选填 'A'，多选和填空必须是双引号包裹的字符串数组如 [\\\"A\\\", \\\"B\\\"]，大题填文字\",\n"
            "    \"score\": 10,\n"
            "    \"analysis\": \"详细的题目解析\",\n"
            "    \"knowledge_point\": \"考查的核心知识点短语\"\n"
            "  }\n"
            "]\n"
            "要求：\n"
            "1. 只输出合法的 JSON 数组，绝不要输出任何额外的 markdown 标记或 // 等注释符号。\n"
            "2. 如果不是选择题，可以输出空的 options 数组 [] 或者忽略该字段。\n"
            "3. 务必确保 JSON 格式完全正确，特别是字符串内的双引号必须转义。\n"
            "4. 题目要严谨，选项具有迷惑性，解析要详实透彻。\n"
        )
        
        user_content = "\n---\n".join(self.document_context.values())
        if len(user_content) > 100000:
            user_content = user_content[:100000]
            
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请根据以下文档内容出题:\n{user_content}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=8192,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            return json.loads(content.strip())
        except Exception as e:
            raise Exception(f"生成测验失败: {str(e)}")

    def quiz_qa_stream(self, question: str, analysis: str, user_query: str):
        """
        测验解析答疑流，集成网络搜索以增强回答。
        """
        # 1. 首先进行网络搜索获取知识点补充
        search_context = ""
        try:
            search_results = self.web_search(user_query)
            if isinstance(search_results, dict) and "search_result" in search_results:
                search_context = "\n".join([f"- {item.get('title')}: {item.get('content')}" for item in search_results["search_result"]])
        except Exception as e:
            search_context = f"(搜索暂不可用: {str(e)})"

        # 2. 构建 prompt 进行流式回答
        system_prompt = (
            "你是一位耐心且知识渊博的老师。学生在完成随堂测验后对某道题的解析产生了疑问。\n"
            "请结合题目的原始信息、已有解析，以及最新检索到的网络知识，为学生解答疑问。\n"
            "回答要求使用 Markdown 格式，保持专业、清晰，具有启发性。"
        )
        
        user_content = (
            f"【原题目】\n{question}\n\n"
            f"【原解析】\n{analysis}\n\n"
            f"【网络检索参考信息】\n{search_context}\n\n"
            f"【学生的疑问】\n{user_query}\n\n"
            "请解答我的疑问："
        )
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                stream=True,
                temperature=0.7
            )
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n[答疑出错: {str(e)}]"
