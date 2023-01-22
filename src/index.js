/* eslint-disable import/extensions */
import fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';
import updateHtml from './resources.js';
import debugPageLoader from './debug.js';
import { getPathname, loadUrl } from './utils.js';

const pageLoader = (url, dir = process.cwd()) => {
  const { origin, hostname, pathname } = new URL(url);

  const pagepath = getPathname(hostname, pathname, '.html');
  const filespath = getPathname(hostname, pathname, '_files');
  const originpath = getPathname(hostname);

  let html = '';
  let resourceDetails = [];

  return loadUrl(url)
    .then(({ data }) => {
      const result = updateHtml(data, origin, originpath, filespath);
      resourceDetails = result.resourceDetails;
      html = result.updatedHtml;
    })
    .then(() => {
      debugPageLoader(`Create page directory: ${dir}`);
      return fs.mkdir(dir, { recursive: true });
    })
    .then(() => {
      debugPageLoader(`Create directory for resourses: ${filespath}`);
      return fs.mkdir(`${dir}/${filespath}`, { recursive: true });
    })
    .then(() => {
      debugPageLoader(`Create html file: ${pagepath}`);
      return fs.writeFile(`${dir}/${pagepath}`, html);
    })
    .then(() => {
      debugPageLoader('Downloading page resources');
      const promises = resourceDetails
        .map(({ filename, url: resourceUrl }) => loadUrl(resourceUrl, { responseType: 'arraybuffer' })
          .then(({ data }) => {
            debugPageLoader(`Create page's resources file: ${filename}`);
            return { filename, fileData: data };
          })
          .catch((err) => {
            throw new Error(`Error in downloading resource: ${err.message}`);
          }));

      return Promise.all(promises);
    })
    .then((data) => {
      debugPageLoader('Writing resources data into files');
      const resources = data.map(({ filename, fileData }) => {
        const { base } = path.parse(filename);
        const obj = {
          title: base,
          task: () => fs.writeFile(`${dir}/${filename}`, fileData),
        };
        return obj;
      });

      const tasks = new Listr(resources, { concurrent: true });
      return tasks.run();
    })
    .then(() => `${dir}/${pagepath}`);
};

export default pageLoader;
