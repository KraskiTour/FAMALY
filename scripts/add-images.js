const fs = require('fs');
const path = require('path');

const UNSPLASH = (id) => `https://images.unsplash.com/${id}?w=800&h=600&fit=crop`;

const pools = {
  'spb': [
    UNSPLASH('photo-1554844344-c34ea04258c4'),
    UNSPLASH('photo-1494491784568-f5188621923a'),
    UNSPLASH('photo-1677265655713-c0ead5037567'),
    UNSPLASH('photo-1679170968875-755150a3551c'),
    UNSPLASH('photo-1721503901645-054d41082ef4'),
    UNSPLASH('photo-1529839731635-e4909433cc5c'),
    UNSPLASH('photo-1686316396449-320429b46dd2'),
    UNSPLASH('photo-1707590421582-638151a5457f'),
    UNSPLASH('photo-1749713937584-702e472156df'),
    UNSPLASH('photo-1675545025526-3c38bec44eac'),
    UNSPLASH('photo-1679170969228-4455325ce1cd'),
    UNSPLASH('photo-1673382986143-0ceccc7c26dd'),
    UNSPLASH('photo-1548834925-e48f8a27ae5f'),
    UNSPLASH('photo-1556610961-2fecc5927173'),
    UNSPLASH('photo-1553696332-4e7a38e3b0d1'),
    UNSPLASH('photo-1541781408260-3c0febed7e98'),
    UNSPLASH('photo-1547448526-5ef9e27e703d'),
    UNSPLASH('photo-1555109307-f7d9da25c244'),
    UNSPLASH('photo-1580047256005-3c3ce49b1e74'),
    UNSPLASH('photo-1596484552834-6a58f850e0a1'),
  ],
  'moscow': [
    UNSPLASH('photo-1513326738677-b964603b136d'),
    UNSPLASH('photo-1520106212299-d99c443e4568'),
    UNSPLASH('photo-1547448415-e9f5b28e570d'),
    UNSPLASH('photo-1561542320-9a18cd340e98'),
    UNSPLASH('photo-1596484552834-6a58f850e0a1'),
    UNSPLASH('photo-1541447270888-83e8494f9c08'),
    UNSPLASH('photo-1512495039889-52a3b799c9bc'),
    UNSPLASH('photo-1569154940791-51021a652e70'),
    UNSPLASH('photo-1568391900479-e059e3e74c20'),
    UNSPLASH('photo-1495542779398-9637593a89e7'),
    UNSPLASH('photo-1580834341580-8c17a3a630ca'),
    UNSPLASH('photo-1520531158340-44015069e78e'),
    UNSPLASH('photo-1548834925-e48f8a27ae5f'),
    UNSPLASH('photo-1556610961-2fecc5927173'),
    UNSPLASH('photo-1600421777005-0dbef2855dac'),
    UNSPLASH('photo-1504615458222-979e04d69a27'),
  ],
  'kazan': [
    UNSPLASH('photo-1596484552834-6a58f850e0a1'),
    UNSPLASH('photo-1569154940791-51021a652e70'),
    UNSPLASH('photo-1548834925-e48f8a27ae5f'),
    UNSPLASH('photo-1556610961-2fecc5927173'),
    UNSPLASH('photo-1561542320-9a18cd340e98'),
    UNSPLASH('photo-1547448415-e9f5b28e570d'),
    UNSPLASH('photo-1520531158340-44015069e78e'),
    UNSPLASH('photo-1568391900479-e059e3e74c20'),
    UNSPLASH('photo-1513326738677-b964603b136d'),
    UNSPLASH('photo-1495542779398-9637593a89e7'),
    UNSPLASH('photo-1512495039889-52a3b799c9bc'),
    UNSPLASH('photo-1580834341580-8c17a3a630ca'),
  ],
  'dagestan': [
    UNSPLASH('photo-1635692326243-11668510acbe'),
    UNSPLASH('photo-1697396001552-53aaa4089de8'),
    UNSPLASH('photo-1670168630873-000f83e5dfe8'),
    UNSPLASH('photo-1652808109650-9370ddaaddaa'),
    UNSPLASH('photo-1634715114208-9aadcc5fdc20'),
    UNSPLASH('photo-1570614738755-ed5d44865d20'),
    UNSPLASH('photo-1617573543793-1b13d0a3f75c'),
    UNSPLASH('photo-1634715107433-d9e3403f5bc8'),
    UNSPLASH('photo-1697394921138-1247d8bf32bf'),
    UNSPLASH('photo-1554197913-f5998d997f42'),
    UNSPLASH('photo-1634715109536-cb9a1bb02cec'),
    UNSPLASH('photo-1673446319197-35ba29be3d22'),
  ],
  'mountains': [
    UNSPLASH('photo-1464822759023-fed622ff2c3b'),
    UNSPLASH('photo-1519681393784-d120267933ba'),
    UNSPLASH('photo-1486870591958-9b9d0d1dda99'),
    UNSPLASH('photo-1454496522488-7a8e488e8606'),
    UNSPLASH('photo-1506905925346-21bda4d32df4'),
    UNSPLASH('photo-1483728642387-6c3bdd6c93e5'),
    UNSPLASH('photo-1470071459604-3b5ec3a7fe05'),
    UNSPLASH('photo-1540390769625-2fc3f8b1d50c'),
    UNSPLASH('photo-1501785888041-af3ef285b470'),
    UNSPLASH('photo-1445363692815-ebcd0aaa0d8f'),
    UNSPLASH('photo-1464278533981-50106e6176b1'),
    UNSPLASH('photo-1476514525535-07fb3b4ae5f1'),
    UNSPLASH('photo-1486572788966-cfd3df1f5b42'),
    UNSPLASH('photo-1551632811-561732d1e306'),
    UNSPLASH('photo-1433477155337-9aea4e790195'),
    UNSPLASH('photo-1500534623283-312aade213eb'),
    UNSPLASH('photo-1500049242364-5f500807cdd7'),
    UNSPLASH('photo-1472791108553-c9405341e398'),
  ],
  'sea': [
    UNSPLASH('photo-1507525428034-b723cf961d3e'),
    UNSPLASH('photo-1519046904884-53103b34b206'),
    UNSPLASH('photo-1506929562872-bb421503ef21'),
    UNSPLASH('photo-1473116763249-2faaef81ccda'),
    UNSPLASH('photo-1471922694854-ff1b63b20054'),
    UNSPLASH('photo-1468413253725-0d5181091126'),
    UNSPLASH('photo-1505228395891-9a51e7e86bf6'),
    UNSPLASH('photo-1476673160081-cf065607f449'),
    UNSPLASH('photo-1532274402911-5a369e4c4bb5'),
    UNSPLASH('photo-1504681869696-d977211a5f4c'),
    UNSPLASH('photo-1500375592092-40eb2168fd21'),
    UNSPLASH('photo-1468078809804-e2c56cd3e0bf'),
    UNSPLASH('photo-1544551763-46a013bb70d5'),
    UNSPLASH('photo-1484821582734-6c6c9a0e3e42'),
    UNSPLASH('photo-1523568114440-01fb5f2f7bca'),
  ],
  'nature': [
    UNSPLASH('photo-1472214103451-9374bd1c798e'),
    UNSPLASH('photo-1441974231531-c6227db76b6e'),
    UNSPLASH('photo-1447752875215-b2761acb3c5d'),
    UNSPLASH('photo-1518173946687-a2e5ee6e38f8'),
    UNSPLASH('photo-1469474968028-56623f02e42e'),
    UNSPLASH('photo-1490730141103-6cac27aaab94'),
    UNSPLASH('photo-1418065460487-3e41a6c84dc5'),
    UNSPLASH('photo-1431794062232-2a99a5431c6c'),
    UNSPLASH('photo-1551918120-9739cb430c6d'),
    UNSPLASH('photo-1473773508845-188df298d2d1'),
    UNSPLASH('photo-1500049242364-5f500807cdd7'),
    UNSPLASH('photo-1446329813274-7c9036bd9a1f'),
    UNSPLASH('photo-1504567961542-e24d9439a724'),
    UNSPLASH('photo-1509316975850-ff9c5deb0cd9'),
  ],
  'city': [
    UNSPLASH('photo-1480714378408-67cf0d13bc1b'),
    UNSPLASH('photo-1449824913935-59a10b8d2000'),
    UNSPLASH('photo-1477959858617-67f85cf4f1df'),
    UNSPLASH('photo-1444723121867-7a241cacace9'),
    UNSPLASH('photo-1514565131-fce0801e5785'),
    UNSPLASH('photo-1519501025264-65ba15a82390'),
    UNSPLASH('photo-1467269204594-9661b134dd2b'),
    UNSPLASH('photo-1477346611705-65d1883cee1e'),
    UNSPLASH('photo-1534430480872-3498386e7856'),
    UNSPLASH('photo-1445991842772-097fea258e7b'),
  ],
};

