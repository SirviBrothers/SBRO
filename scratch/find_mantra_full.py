import json
import re

log_file = r"C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.system_generated\logs\transcript_full.jsonl"

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if '||' in content or 'mantra' in content.lower():
                idx = content.find('||')
                if idx != -1:
                    print(f"Found '||': {content[max(0, idx-50):min(len(content), idx+500)]}")
                else:
                    idx = content.lower().find('mantra')
                    print(f"Found 'mantra': {content[max(0, idx-50):min(len(content), idx+500)]}")
        except Exception as e:
            pass
