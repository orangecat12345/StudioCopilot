import json
import time
import requests
import re
from ai_service import AIService, generate_token

class JournalService(AIService):
    def __init__(self):
        super().__init__()
        self.image_url = "https://open.bigmodel.cn/api/paas/v4/images/generations"
        self.chat_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions" # Reuse chat URL for vision
        
        # Track last generation time per model category
        self.last_req_time = {
            "glm-image": 0,
            "default": 0
        }

    def verify_image_suitability(self, image_url, context):
        """
        Use GLM-4v-Flash to verify if the image is suitable for the context.
        Returns: (is_suitable: bool, reason: str)
        """
        print(f"DEBUG: Verifying image suitability for context: {context[:50]}...")
        headers = self.get_headers()
        
        system_prompt = (
            "You are an expert Image Quality Assurance AI for a Study Journal app.\n"
            "Your task is to evaluate if an image is suitable for the given topic/caption.\n"
            "Criteria for 'Suitable':\n"
            "1. Relevant to the topic.\n"
            "2. Not broken, blurry, or completely chaotic.\n"
            "3. Safe for work (no NSFW).\n"
            "4. Aesthetically pleasing (clean, not too cluttered).\n"
            "Reply with a JSON object: {\"suitable\": true/false, \"reason\": \"...\"}"
        )
        
        user_content = [
            {"type": "text", "text": f"Topic/Caption: {context}\nIs this image suitable?"},
            {"type": "image_url", "image_url": {"url": image_url}}
        ]
        
        data = {
            "model": "glm-4v-flash",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1
        }
        
        try:
            response = requests.post(self.chat_url, headers=headers, json=data)
            if response.status_code == 200:
                res_json = response.json()
                content = res_json['choices'][0]['message']['content']
                # Clean content to find JSON
                try:
                    # Find JSON block
                    start = content.find('{')
                    end = content.rfind('}') + 1
                    if start != -1 and end != -1:
                        json_str = content[start:end]
                        result = json.loads(json_str)
                        return result.get("suitable", True), result.get("reason", "No reason provided")
                except:
                    print(f"WARN: Failed to parse verification JSON: {content}")
                    # Fallback: if it says "suitable" or "yes", assume true
                    if "true" in content.lower() or "yes" in content.lower():
                        return True, "Parsed from text"
            else:
                print(f"WARN: Verification API failed: {response.text}")
        except Exception as e:
            print(f"WARN: Verification exception: {e}")
            
        return True, "Verification failed, assuming safe"

    def crawl_images(self, keyword, limit=3):
        """
        Crawl images from Unsplash or Bing.
        Returns a list of dicts: {'url': '...', 'source_url': '...'}
        """
        from bs4 import BeautifulSoup
        
        print(f"DEBUG: Crawling images for: {keyword}")
        
        # 1. Try Bing First (More robust)
        try:
            url = f"https://www.bing.com/images/search?q={keyword}&qft=+filterui:imagesize-large"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
            response = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            images = []
            for a in soup.find_all('a', class_='iusc'):
                try:
                    m = a.get('m')
                    m_data = json.loads(m)
                    img_url = m_data.get('murl')
                    page_url = m_data.get('purl') # Source Page URL
                    if img_url and self._is_safe_url(img_url): 
                        images.append({'url': img_url, 'source_url': page_url})
                except: continue
                if len(images) >= limit: break
            
            if images: return images
            
        except Exception as e:
            print(f"Bing crawl error: {e}")

        # 2. Try Unsplash (Often fails with 401/403)
        try:
            url = f"https://unsplash.com/s/photos/{keyword}"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
            response = requests.get(url, headers=headers, timeout=3) # Short timeout
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                images = []
                for img in soup.find_all('img'):
                    src = img.get('src', '')
                    if 'images.unsplash.com' in src and 'profile' not in src and 'placeholder' not in src:
                        if 'w=' in src or 'q=' in src:
                            images.append({'url': src, 'source_url': url})
                    if len(images) >= limit: break
                if images: return images
        except Exception as e:
            print(f"Unsplash crawl error: {e}")
            
        return []

    def _is_safe_url(self, url):
        # With <img referrerPolicy="no-referrer"> in frontend, we can try to use these images again.
        # But we still filter out some strictly protected ones if needed.
        # For now, let's allow them and rely on the frontend fix.
        return True 
        # forbidden_domains = ['zhihu.com', 'csdn.net', 'jianshu.com', 'bilibili.com', 'weibo.com']
        # return not any(d in url for d in forbidden_domains)

    def generate_image(self, prompt, source_preference="generation", search_keyword=None):
        """
        Generate OR Crawl an image.
        Returns: {'url': '...', 'source': 'generation'|'web_search', 'source_url': '...'}
        """
        print(f"DEBUG: Request Image | Prompt: {prompt} | Source: {source_preference} | Keyword: {search_keyword}")
        
        # 1. Analyze prompt
        text_indicators = [
            "text", "word", "sign", "label", "quote", "saying", "written", "lettering", "typography",
            "文字", "标签", "标注", "写着", "字母",
            "diagram", "infographic", "chart", "map", "blueprint", "scheme", "structure",
            "示意图", "流程图", "结构图", "架构图", "模型图", "对比图", "图表", "思维导图"
        ]
        prompt_lower = prompt.lower()
        has_text_intent = any(indicator in prompt_lower for indicator in text_indicators)
        has_quotes = '"' in prompt or "'" in prompt or "“" in prompt or "”" in prompt
        needs_advanced_gen = has_text_intent or has_quotes
        
        # 2. Determine Strategy
        strategy = "crawl" 
        
        if source_preference == "web_search":
            strategy = "crawl"
        elif source_preference == "generation":
            if needs_advanced_gen:
                strategy = "generation" 
                print("DEBUG: Prompt requires advanced generation (GLM-Image). Keeping generation strategy.")
            else:
                strategy = "crawl" 
                print("DEBUG: Prompt is simple illustration. Switching from Generation to Crawl (per user policy).")
        
        # 3. Execute Strategy
        result_obj = None
        
        if strategy == "crawl":
            keyword = search_keyword if search_keyword else prompt
            print(f"DEBUG: Executing Crawl for: {keyword}")
            images = self.crawl_images(keyword, limit=1)
            if images:
                # images[0] is now a dict {'url': ..., 'source_url': ...}
                result_obj = images[0]
                result_obj['source'] = 'web_search'
            
            if not result_obj:
                print("DEBUG: Crawl failed. Fallback to GLM-Image Generation.")
                gen_url = self._generate_image_api(prompt)
                if gen_url:
                    result_obj = {'url': gen_url, 'source': 'generation', 'source_url': None}
                
        elif strategy == "generation":
            print("DEBUG: Executing Generation (GLM-Image)")
            gen_url = self._generate_image_api(prompt)
            if gen_url:
                result_obj = {'url': gen_url, 'source': 'generation', 'source_url': None}
            
            if not result_obj:
                print("DEBUG: Generation failed. Fallback to Crawl.")
                keyword = search_keyword if search_keyword else prompt
                images = self.crawl_images(keyword, limit=1)
                if images:
                    result_obj = images[0]
                    result_obj['source'] = 'web_search'

        if result_obj:
             print(f"DEBUG: Successfully obtained image: {result_obj['url']}")
             return result_obj
        else:
             print("ERROR: Failed to find suitable image after all attempts.")
             return None

    def _generate_image_api(self, prompt):
        """
        Internal method for calling the Generation API.
        STRICTLY uses GLM-Image (Expensive) as requested.
        """
        headers = self.get_headers()
        # Always use GLM-Image as per user request ("expensive one")
        model = "glm-image" 
        
        # Rate Limiting Logic for GLM-Image (Concurrency 1)
        current_time = time.time()
        wait_duration = 3.0
        last_time = self.last_req_time["glm-image"]
        if current_time - last_time < wait_duration:
            time.sleep(wait_duration - (current_time - last_time))
        self.last_req_time["glm-image"] = time.time()
        
        data = {
            "model": model, 
            "prompt": prompt,
            "size": "1024x1024" 
        }
        
        try:
            response = requests.post(self.image_url, headers=headers, json=data)
            if response.status_code == 200:
                result = response.json()
                if "data" in result and len(result["data"]) > 0:
                    return result["data"][0]["url"]
            
            print(f"WARNING: GLM-Image failed (Status: {response.status_code}).")
            # No fallback to CogView-3-Plus because user said it's "rotten"
            
        except Exception as e:
            print(f"Gen API error: {e}")
            
        return None

    def plan_journal_structure(self, user_message, search_context):
        """
        Step 1: Planner Agent (GLM-4-Flash)
        Decides the structure of the journal.
        Returns a list of block definitions (dict).
        """
        print(f"DEBUG: Planning journal structure for: {user_message}")
        headers = self.get_headers()
        
        system_prompt = (
            "You are an expert Content Architect for a study journal app.\n"
            "Your goal is to plan the structure of a journal page based on the user's topic and search results.\n"
            "Output a JSON Array of 'Block Tasks'. Each task defines what content should be generated later.\n"
            "Block Types: 'header', 'intro' (split), 'concept' (split), 'timeline', 'summary' (note), 'resources' (resource_list).\n"
            "Do NOT use 'code' or 'mermaid' blocks.\n"
            "For 'timeline', if the topic involves history/steps, use 'timeline'.\n"
            "Return JSON Array ONLY. Use double quotes for JSON."
        )
        
        user_prompt = (
            f"Topic: {user_message}\n"
            f"Search Context: {search_context[:2000]}...\n" # Truncate to save tokens, planner needs high level
            "Plan the blocks. Make it rich and structured."
        )
        
        data = {
            "model": "glm-4-flash", # Fast model for planning
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.5,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = requests.post(self.chat_url, headers=headers, json=data)
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                # Clean code blocks if present
                content = re.sub(r'^```json', '', content)
                content = re.sub(r'^```', '', content)
                content = content.strip()
                # Find start/end of array
                start = content.find('[')
                end = content.rfind(']') + 1
                if start != -1 and end != -1:
                    content = content[start:end]
                    return json.loads(content)
        except Exception as e:
            print(f"Planning failed: {e}")
            
        # Fallback Plan if planner fails
        return [
            {"type": "header", "topic": user_message},
            {"type": "intro", "topic": f"Introduction to {user_message}"},
            {"type": "concept", "topic": "Key Concepts"},
            {"type": "summary", "topic": "Summary"},
            {"type": "resources", "topic": "Resources"}
        ]

    def _clean_json_response(self, content):
        """Helper to clean markdown code blocks from LLM response"""
        if not content: return "{}"
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        return content.strip()

    def generate_block_content(self, block_plan, search_context, global_topic=None):
        """
        Worker: Generates content for a specific block
        """
        block_type = block_plan.get('type')
        # Use specific topic from plan, or fall back to global topic
        topic = block_plan.get('topic') or global_topic or "General Topic"
        
        # Map plan type to internal type
        if block_type == 'header':
            prompt = f'Generate a "header" block for "{topic}". JSON format: {{"type": "layout_block", "block_type": "header", "content": {{"title": "The Main Title (Required)", "subtitle": "A Short Subtitle"}}}}'
        elif block_type == 'intro':
            prompt = (
                f'Generate an "intro" block for "{topic}".\n'
                f'Context: {search_context}\n'
                'Write a engaging introduction.\n'
                'JSON format: {"type": "layout_block", "block_type": "intro", "content": "Markdown content..."}'
            )
        elif block_type == 'timeline':
            prompt = (
                f'Generate a "timeline" block for "{topic}".\n'
                f'Context: {search_context}\n'
                'List 3-5 key milestones.\n'
                'JSON format: {"type": "layout_block", "block_type": "timeline", "content": [{"year": "2023", "title": "Event", "description": "Desc"}, ...]}'
            )
        # REMOVED: code block handling
        elif block_type == 'resources':
            prompt = (
                f'Generate a "resources" block for "{topic}".\n'
                f'Context: {search_context}\n'
                'List 3-5 key resources/links.\n'
                'JSON format: {"type": "layout_block", "block_type": "resources", "content": [{"title": "Resource Name", "url": "http...", "type": "Article"}, ...]}'
            )
        else: # split, note, gallery
            b_type = 'split' if block_type in ['intro', 'concept'] else block_type
            if block_type == 'summary': b_type = 'note'
            
            if b_type == 'split':
                prompt = (
                    f'Generate a "split" block for topic: "{topic}".\n'
                    f'Context: {search_context}\n'
                    'CRITICAL: You MUST include Markdown hyperlinks [Keyword](URL) in the text using URLs from the context.\n'
                    'Describe an image prompt for the right side.\n'
                    'JSON format: {"type": "layout_block", "block_type": "split", "content": {"text": "Markdown content...", "image_prompt": "detailed image description", "image_caption": "short caption"}}'
                )
            elif b_type == 'note':
                prompt = (
                    f'Generate a "note" (sticky note) block for topic: "{topic}".\n'
                    f'Context: {search_context}\n'
                    'Keep it concise and summarized.\n'
                    'JSON format: {"type": "layout_block", "block_type": "note", "content": "Markdown text content..."}'
                )
            else:
                prompt = (
                    f'Generate a "{b_type}" block for topic: "{topic}".\n'
                    f'Context: {search_context}\n'
                    f'JSON format: {{"type": "layout_block", "block_type": "{b_type}", "content": {{...}}}}'
                )

        try:
            response = requests.post(
                self.chat_url,
                headers=self.get_headers(),
                json={
                    "model": "glm-4-plus", # Use capable model
                    "messages": [
                        {"role": "system", "content": "You are a JSON generator. You ONLY return valid JSON. Do NOT include markdown formatting like ```json."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                content = self._clean_json_response(content)
                
                block_data = json.loads(content)
                
                # SPECIAL HANDLING: REMOVED Mermaid Code Cleaning
                
                # Fix for "split" block content access (ensure it's an object)
                if block_data.get('type') == 'layout_block' and block_data.get('block_type') == 'split':
                     # If LLM returned text instead of object, fix it
                     if isinstance(block_data.get('content'), str):
                         block_data['content'] = {
                             "text": block_data['content'],
                             "image_prompt": f"Illustration for {topic}",
                             "image_caption": topic
                         }

                return block_data
        except Exception as e:
            print(f"Worker failed for {block_type}: {e}")
            return None

    def generate_journal_layout(self, user_message):
        """
        Orchestrator: Plan -> Concurrent Generation -> Stream Ordered Results
        """
        # 1. Search
        print(f"DEBUG: Performing web search for: {user_message}")
        search_data = self.web_search(user_message)
        search_context = ""
        if search_data and "search_result" in search_data:
            results = search_data["search_result"]
            for item in results[:5]:
                search_context += f"Title: {item.get('title')}\nURL: {item.get('link')}\nInfo: {item.get('content')}\n\n"
        
        # 2. Plan
        plan = self.plan_journal_structure(user_message, search_context)
        print(f"DEBUG: Plan generated: {len(plan)} blocks")
        if plan:
             print(f"DEBUG: Plan details: {[b.get('type') for b in plan]}")
        
        # --- NEW: Yield Plan for Frontend Skeleton ---
        yield {"type": "plan", "data": plan}
        
        # 3. Concurrent Execution
        import concurrent.futures
        
        print("DEBUG: Starting concurrent execution...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Submit all tasks. Keep track of order.
            future_to_index = {
                executor.submit(self.generate_block_content, block, search_context, user_message): i 
                for i, block in enumerate(plan)
            }
            
            # We want to yield in order (0, 1, 2...), but tasks finish randomly.
            # We must buffer results.
            results_buffer = {}
            next_yield_index = 0
            
            # Iterate as they complete
            for future in concurrent.futures.as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    data = future.result()
                    if data:
                        print(f"DEBUG: Task {index} ({plan[index].get('type')}) completed successfully.")
                        results_buffer[index] = data
                    else:
                        print(f"ERROR: Task {index} ({plan[index].get('type')}) returned None. Yielding Error Block.")
                        results_buffer[index] = {"type": "error", "content": "Content generation failed."}
                except Exception as e:
                    print(f"ERROR: Task {index} exception: {e}")
                    results_buffer[index] = {"type": "error", "content": str(e)}
                
                # Check if we can yield the next expected block(s)
                while next_yield_index in results_buffer:
                    print(f"DEBUG: Yielding block {next_yield_index}")
                    yield results_buffer[next_yield_index]
                    del results_buffer[next_yield_index] # Free memory
                    next_yield_index += 1
        print("DEBUG: All tasks finished.")



