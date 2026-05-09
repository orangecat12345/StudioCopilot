import os
import json
import re
from flask import Blueprint, render_template, jsonify, request, Response, stream_with_context, send_from_directory
from glm5_agent import GLM5Agent

leetcode_bp = Blueprint('leetcode', __name__, template_folder='templates')

LEETCODE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'source', 'LeetCodeAnimation-master')

# Initialize a separate GLM5Agent for LeetCode tutor to avoid mixing context with other workspaces
try:
    lc_agent = GLM5Agent()
except Exception:
    lc_agent = None

@leetcode_bp.route('/leetcode')
def index():
    return render_template('leetcode.html')

problem_bank_cache = []

def get_problem_bank():
    global problem_bank_cache
    if problem_bank_cache:
        return problem_bank_cache
        
    problems = []
    for d in sorted(os.listdir(LEETCODE_DIR)):
        if os.path.isdir(os.path.join(LEETCODE_DIR, d)) and (d[0].isdigit() or d.startswith('Interview')):
            target_dir = os.path.join(LEETCODE_DIR, d)
            article_dir = os.path.join(target_dir, 'Article')
            
            difficulty = "Medium"
            pass_rate = 50.0
            
            if os.path.exists(article_dir):
                md_files = [f for f in os.listdir(article_dir) if f.endswith('.md')]
                if md_files:
                    with open(os.path.join(article_dir, md_files[0]), 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        diff_match = re.search(r'题目难度为\s*(Easy|Medium|Hard|简单|中等|困难)', content, re.IGNORECASE)
                        if diff_match:
                            val = diff_match.group(1).lower()
                            if val in ['easy', '简单']: difficulty = 'Easy'
                            elif val in ['hard', '困难']: difficulty = 'Hard'
                            else: difficulty = 'Medium'
                            
                        pass_match = re.search(r'通过率为\s*([\d\.]+)%', content)
                        if pass_match:
                            pass_rate = float(pass_match.group(1))
            
            base_d = {'Easy': 1, 'Medium': 2, 'Hard': 3}.get(difficulty, 2)
            d_val = base_d * ((100 - pass_rate) / 100)
            
            problems.append({
                "id": d,
                "title": d,
                "difficulty": difficulty,
                "pass_rate": pass_rate,
                "D": d_val
            })
    problem_bank_cache = problems
    return problems

@leetcode_bp.route('/api/leetcode/list', methods=['GET'])
def get_list():
    problems = get_problem_bank()
    # return simple list for UI
    simple_list = [{"id": p["id"], "title": p["title"]} for p in problems]
    return jsonify({"status": "success", "data": simple_list})

@leetcode_bp.route('/api/leetcode/detail/<path:problem_id>', methods=['GET'])
def get_detail(problem_id):
    target_dir = os.path.join(LEETCODE_DIR, problem_id)
    if not os.path.exists(target_dir):
        return jsonify({"error": "Problem not found"}), 404
        
    # Read Markdown Article
    article_dir = os.path.join(target_dir, 'Article')
    full_content = "暂无文章"
    question_content = ""
    solution_content = ""
    
    if os.path.exists(article_dir):
        md_files = [f for f in os.listdir(article_dir) if f.endswith('.md')]
        if md_files:
            with open(os.path.join(article_dir, md_files[0]), 'r', encoding='utf-8') as f:
                full_content = f.read()
                
                # Split content into Question and Solution using common headers
                parts = re.split(r'\n(?=### 题目解析|### 动画描述|### 代码实现)', full_content, maxsplit=1)
                if len(parts) > 1:
                    question_content = parts[0]
                    solution_content = parts[1]
                else:
                    question_content = full_content
                    solution_content = "暂无解析"
                    
                # Fix image paths in markdown
                def fix_paths(text):
                    text = re.sub(r'\.\./Animation/([^)]+)', r'/api/leetcode/resource/{}/\1'.format(problem_id), text)
                    text = re.sub(r'\.\./\.\./Pictures/.*?\n', '', text) # Remove qr code or root pictures
                    return text
                
                question_content = fix_paths(question_content)
                solution_content = fix_paths(solution_content)
                
    # Find Animation
    animation_dir = os.path.join(target_dir, 'Animation')
    animations = []
    if os.path.exists(animation_dir):
        # Prefer gif, mp4
        for f in os.listdir(animation_dir):
            if f.endswith(('.gif', '.mp4', '.png', '.jpg')):
                animations.append(f)
                
    return jsonify({
        "status": "success", 
        "data": {
            "id": problem_id,
            "question": question_content,
            "solution": solution_content,
            "animations": animations
        }
    })

@leetcode_bp.route('/api/leetcode/resource/<path:problem_id>/<filename>')
def get_resource(problem_id, filename):
    target_dir = os.path.join(LEETCODE_DIR, problem_id, 'Animation')
    return send_from_directory(target_dir, filename)

@leetcode_bp.route('/api/leetcode/cat/recommend', methods=['POST'])
def cat_recommend():
    data = request.get_json() or {}
    theta = float(data.get('theta', 1.5))
    history = data.get('history', []) or []
    
    bank = get_problem_bank()
    
    # Exclude history
    available = [p for p in bank if p['id'] not in history]
    if not available:
        return jsonify({"error": "No more problems available"}), 400
        
    # Find closest D to theta
    available.sort(key=lambda x: abs(x['D'] - theta))
    
    # Pick the best match
    recommended = available[0]
    return jsonify({"status": "success", "data": recommended})

@leetcode_bp.route('/api/leetcode/cat/evaluate', methods=['POST'])
def cat_evaluate():
    data = request.get_json()
    problem_id = data.get('problem_id')
    code = data.get('code')
    theta = data.get('theta', 1.5)
    
    bank = get_problem_bank()
    prob = next((p for p in bank if p['id'] == problem_id), None)
    if not prob: return jsonify({"error": "Problem not found"}), 404
    
    # Read problem description
    target_dir = os.path.join(LEETCODE_DIR, problem_id)
    article_dir = os.path.join(target_dir, 'Article')
    content = "暂无内容"
    if os.path.exists(article_dir):
        md_files = [f for f in os.listdir(article_dir) if f.endswith('.md')]
        if md_files:
            with open(os.path.join(article_dir, md_files[0]), 'r', encoding='utf-8') as f:
                content = f.read()
                
    prompt = f"""
请评估以下LeetCode代码解答。
题目内容：
{content[:1500]}

学生代码：
```
{code}
```

请严格按照以下JSON格式输出评估结果（不要输出任何其他内容）：
{{
  "is_ac": true 或 false, // 代码是否完全正确
  "scores": {{
    "correctness": 0到10的整数, // 代码正确性
    "algorithm": 0到10的整数, // 算法思路
    "complexity": 0到10的整数, // 复杂度优化
    "code_quality": 0到10的整数 // 代码质量
  }},
  "feedback": "具体的指导和评价内容。指出问题或给出优化建议。如果完全正确，请给出相关的进阶问题或类似题目的思路以举一反三。"
}}
"""
    try:
        response = lc_agent.client.chat.completions.create(
            model="glm-4-plus",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        result_json = response.choices[0].message.content
        result = json.loads(result_json)
        
        # Calculate CAT
        s = result['scores']['correctness'] * 0.4 + \
            result['scores']['algorithm'] * 0.3 + \
            result['scores']['complexity'] * 0.2 + \
            result['scores']['code_quality'] * 0.1
        k = s / 10.0
        weight = prob['D'] * 0.2 * k
        
        if result['is_ac'] or result['scores']['correctness'] >= 6:
            new_theta = theta + weight
        else:
            new_theta = theta - weight
            
        new_theta = max(0, min(3, new_theta)) # clamp 0-3
        
        return jsonify({
            "status": "success",
            "evaluation": result,
            "old_theta": theta,
            "new_theta": new_theta,
            "D": prob['D'],
            "S": s
        })
    except Exception as e:
        # Fallback to a hardcoded error format if json parsing fails
        return jsonify({
            "status": "success",
            "evaluation": {
                "is_ac": False,
                "scores": {"correctness": 0, "algorithm": 0, "complexity": 0, "code_quality": 0},
                "feedback": f"模型评估格式异常或发生错误: {str(e)}"
            },
            "old_theta": theta,
            "new_theta": theta,
            "D": prob['D'],
            "S": 0
        })

@leetcode_bp.route('/api/leetcode/cat/report', methods=['POST'])
def cat_report():
    data = request.get_json() or {}
    history_evals = data.get('evals', [])
    theta = float(data.get('theta', 1.5))
    
    prompt = f"""
用户刚刚完成了一组自适应LeetCode刷题测验。
他的最终能力值 (Theta) 为: {theta:.2f} (范围0-3，0是纯新手，3是顶级高手)
他在测验中的各题得分情况如下：
{json.dumps(history_evals, ensure_ascii=False)}

请作为资深算法面试官，根据上述数据给他写一段不超过150字的总结性评语。
要求：
1. 语气专业、鼓励，必须指出他的强项和最明显的薄弱点（如时间复杂度优化不行，或是代码规范太差）。
2. 直接输出这段文本评语，不要任何Markdown格式。
"""
    try:
        response = lc_agent.client.chat.completions.create(
            model="glm-4-plus",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        report_text = response.choices[0].message.content
        return jsonify({"status": "success", "report": report_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@leetcode_bp.route('/api/leetcode/tutor', methods=['POST'])
def tutor():
    if not lc_agent:
        return jsonify({"error": "GLM5 Agent not initialized"}), 500
        
    data = request.get_json()
    message = data.get('message', '')
    context = data.get('context', '')
    mode = data.get('mode', 'chat') # 'chat' or 'submit'
    
    if not message:
        return jsonify({"error": "Message is required"}), 400

    if mode == 'submit':
        prompt = f"""当前题目：
{context}

学生提交的代码/答案：
```
{message}
```

请你作为一名专业的算法导师：
1. 首先判断学生的解答是否正确、有无边界问题或性能瓶颈。
2. 如果有错误，请指出问题所在，但不要直接给出完整正确代码，而是给出修改思路。
3. 如果完全正确，请给予表扬，并尝试【举一反三】：提出一个相关的进阶问题或类似题目的思路，引导学生继续思考。
语言要生动、鼓励。"""
    else:
        prompt = f"当前正在学习的LeetCode题目内容：\n{context}\n\n学生的提问：{message}\n\n请你作为一名专业的算法导师，引导学生思考，不要直接给出代码，用苏格拉底式提问或给出提示，语言要生动、鼓励。"

    def generate():
        try:
            for chunk in lc_agent.chat_stream(prompt, enable_web_search=False):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
            
    return Response(stream_with_context(generate()), content_type='text/event-stream')
