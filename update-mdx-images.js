const fs = require('fs');
const path = require('path');

// Story IDs that should have images
const storyIds = ['002', '003', '004', '005', '006', '007', '008', '009', '010', '011'];

function updateMdxFile(storyId) {
  const filePath = path.join(__dirname, 'src', 'content', 'stories', `${storyId}.mdx`);
  const imagePath = path.join(__dirname, 'public', 'images', 'stories', storyId, 'cover.jpg');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ✗ Story file not found: ${storyId}.mdx`);
    return false;
  }
  
  if (!fs.existsSync(imagePath)) {
    console.log(`  ⚠ Image not found for ${storyId}, skipping...`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if image field already exists
  if (content.includes('image:')) {
    // Replace existing image field
    content = content.replace(/^image:.*$/m, `image: /images/stories/${storyId}/cover.jpg`);
  } else {
    // Add image field after date
    content = content.replace(/^(date: .+)$/m, `$1\nimage: /images/stories/${storyId}/cover.jpg`);
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✓ Updated ${storyId}.mdx`);
  return true;
}

console.log('\nUpdating MDX files with image paths...\n');

let updated = 0;
for (const storyId of storyIds) {
  if (updateMdxFile(storyId)) {
    updated++;
  }
}

console.log(`\n✓ Updated ${updated} story files with image paths.\n`);
