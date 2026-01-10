const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Story images mapping - matches the JSON provided by user
const storyImages = [
  { id: '002', unsplashUrl: 'https://unsplash.com/photos/a-city-with-many-buildings-HdofToH0dQg', photographer: 'Julia Karnavusha' },
  { id: '003', unsplashUrl: 'https://unsplash.com/photos/a-group-of-colorful-buildings-8f4RsRuR9Ww', photographer: 'Zhu Yunxiao' },
  { id: '004', unsplashUrl: 'https://unsplash.com/photos/historic-italian-piazza-with-tall-brick-tower-and-buildings-pXUgFj6DFA0', photographer: 'Cyril @cyrilczl' },
  { id: '005', unsplashUrl: 'https://unsplash.com/photos/people-towards-white-building-uVsYF9OIAjo', photographer: 'Małgorzata Twardo' },
  { id: '006', unsplashUrl: 'https://unsplash.com/photos/group-of-people-having-a-meeting-VBLHICVh-lI', photographer: 'Mario Gogh' },
  { id: '007', unsplashUrl: 'https://unsplash.com/photos/raised-garden-beds-surround-a-gazebo-in-a-park-3Z2Z7yMlOpQ', photographer: 'Leonie Clough' },
  { id: '008', unsplashUrl: 'https://unsplash.com/photos/people-walk-down-a-sunny-street-with-vintage-car-iTzCvGlOoEk', photographer: 'Noémi Szász' },
  { id: '009', unsplashUrl: 'https://unsplash.com/photos/an-outdoor-market-with-lots-of-fruits-and-vegetables-S7g1fKnojwc', photographer: 'Annie Spratt' },
  { id: '010', unsplashUrl: 'https://unsplash.com/photos/a-park-with-a-bench-and-a-tree-7qX-s6JmUtU', photographer: 'Valentin Lacoste' },
  { id: '011', unsplashUrl: 'https://unsplash.com/photos/green-plant-on-brown-soil-lFYObzPtisg', photographer: 'Eduardo Casajús Gorostiaga' }
];

async function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadImage(redirectUrl, destination).then(resolve).catch(reject);
        }
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(destination);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function getImageUrlFromPage(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Try multiple methods to find the image URL
    const imageUrl = await page.evaluate(() => {
      // Method 1: Look for og:image meta tag
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.content) {
        return ogImage.content;
      }
      
      // Method 2: Look for Twitter card image
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage && twitterImage.content) {
        return twitterImage.content;
      }
      
      // Method 3: Look for the main image element (various selectors)
      const imgSelectors = [
        'img[data-test="photo-header-image"]',
        'img[data-testid="photo-header-image"]',
        'img[alt*="Photo"]',
        'img[class*="Photo"]',
        'img[src*="images.unsplash.com"]',
        'div[class*="Photo"] img',
        'picture img'
      ];
      
      for (const selector of imgSelectors) {
        const img = document.querySelector(selector);
        if (img && img.src && img.src.includes('images.unsplash.com')) {
          return img.src;
        }
        if (img && img.srcset) {
          // Get the highest resolution from srcset
          const srcset = img.srcset.split(',').map(s => s.trim());
          const highest = srcset[srcset.length - 1].split(' ')[0];
          if (highest.includes('images.unsplash.com')) {
            return highest;
          }
        }
      }
      
      // Method 4: Extract from JSON-LD or script tags
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML;
        // Look for image URLs in JSON
        const jsonMatch = content.match(/"raw":"(https:\/\/images\.unsplash\.com\/[^"]+)"/);
        if (jsonMatch) return jsonMatch[1];
        
        const fullMatch = content.match(/"full":"(https:\/\/images\.unsplash\.com\/[^"]+)"/);
        if (fullMatch) return fullMatch[1];
        
        const regularMatch = content.match(/"regular":"(https:\/\/images\.unsplash\.com\/[^"]+)"/);
        if (regularMatch) return regularMatch[1];
        
        // Generic pattern
        const imageMatch = content.match(/https:\/\/images\.unsplash\.com\/photo-[^"'\s\)]+/);
        if (imageMatch) return imageMatch[0];
      }
      
      return null;
    });
    
    await page.close();
    return imageUrl;
  } catch (error) {
    await page.close();
    throw error;
  }
}

async function downloadAllImages() {
  const baseDir = path.join(__dirname, 'public', 'images', 'stories');
  
  // Create directories
  for (const story of storyImages) {
    const storyDir = path.join(baseDir, story.id);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }
  }

  console.log('\nLaunching browser to fetch image URLs from Unsplash...\n');
  const browser = await puppeteer.launch({ headless: true });

  try {
    for (const story of storyImages) {
      console.log(`Story ${story.id} (${story.photographer}):`);
      const destination = path.join(baseDir, story.id, 'cover.jpg');

      if (fs.existsSync(destination)) {
        const stats = fs.statSync(destination);
        if (stats.size > 0) {
          console.log(`  ⏭ Already exists (${(stats.size / 1024).toFixed(1)} KB), skipping...\n`);
          continue;
        }
      }

      try {
        console.log(`  Fetching image URL from: ${story.unsplashUrl}`);
        const imageUrl = await getImageUrlFromPage(browser, story.unsplashUrl);
        
        if (!imageUrl) {
          console.log(`  ✗ Could not find image URL on page\n`);
          continue;
        }

        // Get higher resolution version - modify URL parameters
        let finalUrl = imageUrl;
        if (finalUrl.includes('?')) {
          // Replace or add width parameter for higher resolution
          finalUrl = finalUrl.replace(/[?&]w=\d+/, '?w=1600').replace(/[?&]width=\d+/, '&width=1600');
          if (!finalUrl.includes('w=') && !finalUrl.includes('width=')) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'w=1600&q=80&auto=format&fit=crop';
          }
        } else {
          finalUrl += '?w=1600&q=80&auto=format&fit=crop';
        }

        console.log(`  Found: ${imageUrl}`);
        console.log(`  Using high-res: ${finalUrl}`);
        console.log(`  Downloading...`);
        await downloadImage(finalUrl, destination);
        
        const stats = fs.statSync(destination);
        console.log(`  ✓ Downloaded (${(stats.size / 1024).toFixed(1)} KB)\n`);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('Download complete!\n');
}

downloadAllImages().catch(console.error);