const destMap = {
  'Санкт-Петербург': 'spb',
  'Москва': 'moscow',
  'Казань': 'kazan',
  'Дагестан': 'dagestan',
  'Архыз': 'mountains',
  'Домбай': 'mountains',
  'Приэльбрусье': 'mountains',
  'Северная Осетия': 'mountains',
  'Адыгея': 'nature',
  'Лаго-Наки': 'nature',
  'Гуамка': 'nature',
  'Абхазия': 'mountains',
  'Чечня': 'mountains',
  'Геленджик': 'sea',
  'Абрау-Дюрсо': 'sea',
  'Сочи': 'sea',
  'Крым': 'sea',
  'КавМинВоды': 'city',
  'Краснодар': 'city',
  'Ростовская область': 'city',
  'Волгоград': 'city',
  'Калмыкия': 'nature',
};

const counters = {};
function getUrl(dest) {
  const poolKey = destMap[dest] || 'nature';
  const pool = pools[poolKey];
  if (!counters[poolKey]) counters[poolKey] = 0;
  const url = pool[counters[poolKey] % pool.length];
  counters[poolKey]++;
  return url;
}

const filePath = path.join(__dirname, '..', 'data', 'mock-tours.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const localImgPattern = /'\/(images\/tours\/[^']+)'/g;

let currentDest = null;
const lines = content.split('\n');
const newLines = [];

for (const line of lines) {
  const destMatch = line.match(/destination:\s*'([^']+)'/);
  if (destMatch) {
    currentDest = destMatch[1];
  }

  const newLine = line.replace(localImgPattern, () => {
    const url = getUrl(currentDest || 'Адыгея');
    return `'${url}'`;
  });
  newLines.push(newLine);
}

content = newLines.join('\n');
fs.writeFileSync(filePath, content, 'utf-8');

const totalReplaced = Object.values(counters).reduce((a, b) => a + b, 0);
console.log(`Done! Replaced ${totalReplaced} image paths.`);
console.log('Per pool:', JSON.stringify(counters, null, 2));
