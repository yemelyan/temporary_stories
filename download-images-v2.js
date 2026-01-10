const https = require('https');
const fs = require('fs');
const path = require('path');

// Story images mapping with slugs that match our story IDs
const storyImages = [
  { id: '002', slug: 'a-city-with-many-buildings-HdofToH0dQg', photographer: 'Julia Karnavusha' },
  { id: '003', slug: 'a-group-of-colorful-buildings-8f4RsRuR9Ww', photographer: 'Zhu Yunxiao' },
  { id: '004', slug: 'historic-italian-piazza-with-tall-brick-tower-and-buildings-pXUgFj6DFA0', photographer: 'Cyril @cyrilczl' },
  { id: '005', slug: 'people-towards-white-building-uVsYF9OIAjo', photographer: 'Małgorzata Twardo' },
  { id: '006', slug: 'group-of-people-having-a-meeting-VBLHICVh-lI', photographer: 'Mario Gogh' },
  { id: '007', slug: 'raised-garden-beds-surround-a-gazebo-in-a-park-3Z2Z7yMlOpQ', photographer: 'Leonie Clough' },
  { id: '008', slug: 'people-walk-down-a-sunny-street-with-vintage-car-iTzCvGlOoEk', photographer: 'Noémi Szász' },
  { id: '009', slug: 'an-outdoor-market-with-lots-of-fruits-and-vegetables-S7g1fKnojwc', photographer: 'Annie Spratt' },
  { id: '010', slug: 'a-park-with-a-bench-and-a-tree-7qX-s6JmUtU', photographer: 'Valentin Lacoste' },
  { id: '011', slug: 'green-plant-on-brown-soil-lFYObzPtisg', photographer: 'Eduardo Casajús Gorostiaga' }
];

/**
 * Get photo ID from Unsplash using their API
 * We'll fetch the page and extract the photo ID from the data
 */
function getPhotoIdFromSlug(slug) {
  return new Promise((resolve, reject) => {
    const url = `https://unsplash.com/photos/${slug}`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        // Try to find the photo ID in various formats in the page
        // Pattern 1: Look for photo ID in JSON-LD or script tags
        const photoIdPatterns = [
          /"id":"([a-zA-Z0-9_-]+)"/,
          /"photoId":"([a-zA-Z0-9_-]+)"/,
          /photo-([a-zA-Z0-9_-]+)/,
          /\/photos\/([a-zA-Z0-9_-]+)/,
          // Look for numeric photo IDs in the format we saw in examples
          /images\.unsplash\.com\/photo-([0-9]+-[a-zA-Z0-9]+)/
        ];

        for (const pattern of photoIdPatterns) {
          const match = data.match(pattern);
          if (match && match[1] && match[1] !== slug) {
            // Found a potential photo ID (different from slug)
            resolve(match[1]);
            return;
          }
        }

        // If no numeric ID found, we'll try using the slug directly with Unsplash Source
        resolve(null);
      });
    }).on('error', reject);
  });
}

/**
 * Download image using Unsplash Source API or direct image URL
 */
function downloadImage(imageUrl, destination) {
  return new Promise((resolve, reject) => {
    const url = new URL(imageUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*'
      }
    };

    https.get(options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadImage(redirectUrl, destination).then(resolve).catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        reject(new Error(`Not an image: ${contentType}`));
        return;
      }

      const fileStream = fs.createWriteStream(destination);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Try multiple URL formats to download the image
 */
async function tryDownloadImage(slug, destination, photographer) {
  // Strategy 1: Try Unsplash Source API with slug (may work for some)
  const sourceUrls = [
    `https://source.unsplash.com/${slug}/1600x1200`,
    `https://source.unsplash.com/${slug}/1200x800`,
    `https://images.unsplash.com/photo-${slug}?w=1600&q=80&auto=format&fit=crop&ixlib=rb-4.1.0`,
    `https://images.unsplash.com/photo-${slug}?w=1200&q=80&auto=format&fit=crop`
  ];

  for (const url of sourceUrls) {
    try {
      console.log(`  Trying: ${url}`);
      await downloadImage(url, destination);
      const stats = fs.statSync(destination);
      if (stats.size > 5000) { // Make sure it's a real image (at least 5KB)
        console.log(`  ✓ Downloaded (${(stats.size / 1024).toFixed(1)} KB)`);
        return true;
      }
      fs.unlinkSync(destination); // Delete if too small (probably HTML error page)
    } catch (error) {
      // Continue to next URL
      if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
      }
    }
  }

  // Strategy 2: Fetch the actual page and extract the real image URL
  try {
    console.log(`  Fetching photo page to extract image URL...`);
    const unsplashUrl = `https://unsplash.com/photos/${slug}`;
    const response = await new Promise((resolve, reject) => {
      https.get(unsplashUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk.toString());
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        res.on('error', reject);
      });
    });

    if (response.statusCode === 200) {
      // Look for the actual image URL in the HTML
      // Unsplash embeds image URLs in various places
      const imageUrlPatterns = [
        /https:\/\/images\.unsplash\.com\/photo-[^"'\s\)]+/g,
        /"raw":"https:\/\/images\.unsplash\.com\/[^"]+"/,
        /"full":"https:\/\/images\.unsplash\.com\/[^"]+"/,
        /"regular":"https:\/\/images\.unsplash\.com\/[^"]+"/
      ];

      for (const pattern of imageUrlPatterns) {
        const matches = response.data.match(pattern);
        if (matches && matches.length > 0) {
          let imageUrl = matches[0];
          // Clean up the URL (remove quotes if present)
          imageUrl = imageUrl.replace(/^["']|["']$/g, '');
          if (imageUrl.includes('"')) {
            imageUrl = imageUrl.match(/"([^"]+)"/)?.[1] || imageUrl;
          }
          
          // Modify URL to get higher resolution
          imageUrl = imageUrl.replace(/w=\d+/, 'w=1600');
          if (!imageUrl.includes('w=')) {
            imageUrl += (imageUrl.includes('?') ? '&' : '?') + 'w=1600&q=80&auto=format&fit=crop';
          }

          console.log(`  Found image URL: ${imageUrl}`);
          await downloadImage(imageUrl, destination);
          const stats = fs.statSync(destination);
          if (stats.size > 5000) {
            console.log(`  ✓ Downloaded (${(stats.size / 1024).toFixed(1)} KB)`);
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.log(`  Error fetching page: ${error.message}`);
  }

  return false;
}

/**
 * Main download function
 */
async function downloadAllImages() {
  const baseDir = path.join(__dirname, 'public', 'images', 'stories');

  // Create directories
  for (const story of storyImages) {
    const storyDir = path.join(baseDir, story.id);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }
  }

  console.log(`\nDownloading ${storyImages.length} images from Unsplash...\n`);

  for (const story of storyImages) {
    console.log(`Story ${story.id} (${story.photographer}):`);
    
    const destination = path.join(baseDir, story.id, 'cover.jpg');

    // Skip if already exists
    if (fs.existsSync(destination)) {
      const stats = fs.statSync(destination);
      if (stats.size > 5000) {
        console.log(`  ⏭ Already exists (${(stats.size / 1024).toFixed(1)} KB), skipping...\n`);
        continue;
      }
    }

    const success = await tryDownloadImage(story.slug, destination, story.photographer);
    
    if (!success) {
      console.log(`  ✗ Failed to download. Manual download needed from: https://unsplash.com/photos/${story.slug}\n`);
    } else {
      console.log(`  Photographer: ${story.photographer}\n`);
    }
  }

  console.log('Download complete!\n');
}

// Run the script
downloadAllImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
