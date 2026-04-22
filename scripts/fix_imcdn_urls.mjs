import { readFileSync, writeFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/golden-ring-tours.ts'];

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const regex = /(https:\/\/imcdn\.bolshayastrana\.com\/\d+x\d+\/BS_[a-f0-9]+)(?!\.)/g;
  let count = 0;
  content = content.replace(regex, (match) => {
    count++;
    return match + '.jpeg';
  });
  writeFileSync(file, content, 'utf-8');
  console.log(`${file}: fixed ${count} URLs`);
}
