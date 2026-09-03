import re

html_path = r'c:\Users\ompra\Desktop\Sirvi Brothers\login.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will add a @media query block before the closing </style> tag
media_query = """
  @media (max-width: 768px) {
      .header-row {
          padding: 10px 20px 20px 20px;
      }
      .goddess-frame {
          width: 80px;
          height: 80px;
      }
      .goddess-wrap div {
          font-size: 0.9rem !important;
      }
      .nimbu-totem {
          height: 90px;
      }
      img[alt="Sirvi Brothers Logo"] {
          margin-top: -20px !important;
          width: 180px !important;
      }
      .switchboard-container {
          transform: scale(0.85);
          margin-top: -10px;
      }
      .bottom-brand-bar {
          padding: 10px 0;
      }
      .logo-box {
          height: 35px;
      }
  }
"""

content = content.replace('</style>', media_query + '\n</style>')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Added mobile responsive CSS to login.html.")
