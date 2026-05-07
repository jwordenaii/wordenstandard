const fs = require('fs');
let content = fs.readFileSync('src/pages/LocationPage.jsx', 'utf8');

const FIX = \    if (loc.video) {
        businessSchema.subjectOf = {
            '@type': 'VideoObject',
            name: \\\\ Commercial Asphalt Paving by J. Worden & Sons\\\,
            description: loc.video.description || \\\Watch our high-performance paving teams execute precision commercial asphalt overlays and sealcoating in \.\\\,
            thumbnailUrl: loc.video.thumbnailUrl || \\\\/hero-paving.jpg\\\,
            uploadDate: loc.video.uploadDate || '2026-05-01',
            contentUrl: \\\\\\\\
        };
    }\;

content = content.replace(/if \\\(loc\\.video\\) \\{[\\s\\S]*?\\};[\\s]*\\}/g, FIX);
fs.writeFileSync('src/pages/LocationPage.jsx', content);

