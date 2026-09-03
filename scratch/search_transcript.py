import json
import re

log_file = r"C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.system_generated\logs\transcript.jsonl"

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if '||' in content or 'sanskrit' in content.lower() or 'mantra' in content.lower():
                print(f"[{data.get('type')}] {content[:200]}...")
        except:
            pass
