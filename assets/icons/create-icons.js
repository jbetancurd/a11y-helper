// Node.js script to create PNG icons from SVG
// Run with: node create-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

function drawAccessibilityIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - blue circle
  ctx.fillStyle = '#0056b3';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Scale for drawing
  const scale = size / 24;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // White accessibility icon
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = scale * 1.2;
  
  // Head
  ctx.beginPath();
  ctx.arc(centerX, centerY - scale * 5, scale * 1.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Body
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - scale * 3);
  ctx.lineTo(centerX, centerY + scale * 3);
  ctx.stroke();
  
  // Left arm
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - scale * 2);
  ctx.lineTo(centerX - scale * 4, centerY - scale * 4.5);
  ctx.stroke();
  
  // Right arm
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - scale * 2);
  ctx.lineTo(centerX + scale * 4, centerY - scale * 4.5);
  ctx.stroke();
  
  // Left leg
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + scale * 3);
  ctx.lineTo(centerX - scale * 3, centerY + scale * 7);
  ctx.stroke();
  
  // Right leg
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + scale * 3);
  ctx.lineTo(centerX + scale * 3, centerY + scale * 7);
  ctx.stroke();
  
  return canvas;
}

// Create icons
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const canvas = drawAccessibilityIcon(size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon-${size}.png`, buffer);
  console.log(`Created icon-${size}.png`);
});

console.log('\nAll icons created successfully!');
console.log('Copy them to: accessibility-chrome-extension/assets/icons/');
