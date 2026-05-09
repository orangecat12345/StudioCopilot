import json
import time
import hmac
import hashlib
import base64
import os
import requests

API_KEY = os.getenv("ZHIPUAI_API_KEY") or os.getenv("ZAI_API_KEY")

def generate_token(apikey: str, exp_seconds: int = 3600):
    try:
        id, secret = apikey.split(".")
    except Exception as e:
        return apikey 

    payload = {
        "api_key": id,
        "exp": int(round(time.time() * 1000)) + exp_seconds * 1000,
        "timestamp": int(round(time.time() * 1000)),
    }
    
    header = {"alg": "HS256", "sign_type": "SIGN"}
    
    def urlsafe_b64encode(data):
        return base64.urlsafe_b64encode(data).rstrip(b'=')

    header_json = json.dumps(header, separators=(",", ":")).encode('utf-8')
    payload_json = json.dumps(payload, separators=(",", ":")).encode('utf-8')
    
    header_b64 = urlsafe_b64encode(header_json)
    payload_b64 = urlsafe_b64encode(payload_json)
    
    to_sign = header_b64 + b"." + payload_b64
    
    signature = hmac.new(secret.encode('utf-8'), to_sign, hashlib.sha256).digest()
    signature_b64 = urlsafe_b64encode(signature)
    
    return (header_b64 + b"." + payload_b64 + b"." + signature_b64).decode('utf-8')

