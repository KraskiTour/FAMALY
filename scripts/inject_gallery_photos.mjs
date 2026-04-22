/**
 * Inject scraped photos into tours with empty galleries.
 * Cleans: removes duplicates, http→https, removes -1024x... size variants.
 */
import { readFileSync, writeFileSync } from 'fs';

const galleries = {
  '1': [
    'https://amra-turistik.ru/wp-content/uploads/2019/07/0B4C4E46-990D-4EB2-A9C8-94D90F8DC26E.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/9D7720EF-1DD6-4BCA-8EB0-5B775550227E.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/5649FC67-8671-4E90-BD31-C961A2545F0B.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/50138288-676F-4379-9EF3-1C10ABDA33DE.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/A41DEA8F-60C2-47E9-8F60-B5F94BD884CC.jpeg',
  ],
  '2': [
    'https://amra-turistik.ru/wp-content/uploads/2019/07/2CE735D5-DEC9-4204-B9D9-5948AF0BC0BB.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/0EF8E226-DF7E-4B41-92F7-D7E80636C066.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/6D45CCF8-6398-4A3C-AC81-2430AC10806A.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/6DD74773-820F-4887-8FC7-472B1AC228C3.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/061DC265-5936-4EBF-8E31-D9C4E667ED33.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/721029CB-0EF1-42F0-9178-4B5A913BACC4.jpeg',
  ],
  '17': [
    'https://amra-turistik.ru/wp-content/uploads/2024/12/svmjx8huawouoh6xichl8xqag2pkbianp_hrte5l5pgxclndkjklvlbrjsmhiqq5daqfebqpgmygv3s_ts38ac8u.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2024/12/opengraph_1628512786.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2021/11/1621009561_74-p-sosna-kryuchkovataya-foto-87.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/B9EF3DFB-B626-4D54-8EA0-B9510CDBD039.jpeg',
    'https://amra-turistik.ru/wp-content/uploads/2019/07/A41DEA8F-60C2-47E9-8F60-B5F94BD884CC.jpeg',
  ],
  '20': [
    'https://amra-turistik.ru/wp-content/uploads/2024/04/1663365368_47-mykaleidoscope-ru-p-arkhitektura-rostova-na-donu-krasivo-51.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2019/11/h2o_waterpark_rostov-on-don_russia-4.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2019/11/h2o_waterpark_rostov-on-don_russia-10.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2019/11/h2o_waterpark_rostov-on-don_russia-14.jpg',
  ],
  '22': [
    'https://amra-turistik.ru/wp-content/uploads/2022/02/kalmykiya.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2022/02/kalmykiya35641278.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2022/02/4_1.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2022/02/772a0f831a3b54acbeed8925a98d219a.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2022/02/110048_original.jpg',
  ],
  '24': [
    'https://amra-turistik.ru/wp-content/uploads/2022/03/594357_900.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2022/03/img_1452-copy-1.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2020/03/img_5127-scaled.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2020/03/img_5638-scaled.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2020/03/p1010634-scaled.jpg',
    'https://amra-turistik.ru/wp-content/uploads/2022/03/z8a-fr5iqmy.jpg',
  ],
  // ID 25 - Сочи: URL didn't work, use Unsplash Sochi images
  '25': [
    'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=600&fit=crop',
  ],
  // ID 5 - Кандагар (Пятигорск+Кисловодск) - use Unsplash KMV images
  '5': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=800&h=600&fit=crop',
  ],
  // ID 26 - Кандагар (5 городов КМВ) - use Unsplash mountain/spa images
  '26': [
    'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
  ],
};

const filePath = 'data/mock-tours.ts';
let code = readFileSync(filePath, 'utf-8');
let count = 0;

for (const [id, photos] of Object.entries(galleries)) {
  // Find the tour by ID
  const idPattern = `id: '${id}'`;
  const idIdx = code.indexOf(idPattern);
  if (idIdx === -1) {
    console.log(`ID ${id}: NOT FOUND`);
    continue;
  }

  // Find gallery: [] near this ID
  const chunk = code.slice(idIdx, idIdx + 5000);
  const galIdx = chunk.indexOf("gallery: []");
  if (galIdx === -1) {
    console.log(`ID ${id}: gallery: [] not found (might already have photos)`);
    continue;
  }

  const absIdx = idIdx + galIdx;
  const items = photos.map(p => `      '${p}'`).join(',\n');
  const newGallery = `gallery: [\n${items},\n    ]`;

  code = code.slice(0, absIdx) + newGallery + code.slice(absIdx + "gallery: []".length);
  console.log(`ID ${id}: injected ${photos.length} photos`);
  count++;
}

writeFileSync(filePath, code);
console.log(`\nTotal: ${count} galleries updated`);
