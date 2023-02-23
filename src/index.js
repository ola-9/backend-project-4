import fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';
import updateHtml from './resources.js';
import debugPageLoader from './debug.js';
import { getPathname, loadUrl } from './utils.js';

const generateTask = (dirpath, resourseName, resourseUrl) => {
  debugPageLoader(`Writing the resource data into file ${resourseName}`);
  const promise = loadUrl(resourseUrl, { responseType: 'arraybuffer' })
    .then(({ data }) => fs.writeFile(`${dirpath}/${resourseName}`, data));
  return promise;
};

const pageLoader = (url, dir = process.cwd()) => {
  debugPageLoader(`The url of the page: ${url}`);
  const { origin, hostname, pathname } = new URL(url);

  const pagepath = getPathname(hostname, pathname, '.html');
  const filespath = getPathname(hostname, pathname, '_files');
  const originpath = getPathname(hostname);

  let html = '';
  let resourceDetails = [];
  debugPageLoader('Starting to download page');
  return loadUrl(url)
    .then(({ data }) => {
      // debugPageLoader('Updating resources urls inside html');
      const result = updateHtml(data, origin, originpath, filespath);
      resourceDetails = result.resourceDetails;
      debugPageLoader('List of page resources: ', resourceDetails);
      html = result.updatedHtml;
      debugPageLoader(`Creating page directory: ${dir}`);
      return fs.mkdir(dir, { recursive: true });
    })
    .then(() => {
      debugPageLoader(`Creating resources directory: ${filespath}`);
      return fs.mkdir(`${dir}/${filespath}`, { recursive: true });
    })
    .then(() => {
      debugPageLoader(`Creating html file: ${pagepath}`);
      return fs.writeFile(`${dir}/${pagepath}`, html);
    })
    .then(() => {
      debugPageLoader('Creating tasks array for Listr');
      const tasks = resourceDetails.map(({ filename, url: resourceUrl }) => {
        const { base } = path.parse(filename);
        const task = {
          title: base,
          task: () => generateTask(dir, filename, resourceUrl),
        };
        return task;
      });

      const listr = new Listr(tasks, { concurrent: true });
      return listr.run();
    })
    .then(() => path.join(dir, pagepath));
};

export default pageLoader;
