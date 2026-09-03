from PIL import Image

src_path = r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\.user_uploaded\media_1788373985197.png'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\nimbu.png'

with Image.open(src_path) as img:
    img = img.convert('RGBA')
    datas = img.getdata()
    
    newData = []
    for r, g, b, a in datas:
        # Background is dark grey/black.
        # We want to remove the hazy edge pixels which are dark mixes.
        # Lemon is yellow (high R, high G).
        # Chili is green (high G).
        # Thread is white/grey (high RGB).
        
        # Calculate saturation and brightness
        brightness = max(r, g, b)
        if brightness == 0:
            saturation = 0
        else:
            saturation = (brightness - min(r, g, b)) / brightness
            
        # Remove dark background and dark hazy edges
        if brightness < 80:
            newData.append((0, 0, 0, 0))
        # Remove grey hazy pixels that aren't the bright white thread
        elif brightness < 150 and saturation < 0.2:
            newData.append((0, 0, 0, 0))
        else:
            # For edge pixels that are somewhat dark, make them partially transparent 
            # to blend them into the white background smoothly, rather than leaving dirty outlines.
            if brightness < 120:
                alpha = int((brightness - 80) / 40 * 255)
                # boost the color to make it not dirty
                newData.append((min(255, r+30), min(255, g+30), min(255, b+30), alpha))
            else:
                newData.append((r, g, b, 255))
            
    img.putdata(newData)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, 'PNG')
    print("User cartoon nimbu processed and saved to", out_path)
