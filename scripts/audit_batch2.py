import re

with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', encoding='utf-8') as f:
    text = f.read()

tour_blocks = re.split(r"  // ─── \d+\.", text)[1:]

print("=" * 80)
print("АУДИТ: города отправления, время, точки сбора")
print("=" * 80)

issues = []

for i, block in enumerate(tour_blocks):
    tid = re.search(r"id: '(\d+)'", block)
    tid = tid.group(1) if tid else '?'
    
    title_m = re.search(r"title: '(.*?)'", block)
    title = title_m.group(1)[:50] if title_m else '?'
    
    # Check departureCities
    cities = re.findall(r"city: '(.*?)'", block)
    times = re.findall(r"departureTime: '(.*?)'", block)
    points = re.findall(r"meetingPoint: '(.*?)'", block)
    
    empty_times = sum(1 for t in times if t == '')
    empty_points = sum(1 for p in points if p == '')
    
    # Check nextDates
    dates = re.findall(r"start: '(.*?)'", block)
    prices = re.findall(r"price: (\d+)", block)
    
    # Check destination/region
    dest = re.search(r"destination: '(.*?)'", block)
    dest = dest.group(1) if dest else '?'
    region = re.search(r"region: '(.*?)'", block)
    region = region.group(1) if region else '?'
    
    # Check duration
    dur = re.search(r"durationDays: (\d+)", block)
    dur = dur.group(1) if dur else '?'
    
    print(f"\n--- ID {tid}: {title}")
    print(f"  Регион: {dest} | Длительность: {dur} дн.")
    print(f"  Города ({len(cities)}): {', '.join(cities)}")
    
    if empty_times > 0 or empty_points > 0:
        print(f"  ⚠ ПРОБЛЕМА: пустое время={empty_times}/{len(times)}, пустые точки сбора={empty_points}/{len(points)}")
        issues.append(f"ID {tid}: пустые время/точки у {empty_times} городов")
    else:
        for c, t, p in zip(cities, times, points):
            print(f"    {c}: {t}, {p[:40]}")
    
    print(f"  Даты: {len(dates)} шт | Цены: {', '.join(prices[:3])}{'...' if len(prices) > 3 else ''}")

print("\n" + "=" * 80)
print(f"ИТОГО ПРОБЛЕМ: {len(issues)}")
for iss in issues:
    print(f"  - {iss}")
