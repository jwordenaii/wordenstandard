const fs = require('fs');
let content = fs.readFileSync('src/lib/locations.js', 'utf8');

// Replace slug array entry
content = content.replace(/'orlando-fl'/g, \"'bradenton-fl'\");

const bradentonBlock = \    {
    slug: 'bradenton-fl',
    city: 'Bradenton',
    state: 'Florida',
    stateAbbr: 'FL',
    region: 'Southwest Florida',
    geo: { lat: 27.4989, lng: -82.5748 },
    isHeadquarters: false,
    headline: 'Commercial Asphalt Paving & Sealcoating in Bradenton, FL',
    intro: 'Providing top-tier asphalt paving services and structural maintenance throughout Southwest Florida. Our proprietary mixes withstand Florida\\\\'s high UV index and heavy rain events.',
    localGbpName: 'Mid Florida Asphalt Paving', 
    localPhone: '+14073616446',
    neighborhoods: ['Downtown Bradenton', 'Lakewood Ranch', 'Palmetto', 'Cortez'],
    landmarks: ['Bradenton Riverwalk', 'Village of the Arts'],
    climate: {
      title: 'Florida Sun & Rain Resistant Asphalt',
      body: 'Florida paving demands rapid drainage solutions and high-UV resistant sealcoats. We specialize in porous asphalt engineering and heavy-duty storm water runoff systems for commercial lots.'
    },
    faqs: [
      {
        q: 'How does Florida weather affect asphalt?',
        a: 'The intense UV rays oxidize the asphalt binder quickly, while heavy afternoon rains test the base drainage. We recommend a rigid sealcoating schedule every 2-3 years to seal pores against water intrusion.'
      }
    ],
    reviews: 2,
    rating: 5.0,
    gallery: [
      '/work/portfolio/portfolio-007.jpg',
      '/work/portfolio/portfolio-008.jpg',
      '/work/portfolio/portfolio-019.jpg',
      '/work/portfolio/portfolio-021.jpg'
    ]
  },\;

content = content.replace(/\{\\s*slug:\\s*'orlando-fl'[\\s\\S]*?\]\\s*\}/, bradentonBlock);

fs.writeFileSync('src/lib/locations.js', content);
