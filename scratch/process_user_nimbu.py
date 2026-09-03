from PIL import Image
import math

src_path = r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373677868.png'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\nimbu.png'

with Image.open(src_path) as img:
    img = img.convert('RGBA')
    datas = img.getdata()
    
    newData = []
    for r, g, b, a in datas:
        # The background is a solid blue.
        # Blue channel is dominant.
        if b > r + 15 and b > g - 20 and b > 40:
            # It's the blue background.
            newData.append((0, 0, 0, 0))
        else:
            newData.append((r, g, b, 255))
            
    img.putdata(newData)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, 'PNG')
    print("User nimbu processed and saved to", out_path)
