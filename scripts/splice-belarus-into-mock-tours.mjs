import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockPath = path.join(__dirname, '../data/mock-tours.ts');
const fragPath = path.join(__dirname, '../data/_belarus_tours_fragment.ts');

const mock = fs.readFileSync(mockPath, 'utf8');
const frag = fs.readFileSync(fragPath, 'utf8');

const needle = `      programEnd: 'День 6 — свободный день, самостоятельный отъезд',
    },
  },
];

// ============================================================================
// ОТЗЫВЫ (заменить на реальные)
// ============================================================================`;

const insert = `      programEnd: 'День 6 — свободный день, самостоятельный отъезд',
    },
  },${frag}
];

// ============================================================================
// ОТЗЫВЫ (заменить на реальные)
// ============================================================================`;

if (!mock.includes(needle)) {
  console.error('Needle not found');
  process.exit(1);
}
fs.writeFileSync(mockPath, mock.replace(needle, insert));
console.log('Spliced Belarus tours into mock-tours.ts');
