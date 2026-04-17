import re

with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', encoding='utf-8') as f:
    text = f.read()

tour_blocks = re.split(r"  // ─── \d+\.", text)[1:]

total_cities = 0
total_with_time = 0
total_with_point = 0

for block in tour_blocks:
    tid = re.search(r"id: '(\d+)'", block).group(1)
    title = re.search(r"title: '(.*?)'", block).group(1)[:40]
    
    cities = re.findall(r"city: '(.*?)'", block)
    times = re.findall(r"departureTime: '(.*?)'", block)
    points = re.findall(r"meetingPoint: '(.*?)'", block)
    
    has_time = sum(1 for t in times if t)
    has_point = sum(1 for p in points if p)
    
    total_cities += len(cities)
    total_with_time += has_time
    total_with_point += has_point
    
    status = 'OK' if has_time == len(cities) else f'WARN: {has_time}/{len(cities)} times'
    print(f'{tid} | {len(cities)} cities | {has_time} times | {has_point} points | {status} | {title}')

print(f'\nТОТАЛ: {len(tour_blocks)} туров, {total_cities} городов, {total_with_time} с временем, {total_with_point} с адресом')
