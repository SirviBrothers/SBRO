import subprocess
import re
import os

app_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js'

def fix_errors():
    max_iterations = 20
    for _ in range(max_iterations):
        result = subprocess.run(['node', '-c', app_path], capture_output=True, text=True)
        if result.returncode == 0:
            print("Syntax is OK!")
            return True
            
        error_output = result.stderr
        
        # Look for the line number in the error output
        # Example: c:\Users\ompra\Desktop\Sirvi Brothers\js\app.js:837
        match = re.search(r'js[\\/]app\.js:(\d+)', error_output)
        if not match:
            print("Could not find line number in error:")
            print(error_output)
            return False
            
        line_num = int(match.group(1)) - 1 # 0-indexed
        
        with open(app_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Traverse upwards from line_num to find the nearest `function ` definition
        # or `const ... = (` or `... = function(`
        found = False
        for i in range(line_num, -1, -1):
            line = lines[i]
            
            # Match `function xyz(` but not `async function xyz(`
            if 'function ' in line and 'async function' not in line:
                lines[i] = line.replace('function ', 'async function ')
                found = True
                print(f"Fixed function definition at line {i+1} (caused by await at line {line_num+1})")
                break
                
            # Match `xyz = (` but not `xyz = async (`
            if re.search(r'\w+\s*=\s*\(', line) and 'async ' not in line:
                lines[i] = re.sub(r'(\w+\s*=\s*)\(', r'\1async (', line)
                found = True
                print(f"Fixed arrow function definition at line {i+1}")
                break
                
        if not found:
            print(f"Could not find enclosing function for line {line_num+1}")
            # maybe it's inside a forEach loop we missed?
            # Let's check the line itself
            print("Line content:", lines[line_num])
            return False
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
    print("Reached max iterations")
    return False

fix_errors()
