const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Story images mapping: story ID -> { unsplashUrl, photographer }
const storyImages = [
  {
    id: '002',
    unsplashUrl: 'https://unsplash.com/photos/a-city-with-many-buildings-HdofToH0dQg',
    photographer: 'Julia Karnavusha'
  },
  {
    id: '003',
    unsplashUrl: 'https://unsplash.com/photos/a-group-of-colorful-buildings-8f4RsRuR9Ww',
    photographer: 'Zhu Yunxiao'
  },
  {
    id: '004',
    unsplashUrl: 'https://unsplash.com/photos/historic-italian-piazza-with-tall-brick-tower-and-buildings-pXUgFj6DFA0',
    photographer: 'Cyril @cyrilczl'
  },
  {
    id: '005',
    unsplashUrl: 'https://unsplash.com/photos/people-towards-white-building-uVsYF9OIAjo',
    photographer: 'Małgorzata Twardo'
  },
  {
    id: '006',
    unsplashUrl: 'https://unsplash.com/photos/group-of-people-having-a-meeting-VBLHICVh-lI',
    photographer: 'Mario Gogh'
  },
  {
    id: '007',
    unsplashUrl: 'https://unsplash.com/photos/raised-garden-beds-surround-a-gazebo-in-a-park-3Z2Z7yMlOpQ',
    photographer: 'Leonie Clough'
  },
  {
    id: '008',
    unsplashUrl: 'https://unsplash.com/photos/people-walk-down-a-sunny-street-with-vintage-car-iTzCvGlOoEk',
    photographer: 'Noémi Szász'
  },
  {
    id: '009',
    unsplashUrl: 'https://unsplash.com/photos/an-outdoor-market-with-lots-of-fruits-and-vegetables-S7g1fKnojwc',
    photographer: 'Annie Spratt'
  },
  {
    id: '010',
    unsplashUrl: 'https://unsplash.com/photos/a-park-with-a-bench-and-a-tree-7qX-s6JmUtU',
    photographer: 'Valentin Lacoste'
  },
  {
    id: '011',
    unsplashUrl: 'https://unsplash.com/photos/green-plant-on-brown-soil-lFYObzPtisg',
    photographer: 'Eduardo Casajús Gorostiaga'
  }
];

/**
 * Extract photo ID/slug from Unsplash URL
 */
function extractPhotoId(url) {
  const match = url.match(/\/photos\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch HTML and extract image URL from Unsplash page
 */
function fetchImageUrl(unsplashUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(unsplashUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const client = url.protocol === 'https:' ? https : http;

    client.get(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        // Try multiple patterns to find the image URL
        // Pattern 1: JSON-LD structured data
        const jsonLdMatch = data.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/s);
        if (jsonLdMatch) {
          try {
            const jsonLd = JSON.parse(jsonLdMatch[1]);
            if (jsonLd.image && typeof jsonLd.image === 'string') {
              resolve(jsonLd.image);
              return;
            }
            if (jsonLd.image && jsonLd.image.url) {
              resolve(jsonLd.image.url);
              return;
            }
          } catch (e) {
            // Continue to next pattern
          }
        }

        // Pattern 2: Open Graph meta tag
        const ogImageMatch = data.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          resolve(ogImageMatch[1]);
          return;
        }

        // Pattern 3: Twitter card image
        const twitterMatch = data.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
        if (twitterMatch && twitterMatch[1]) {
          resolve(twitterMatch[1]);
          return;
        }

        // Pattern 4: Look for images.unsplash.com URLs in script tags
        const scriptImageMatch = data.match(/https?:\/\/images\.unsplash\.com\/[^"'\s\)]+/i);
        if (scriptImageMatch && scriptImageMatch[0]) {
          resolve(scriptImageMatch[0]);
          return;
        }

        // Pattern 5: Look for "raw" or "full" image URLs in JSON
        const rawMatch = data.match(/"(raw|full|regular)":\s*"([^"]+)"/i);
        if (rawMatch && rawMatch[2]) {
          resolve(rawMatch[2]);
          return;
        }

        // Pattern 6: Unsplash API format in page data
        const apiMatch = data.match(/https:\/\/images\.unsplash\.com\/photo-[^"'\s\)]+/i);
        if (apiMatch && apiMatch[0]) {
          resolve(apiMatch[0]);
          return;
        }

        reject(new Error('Could not find image URL in page HTML'));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Download image from URL
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

    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(options, (response) => {
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
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
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
    console.log(`  URL: ${story.unsplashUrl}`);

    const destination = path.join(baseDir, story.id, 'cover.jpg');

    // Skip if already downloaded
    if (fs.existsSync(destination)) {
      const stats = fs.statSync(destination);
      if (stats.size > 0) {
        console.log(`  ⏭ Already exists (${(stats.size / 1024).toFixed(1)} KB), skipping...\n`);
        continue;
      }
    }

    try {
      // Fetch the image URL from the Unsplash page
      console.log(`  Fetching image URL from page...`);
      const imageUrl = await fetchImageUrl(story.unsplashUrl);
      console.log(`  Found: ${imageUrl}`);

      // Download the image
      console.log(`  Downloading...`);
      await downloadImage(imageUrl, destination);

      const stats = fs.statSync(destination);
      console.log(`  ✓ Downloaded successfully (${(stats.size / 1024).toFixed(1)} KB)\n`);
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  }

  console.log('\nDownload complete!\n');
}

// Run the script
downloadAllImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
