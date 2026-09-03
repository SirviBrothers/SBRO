from PIL import Image

src_path = r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373985197.png'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\nimbu.png'

with Image.open(src_path) as img:
    img = img.convert('RGBA')
    datas = img.getdata()
    
    newData = []
    for r, g, b, a in datas:
        # The background is dark (black/dark blue/dark grey)
        # We want to keep the green chilies, yellow lemon, and white thread.
        # Green chili has high G, Lemon has high R and G, Thread has high RGB.
        # Background is dark.
        if max(r, g, b) < 65:
            # It's the dark background
            newData.append((0, 0, 0, 0))
        else:
            newData.append((r, g, b, 255))
            
    img.putdata(newData)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, 'PNG')
    print("User cartoon nimbu processed and saved to", out_path)
