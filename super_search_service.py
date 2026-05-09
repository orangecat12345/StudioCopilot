import json
import re
from ai_service import AIService

class SuperSearchService:
    def __init__(self):
        self.ai_service = AIService()

    def generate_knowledge_graph_stream(self, query):
        """
        Yields JSON objects (nodes) one by one for the given query.
        This allows for incremental rendering on the frontend.
        """
        
        # 1. Perform Web Search to get context
        search_results = self.ai_service.web_search(query)
        
        context_text = ""
        if search_results and 'search_result' in search_results:
            for i, item in enumerate(search_results['search_result']):
                title = item.get('title', 'No Title')
                content = item.get('content', '')
                link = item.get('link', '')
                context_text += f"[{i+1}] {title}: {content}\nLink: {link}\n\n"
        
        # 2. Construct Prompt for LLM (JSON Lines)
        system_prompt = (
            "You are a Knowledge Architect. Your goal is to stream knowledge graph nodes one by one.\n"
            "Output format: JSON Lines (one valid JSON object per line).\n"
            "DO NOT output a single large JSON. DO NOT wrap in a list [].\n"
            "DO NOT output markdown, explanations, or code fences.\n"
            "Each JSON object must be compact in a single line.\n"
            "Language must match the user topic language.\n"
            "Structure:\n"
            "1. First line: Root node `{\"id\": \"root\", \"name\": \"...\", \"description\": \"...\"}`\n"
            "2. Subsequent lines: Child nodes `{\"id\": \"...\", \"parent\": \"parent_id\", \"name\": \"...\", \"description\": \"...\", \"detail\": \"...\", \"url\": \"...\", \"type\": \"...\", \"difficulty\": \"...\", \"bloom\": \"...\", \"misconception\": \"...\", \"activity\": \"...\", \"assessment\": \"...\", \"prompt\": \"...\"}`\n"
            "Ensure a hierarchical structure with 3-4 levels (Root -> Domains -> Modules -> Concepts/Practice).\n"
            "For education/AI topics prefer categories: 核心概念, 认知机制, 教学策略, 实战应用, 风险与伦理, 评估与反馈.\n"
            "Make sure 'parent' field references a valid 'id' from a previous line.\n"
            "Generate at least 18 nodes and at most 40 nodes.\n"
            "Provide rich 'detail' (3-5 sentences) for leaf nodes.\n"
            "Leaf nodes must include actionable pedagogy fields: misconception, activity, assessment, prompt.\n"
        )
        
        user_prompt = (
            f"Topic: {query}\n\n"
            f"Context from Web Search:\n{context_text}\n\n"
            "Generate the node list now. One JSON per line."
        )
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # 3. Stream and Yield
        buffer = ""
        decoder = json.JSONDecoder()
        for chunk in self.ai_service.stream_chat(messages, enable_search=False):
            if chunk.get('type') == 'content':
                content = chunk.get('content', '')
                buffer += content
                buffer = buffer.replace('```json', '').replace('```', '')

                while True:
                    start = buffer.find('{')
                    if start == -1:
                        buffer = ""
                        break
                    if start > 0:
                        buffer = buffer[start:]

                    try:
                        node, end_index = decoder.raw_decode(buffer)
                    except json.JSONDecodeError:
                        break

                    buffer = buffer[end_index:].lstrip(', \n\r\t')
                    if isinstance(node, dict) and node.get('id') and node.get('name'):
                        yield node

    def generate_knowledge_graph(self, query):
        """Legacy method for compatibility, returns full graph"""
        # ... (keep existing implementation or wrap stream)
        # For now we keep the existing one as fallback or delete if unused
        pass

    def generate_node_assist(self, action, query, node):
        node_name = node.get('name', '')
        node_desc = node.get('description', '')
        node_detail = node.get('detail', '')
        node_mis = node.get('misconception', '')
        node_activity = node.get('activity', '')
        node_assessment = node.get('assessment', '')

        action_map = {
            "lesson_plan": "输出一份可直接执行的 45 分钟课堂设计，包含目标、流程、活动、分层支持与板书要点。",
            "quiz": "输出 6 道高质量测验题（选择/判断/简答混合），并给出答案与评分要点。",
            "expand": "输出该节点的深入扩展图谱建议，给出二级/三级扩展方向与每个方向的实践建议。"
        }
        task_instruction = action_map.get(action, action_map["expand"])

        messages = [
            {
                "role": "system",
                "content": (
                    "你是资深AI教育产品教研专家。请输出高信息密度、结构化、可执行内容。"
                    "禁止空话，优先给步骤、模板、示例。"
                )
            },
            {
                "role": "user",
                "content": (
                    f"主题: {query}\n"
                    f"节点名称: {node_name}\n"
                    f"节点摘要: {node_desc}\n"
                    f"节点详情: {node_detail}\n"
                    f"常见误区: {node_mis}\n"
                    f"建议活动: {node_activity}\n"
                    f"评估建议: {node_assessment}\n\n"
                    f"任务: {task_instruction}\n"
                    "请用中文输出，使用清晰标题与项目符号。"
                )
            }
        ]

        text_chunks = []
        for chunk in self.ai_service.stream_chat(messages, enable_search=False):
            if chunk.get("type") == "content":
                text_chunks.append(chunk.get("content", ""))
        return "".join(text_chunks).strip()
