import os

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

new_html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sign In — Sirvi Brothers</title>
<style>
  :root{
    --gold: #f4b93f;
    --gold-soft: #e9c46a;
    --saffron: #ff8a34;
  }

  *{ box-sizing: border-box; }

  html,body{
    margin:0;
    padding:0;
    width:100%;
    min-height:100%;
    background: #F3F4F6;
    font-family: 'Segoe UI', 'Noto Sans', system-ui, sans-serif;
    color: #1F2937;
    overflow-x:hidden;
  }

  .stage{
    position:relative;
    min-height: 100vh;
    width:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    padding-bottom: 120px; /* space for bottom bar */
  }

  /* ---------- header row ---------- */
  .header-row{
    width:100%;
    display:flex;
    justify-content:center;
    align-items:flex-start;
    gap: 40px;
    padding: 30px 40px;
    position:relative;
    z-index:4;
  }

  .goddess-wrap{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:6px;
  }
  .goddess-frame{
    width:156px;
    height:156px;
    border-radius:50%;
    padding:3px;
    background: conic-gradient(from 0deg, var(--gold), var(--saffron), var(--gold-soft), var(--gold));
    box-shadow: 0 0 22px rgba(244,185,63,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .goddess-frame img{
    width:100%;
    height:100%;
    border-radius:50%;
    object-fit:cover;
    background:#fff;
  }

  /* Nimbu Mirchi */
  @keyframes swing {
      0%, 100% { transform: rotate(8deg); }
      50% { transform: rotate(-8deg); }
  }
  .nimbu-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: -10px;
  }
  .nimbu-totem {
      height: 180px; /* Made more prominent */
      width: auto;
      object-fit: contain;
      transform-origin: top center;
      animation: swing 3.5s ease-in-out infinite;
      filter: drop-shadow(0px 10px 20px rgba(0,0,0,0.3));
  }

  /* ---------- center content ---------- */
  .center-content{
    flex:1;
    width:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content: center;
    text-align:center;
    position:relative;
    z-index:3;
    padding-top: 20px;
  }

  /* --- REALISTIC SWITCHBOARD SIGN IN --- */
  
  .switchboard-container {
      margin-top: 20px;
      position: relative;
      width: 280px;
      height: 280px;
      border-radius: 8px;
      /* Outer metallic frame */
      background: linear-gradient(135deg, #e0e0e0 0%, #ffffff 20%, #c0c0c0 50%, #909090 80%, #ffffff 100%);
      padding: 12px;
      box-shadow: 
          0 20px 40px rgba(0,0,0,0.2), 
          inset 0 1px 2px rgba(255,255,255,0.8),
          inset 0 -2px 4px rgba(0,0,0,0.4);
  }

  .switchboard-glass {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #3a4454 0%, #222933 100%);
      border-radius: 4px;
      box-shadow: inset 0 4px 10px rgba(0,0,0,0.6), 0 1px 1px rgba(255,255,255,0.4);
      padding: 30px 25px;
      display: flex;
      flex-direction: column;
      justify-content: center;
  }

  .switchboard-inner-frame {
      width: 100%;
      height: 100%;
      /* Silver outline around switches */
      background: linear-gradient(to bottom, #dcdcdc, #888888);
      padding: 4px;
      border-radius: 4px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      gap: 3px;
  }

  .switch-row-top {
      display: flex;
      gap: 3px;
      height: 50%;
  }

  .switch-dummy {
      flex: 1;
      background: linear-gradient(to bottom, #5a6678, #455060);
      border-radius: 2px;
      box-shadow: 
          inset 0 2px 4px rgba(255,255,255,0.15),
          inset 0 -2px 6px rgba(0,0,0,0.4),
          0 2px 3px rgba(0,0,0,0.4);
      position: relative;
  }
  
  /* Indicator line on dummy switches */
  .switch-dummy::after {
      content: '';
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 25px;
      height: 3px;
      background: #7a8698;
      border-radius: 2px;
      box-shadow: inset 0 1px 1px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.1);
  }

  /* The actual Sign In interactive switch */
  .switch-signin {
      flex: 1;
      height: 50%;
      background: linear-gradient(to bottom, #5a6678, #455060);
      border-radius: 2px;
      box-shadow: 
          inset 0 2px 4px rgba(255,255,255,0.15),
          inset 0 -3px 8px rgba(0,0,0,0.4),
          0 4px 6px rgba(0,0,0,0.5);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #151a22;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-shadow: 0 1px 1px rgba(255,255,255,0.1);
      cursor: pointer;
      transition: all 0.15s ease;
  }
  
  .switch-signin:hover {
      background: linear-gradient(to bottom, #616e80, #4c5768);
  }

  /* Pressed state */
  .switch-signin:active {
      box-shadow: 
          inset 0 4px 10px rgba(0,0,0,0.5),
          0 1px 1px rgba(255,255,255,0.2);
      transform: translateY(1px);
      background: linear-gradient(to bottom, #455060, #3a4351);
  }


  /* ---------- bottom brand bar ---------- */
  .bottom-brand-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
      padding: 15px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 10;
  }

  .bottom-brand-title {
      font-size: 12px;
      font-weight: 700;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
  }

  .brand-scroller {
      width: 100%;
      max-width: 1000px;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 25px;
      padding: 0 20px;
  }

  .logo-box {
      height: 45px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      cursor: pointer;
  }
  .logo-box:hover {
      transform: translateY(-3px);
  }
  .logo-box img {
      height: 100%;
      width: auto;
      object-fit: contain;
      filter: grayscale(100%) opacity(0.7);
      transition: filter 0.2s ease;
  }
  .logo-box:hover img {
      filter: grayscale(0%) opacity(1);
  }
  
  /* V-Guard usually has a black background in the previous setup, invert or handle specially */
  .logo-box.dark-box img {
      filter: grayscale(100%) opacity(0.7) invert(0.8);
  }
  .logo-box.dark-box:hover img {
      filter: none;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

</style>
</head>
<body>

<div class="stage">

  <div class="header-row">
    <div class="goddess-wrap">
      <div class="goddess-frame" title="Shree Aai Mataji">
        <img src="assets/mataji.jpg" alt="Shree Aai Mataji">
      </div>
      <div style="color: #B45309; font-weight: 800; font-size: 1.2rem; margin-top: 8px;">Jai Mata Di</div>
    </div>
    
    <div class="nimbu-wrap">
        <img src="assets/nimbu.png" alt="Nimbu Mirchi" class="nimbu-totem">
    </div>
  </div>

  <div class="center-content">
    <img src="assets/sb_logo.png" alt="Sirvi Brothers Logo" style="width: 240px; height: auto; margin-bottom: 5px; filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.15)); z-index: 5;">
    
    <!-- Realistic Switchboard Sign In -->
    <div class="switchboard-container">
        <div class="switchboard-glass">
            <div class="switchboard-inner-frame">
                <div class="switch-row-top">
                    <div class="switch-dummy"></div>
                    <div class="switch-dummy"></div>
                </div>
                <a href="index.html" class="switch-signin">Sign In</a>
            </div>
        </div>
    </div>
    
  </div>

  <!-- Bottom Brand Bar -->
  <div class="bottom-brand-bar">
      <div class="bottom-brand-title">Trusted By Leading Brands</div>
      <div class="brand-scroller">
          <div class="logo-box" title="GM Modular"><img src="assets/brands/gm.png" alt="GM Modular"></div>
          <div class="logo-box" title="Crompton"><img src="assets/brands/crompton.png" alt="Crompton"></div>
          <div class="logo-box" title="Indo"><img src="assets/brands/indo.png" alt="Indo"></div>
          <div class="logo-box dark-box" title="V-Guard"><img src="assets/brands/vguard.png" alt="V-Guard"></div>
          <div class="logo-box" title="Bajaj"><img src="assets/brands/bajaj.png" alt="Bajaj"></div>
          <div class="logo-box" title="Usha"><img src="assets/brands/usha.png" alt="Usha"></div>
          <div class="logo-box" title="RR Kabel"><img src="assets/brands/rr.png" alt="RR Kabel"></div>
          <div class="logo-box" title="Havells"><img src="assets/brands/havells.png" alt="Havells"></div>
      </div>
  </div>

</div>

</body>
</html>
"""

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("SUCCESS: Refactored login.html layout with realistic switchboard and bottom brand bar.")
