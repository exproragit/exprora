/**
 * Build SDK for browser use
 * Creates a single bundled file that works in browsers
 */

const fs = require('fs');
const path = require('path');

// Read the compiled SDK
const sdkPath = path.join(__dirname, 'dist', 'index.js');
let sdkCode = fs.readFileSync(sdkPath, 'utf8');

// Wrap in IIFE for browser compatibility
const browserCode = `(function() {
  'use strict';
  
${sdkCode}
  
  // Make available globally
  if (typeof window !== 'undefined') {
    window.Exprora = Exprora;
  }
})();`;

// Write to public directory
const publicDir = path.join(__dirname, '..', 'backend', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sdk.js'), browserCode);
console.log('✅ SDK built and copied to backend/public/sdk.js');

