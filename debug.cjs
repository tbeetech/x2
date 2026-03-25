const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('c:/xfa/original-index.html', 'utf8');
const $ = cheerio.load(html);

const children = [];
$('#page-wrapper > *').each((i, el) => {
  children.push(el.name + (el.attribs.id ? '#' + el.attribs.id : '') + (el.attribs.class ? '.' + el.attribs.class.split(' ').join('.') : ''));
});
console.log("PageWrapper children:", children);

