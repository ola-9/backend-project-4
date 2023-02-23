import { load } from 'cheerio';
import path from 'path';
import prettier from 'prettier';
import debugPageLoader from './debug.js';

const resources = [
  { tag: 'script', attr: 'src' },
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
];

const updateHtml = (html, origin, originpath, filespath) => {
  debugPageLoader('Getting the page html');
  const $ = load(html);
  const resourceDetails = [];
  resources.forEach(({ tag, attr }) => {
    $(tag).toArray().forEach((item) => {
      const itemAttr = $(item).attr(attr);
      if (typeof itemAttr === 'undefined') {
        return;
      }
      const urlObj = new URL(itemAttr, origin);
      const originUrlObj = new URL(origin);

      if (urlObj.host !== originUrlObj.host) {
        return;
      }
      const { pathname } = urlObj;
      const formattedPathname = pathname.split('/').join('-');
      const { ext } = path.parse(itemAttr);
      const extension = (ext === '') ? '.html' : '';
      const filename = `${filespath}/${originpath}${formattedPathname}${extension}`;
      resourceDetails.push({ filename, url: `${origin}${pathname}` });
      $(item).attr(attr, `${filename}`);
    });
  });

  debugPageLoader('Updating resources urls of the page');
  const updatedHtml = prettier.format($.html(), { parser: 'html' });
  return { updatedHtml, resourceDetails };
};

export default updateHtml;
