const fs = require('fs');

['header', 'main', 'footer'].forEach(name => {
  let content = fs.readFileSync('c:/xfa/original-' + name + '.jsx', 'utf8');
  content = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  let comp = `import React, { useEffect } from 'react';

export default function Original${name.charAt(0).toUpperCase() + name.slice(1)}() {
  useEffect(() => {
    if (window.jQuery && window.jQuery.fn.owlCarousel && '${name}' === 'main') {
      setTimeout(() => {
        // Trigger resize to fix owl carousel rendering, or re-init custom scripts if needed
        window.dispatchEvent(new Event('resize'));
        if (typeof window.siteInit === 'function') window.siteInit();
      }, 500);
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{__html: \`${content}\`}} />
  );
}`;

  fs.writeFileSync('c:/xfa/src/components/Original' + name.charAt(0).toUpperCase() + name.slice(1) + '.jsx', comp);
});
