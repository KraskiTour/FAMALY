import re

with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', encoding='utf-8') as f:
    text = f.read()

# Split by tour blocks
tour_blocks = re.split(r"  // ─── \d+\.", text)[1:]
print(f'Total tour blocks: {len(tour_blocks)}')

for i, block in enumerate(tour_blocks):
    tour_id = re.search(r"id: '(\d+)'", block)
    tid = tour_id.group(1) if tour_id else '?'
    
    title_m = re.search(r"title: '(.*?)'", block)
    title = title_m.group(1) if title_m else 'NO TITLE'
    
    gallery_m = re.search(r"gallery: \[(.*?)\]", block, re.DOTALL)
    gallery_content = gallery_m.group(1).strip() if gallery_m else 'NO GALLERY'
    img_count = len(re.findall(r'https://', gallery_content)) if gallery_m else 0
    
    itin_m = re.findall(r"itinerary:", block)
    
    desc_m = re.search(r"fullDescription: '(.*?)'", block, re.DOTALL)
    desc_len = len(desc_m.group(1)) if desc_m else 0
    
    flag = ' *** EMPTY GALLERY ***' if img_count == 0 else ''
    flag2 = ' *** SHORT DESC ***' if desc_len < 50 else ''
    print(f'  {tid}: {title[:55]:55s} | imgs={img_count:2d} | desc={desc_len:4d}{flag}{flag2}')
