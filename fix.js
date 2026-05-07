const fs = require('fs');
let content = fs.readFileSync('src/pages/LocationPage.jsx', 'utf8');

const replacement = '    if (loc.video) {\n' +
'        businessSchema.subjectOf = {\n' +
'            \"@type\": \"VideoObject\",\n' +
'            name: \$'+'{loc.city} Commercial Asphalt Paving by J. Worden & Sons,\n' +
'            description: loc.video.description || Watch our high-performance paving teams execute precision commercial asphalt overlays and sealcoating in \$'+'{loc.city}.,\n' +
'            thumbnailUrl: loc.video.thumbnailUrl || \$'+'{PRIMARY_DOMAIN}/hero-paving.jpg,\n' +
'            uploadDate: loc.video.uploadDate || \"2026-05-01\",\n' +
'            contentUrl: \$'+'{PRIMARY_DOMAIN}\$'+'{loc.video.url}\n' +
'        };\n' +
'    }';

content = content.replace(/if \(loc\.video\) \{[\s\S]*?\};[\s]*\}/, replacement);
fs.writeFileSync('src/pages/LocationPage.jsx', content);
