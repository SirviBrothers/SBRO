from PIL import Image, ImageOps
import os

src_path = r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788372435055.jpg'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\sb_logo.png'

with Image.open(src_path) as img:
    img = img.convert('RGBA')
    datas = img.getdata()
    
    # We want to make the white background transparent so it looks good on the dark login page
    newData = []
    for item in datas:
        # If it's very bright (close to white), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        # Edge blending for anti-aliasing
        elif item[0] > 220 and item[1] > 220 and item[2] > 220:
            # Calculate alpha based on how close to white it is
            avg = (item[0] + item[1] + item[2]) / 3
            alpha = int(255 - ((avg - 220) / 35 * 255))
            newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Crop to content (bounding box of non-transparent pixels)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, 'PNG')
    print("Logo processed and saved to", out_path)
