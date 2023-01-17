/* eslint-disable import/extensions */
import { load } from 'cheerio';
import path from 'path';
import prettier from 'prettier';
import axios from 'axios';
import fs from 'fs/promises';
import debugPageLoader from './debug.js';

const resources = [
  { tag: 'script', attr: 'src' },
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
];

export const updateHtml = (html, origin, originpath, filespath) => {
  const $ = load(html);
  const resourceDetails = [];
  resources.forEach(({ tag, attr }) => {
    $(tag).toArray().forEach((item) => { // https://api.jquery.com/toarray/
      const itemAttr = $(item).attr(attr);
      // https://www.designcise.com/web/tutorial/how-to-check-if-an-element-has-attribute-using-jquery-and-javascript
      if (typeof itemAttr === 'undefined') { // if attribute doesn't exist
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

  debugPageLoader('update urls inside the downloaded html');
  const updatedHtml = prettier.format($.html(), { parser: 'html' });
  // console.log('##### ', resourceDetails);
  return { updatedHtml, resourceDetails };
};

export const downloadResources = (resourceDetails, dir) => {
  const promises = resourceDetails.map(({ filename, url }) => axios.get(url, { responseType: 'arraybuffer' })
    .then(({ data }) => {
      debugPageLoader(`Create page's resources file: ${filename}`);
      return fs.writeFile(`${dir}/${filename}`, data);
    })
    .catch((err) => {
      throw new Error(`Error in downloading resource: ${err.message}`);
    }));

  return Promise.all(promises);
};

// urlObj:  URL {
//   href: 'https://ru.hexlet.io/packs/js/runtime.js',
//   origin: 'https://ru.hexlet.io',
//   protocol: 'https:',
//   username: '',
//   password: '',
//   host: 'ru.hexlet.io',
//   hostname: 'ru.hexlet.io',
//   port: '',
//   pathname: '/packs/js/runtime.js',
//   search: '',
//   searchParams: URLSearchParams {},
//   hash: ''
// }
