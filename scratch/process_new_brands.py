import os
from PIL import Image

files = {
    'bajaj': r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373196943.png',
    'usha': r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373197034.png',
    'rr': r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373197053.jpg',
    'havells': r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373197441.png'
}

out_dir = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\brands'

for name, src in files.items():
    with Image.open(src) as img:
        img = img.convert('RGBA')
        datas = img.getdata()
        
        newData = []
        for r, g, b, a in datas:
            # simple white removal
            if r > 240 and g > 240 and b > 240:
                newData.append((255, 255, 255, 0))
            else:
                newData.append((r, g, b, 255))
                
        img.putdata(newData)
        
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        out_path = os.path.join(out_dir, f'{name}.png')
        img.save(out_path, 'PNG')
        print(f'Processed and saved {name}.png')
