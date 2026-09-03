from PIL import Image

src_path = r'C:\Users\ompra\.gemini\antigravity-ide\brain\3d72163d-7141-44c7-a603-82d0d62f0d99\nimbu_mirchi_1788373441964.jpg'
out_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\assets\nimbu.png'

with Image.open(src_path) as img:
    img = img.convert('RGBA')
    datas = img.getdata()
    
    newData = []
    for r, g, b, a in datas:
        dist_white = ((255-r)**2 + (255-g)**2 + (255-b)**2) ** 0.5
        grayness = max(r,g,b) - min(r,g,b)
        
        # Pure/near white background
        if dist_white < 50:
            newData.append((255, 255, 255, 0))
        # Shadows or off-white JPEG artifacts (grayish and relatively bright)
        elif grayness < 30 and dist_white < 120:
            newData.append((r, g, b, 0))
        else:
            newData.append((r, g, b, 255))
            
    img.putdata(newData)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, 'PNG')
    print("Nimbu processed and saved to", out_path)