class AIService:
    def __init__(self):
        self.api_key = API_KEY
        self.chat_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.search_url = "https://open.bigmodel.cn/api/paas/v4/web_search"

    def set_api_key(self, api_key: str | None):
        self.api_key = (api_key or "").strip() or None

    def is_configured(self) -> bool:
        return bool(self.api_key)
        
    def get_headers(self):
        if not self.api_key:
            raise ValueError("尚未配置智谱 API Key，请先到设置中填写。")
        token = generate_token(self.api_key)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def web_search(self, query):
        if not self.api_key:
            return {
                "search_result": [
                    {
                        "title": "未配置智谱 API Key",
                        "link": "#",
                        "content": "请先到设置页面填写智谱 API Key 后再使用联网搜索。"
                    }
                ]
            }

        headers = self.get_headers()
        
        # Optimize query length for search engine
        # Instead of simple truncation, we should keep it reasonably short but meaningful.
        # The API limit is often higher than 70 chars, but let's be safe yet smarter.
        safe_query = query[:200] if len(query) > 200 else query
        
        # Remove markdown/special chars that might confuse search
        safe_query = safe_query.replace('\n', ' ').strip()
        
        data = {
            "search_query": safe_query,
            "search_engine": "search_std", # Standard search engine
            # "search_intent": True # Let the engine decide intent or force it if supported
        }
        
        try:
            # Using POST for BigModel web_search
            response = requests.post(self.search_url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                # Ensure the result structure is robust
                if 'search_result' not in result:
                    result['search_result'] = []
                return result
            
            print(f"Web Search API Error: {response.status_code} - {response.text}")
            return {
                "search_result": [
                    {
                        "title": f"Search Unavailable ({response.status_code})",
                        "link": "#",
                        "content": "The search service is temporarily unavailable."
                    }
                ]
            }
        except Exception as e:
            print(f"Web Search Exception: {e}")
            return {
                "search_result": [
                    {
                        "title": "Network Error",
                        "link": "#",
                        "content": "Could not connect to search service."
                    }
                ]
            }

    def stream_chat(self, history, enable_search=False, thinking_mode="disabled"):
        if not self.api_key:
            yield {
                "type": "error",
                "content": "当前尚未配置智谱 API Key。请先进入“设置”页面填写 API Key，然后再开始对话。"
            }
            return

        headers = self.get_headers()
        
        # Prepare context with search results if enabled
        search_context = ""
        if enable_search and len(history) > 0:
            last_user_message = history[-1]['content']
            
            # Step 1: Analyze user query to generate optimal search keywords
            yield {"type": "search_status", "status": "searching", "query": "正在分析搜索意图..."}
            
            # Step 2: Perform Web Search
            yield {"type": "search_status", "status": "searching", "query": f"正在全网搜索: {last_user_message[:15]}..."}
            
            search_result = self.web_search(last_user_message)
            
            if search_result and 'search_result' in search_result:
                # Simplify results for frontend
                frontend_results = []
                for item in search_result['search_result']:
                    frontend_results.append({
                        "title": item.get('title', 'No Title'),
                        "link": item.get('link', '#')
                    })
                
                yield {
                    "type": "search_status", 
                    "status": "found", 
                    "count": len(search_result['search_result']),
                    "results": frontend_results
                }
                
                search_context = "\n\nSearch Results (Real-time Web Data):\n"
                for idx, item in enumerate(search_result['search_result']):
                    search_context += f"{idx+1}. [{item.get('title', 'No Title')}]({item.get('link', '#')})\n   Content: {item.get('content', '')}\n   Source: {item.get('media', 'Web')}\n"
                
                # Insert search context into the last message
                history_copy = json.loads(json.dumps(history)) # Deep copy
                history_copy[-1]['content'] += f"\n\n[System] I have performed a web search for you. Use the following real-time information to answer the user's question. Ignore your internal knowledge cutoff if it conflicts with these results.\n{search_context}"
                messages = history_copy
            else:
                yield {"type": "search_status", "status": "failed"}
                messages = history
        else:
            messages = history

        # Configure model and thinking parameters based on mode
        # By default use glm-4-flash as it is fast and cheap
        model_name = "glm-4-flash" 
        thinking_param = None
        manual_thinking_parsing = False
        
        # Use prompt injection as a fallback or enhancement for expert mode
        system_prompt_injection = ""

        if thinking_mode == "deep_thinking" or thinking_mode == "expert":
            # STRATEGY: Hybrid approach + Manual Parsing Fallback
            # 1. Try to enable native 'thinking' param with a capable model (glm-4-plus)
            # 2. ALSO inject a strong system prompt to encourage CoT.
            # 3. IF native thinking fails (fallback triggered), use manual parsing of <think> tags.
            
            model_name = "glm-4-plus" 
            thinking_param = {
                "type": "enabled"
            }
            
            # This prompt encourages the model to output reasoning using explicit tags
            # so we can parse it manually if the native field is missing.
            system_prompt_injection = (
                "You are an expert AI with deep reasoning capabilities. "
                "When answering complex questions, please think deeply and step-by-step. "
                "You MUST wrap your thinking process inside <think> and </think> tags. "
                "Structure your thinking process:\n"
                "- Analyze the user's request and intent.\n"
                "- Break down the problem into logical steps.\n"
                "- Perform necessary deductions or information retrieval.\n"
                "- Verify your conclusions.\n"
                "After the </think> tag, provide your clear and concise final answer."
            )
            manual_thinking_parsing = True

        elif thinking_mode == "fast":
            model_name = "glm-4-flash"
            # No thinking param
        
        # Balanced mode (default)
        else: 
            # Optimized Balanced Mode: Adaptive Reasoning
            # We use a capable model (GLM-4-Plus) and allow it to decide WHEN to think.
            # We enable manual parsing so IF it decides to use <think> tags for complex tasks, 
            # the frontend will render it beautifully. For simple tasks, it stays direct.
            model_name = "glm-4-plus" 
            thinking_param = None 
            manual_thinking_parsing = True 
            system_prompt_injection = (
                "You are a versatile and balanced AI assistant. "
                "Adapt your response strategy to the complexity of the user's query:\n"
                "1. For simple greetings, facts, or casual chat: Answer directly and concisely.\n"
                "2. For complex logic, math, coding, or analysis tasks: You MAY use <think> and </think> tags to outline your reasoning step-by-step before giving the final answer.\n"
                "Goal: Be efficient for simple tasks, but deep for complex ones."
            )

        data = {
            "model": model_name,
            "messages": messages,
            "stream": True,
            "temperature": 0.1 if thinking_mode == "fast" else 0.7
        }
        
        if system_prompt_injection:
            # Check if there is already a system message
            if messages and messages[0]['role'] == 'system':
                messages[0]['content'] += "\n\n" + system_prompt_injection
            else:
                messages.insert(0, {"role": "system", "content": system_prompt_injection})
        
        if thinking_param:
             data["thinking"] = thinking_param
        
        try:
            response = requests.post(self.chat_url, headers=headers, json=data, stream=True)
            
            # Fallback Logic
            if response.status_code != 200:
                 if thinking_param:
                      data.pop("thinking", None)
                      data["model"] = "glm-4" # Standard GLM-4
                      response = requests.post(self.chat_url, headers=headers, json=data, stream=True)
                
                 if response.status_code != 200:
                     yield {"type": "error", "content": f"Error: API returned status code {response.status_code}, {response.text}"}
                     return

            # Stream Processing with Manual Parsing Support
            in_thinking_block = False
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith("data: "):
                        json_str = line[6:]
                        if json_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(json_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            
                            # 1. Native Thinking Check
                            reasoning = delta.get("reasoning_content", "") or delta.get("thinking_content", "")
                            if reasoning:
                                yield {"type": "reasoning", "content": reasoning}
                                continue 
                                
                            # 2. Manual Parsing Check
                            content = delta.get("content", "")
                            
                            if manual_thinking_parsing:
                                # State Machine for Stream Parsing
                                # Detect tag boundaries within content stream
                                
                                # Case 1: Start Tag
                                if "<think>" in content:
                                    parts = content.split("<think>", 1)
                                    if parts[0]: yield {"type": "content", "content": parts[0]}
                                    in_thinking_block = True
                                    content = parts[1] # Process remainder
                                
                                # Case 2: End Tag
                                if "</think>" in content:
                                    parts = content.split("</think>", 1)
                                    # Content before tag is reasoning
                                    if parts[0]: yield {"type": "reasoning", "content": parts[0]}
                                    in_thinking_block = False
                                    content = parts[1] # Remainder is regular content
                                    if content: yield {"type": "content", "content": content}
                                    continue # Done with this chunk
                                    
                                # Case 3: Inside Block
                                if in_thinking_block:
                                    if content: yield {"type": "reasoning", "content": content}
                                else:
                                    # Case 4: Outside Block (Regular Content)
                                    if content: yield {"type": "content", "content": content}
                            else:
                                if content:
                                    yield {"type": "content", "content": content}
                        except:
                            pass
        except Exception as e:
            yield {"type": "error", "content": f"Error: {str(e)}"}
