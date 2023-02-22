/* eslint-disable import/extensions */
import fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';
import updateHtml from './resources.js';
import debugPageLoader from './debug.js';
import { getPathname, loadUrl } from './utils.js';

const generateTask = (dirpath, resourseName, resourseUrl) => {
  const promise = loadUrl(resourseUrl)
    .then(({ data }) => fs.writeFile(`${dirpath}/${resourseName}`, data));
  return promise;
};

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
