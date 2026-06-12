// api/page.js - Renders HTML server-side
export default function handler(req, res) {
  const obfuscatedHTML = `<!-- YOUR OBFUSCATED HTML -->`;
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(obfuscatedHTML);
}