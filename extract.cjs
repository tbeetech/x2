const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('c:/xfa/original-index.html', 'utf8');
const $ = cheerio.load(html);

function toJSX(str) {
  return str;
}

const header = $('header#header').parent().html() || $('header#header').html() || '';
fs.writeFileSync('c:/xfa/original-header.jsx', toJSX(header));

const main = $('#modules-container').parent().html() || $('#modules-container').html() || '';
fs.writeFileSync('c:/xfa/original-main.jsx', toJSX(main));

const footer = $('footer#footer').parent().html() || $('footer#footer').html() || '';
fs.writeFileSync('c:/xfa/original-footer.jsx', toJSX(footer));

console.log('Extraction complete!');
