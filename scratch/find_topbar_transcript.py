import json
import re

log_file = r"C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.system_generated\logs\transcript.jsonl"

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if 'top-bar' in content:
                print(f"[{data.get('type')}] Found top-bar! Length: {len(content)}")
                # Print the context around top-bar
                idx = content.find('top-bar')
                print(content[max(0, idx-100):min(len(content), idx+500)])
                print("===========================")
        except Exception as e:
            pass
