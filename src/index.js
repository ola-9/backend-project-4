/* eslint-disable import/extensions */
import axios from 'axios';
import fs from 'fs/promises';
import Listr from 'listr';
import {
  updateHtml,
  // downloadResources,
} from './resources.js';
import debugPageLoader from './debug.js';

const getPathname = (hostname, pathname = '', type = '') => {
  const path = pathname.length === 1 ? '' : pathname;
  const formatted = `${hostname}${path}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${formatted}${type}`;
};

const pageLoader = (url, dir = process.cwd()) => {
  const { origin, hostname, pathname } = new URL(url);

  const pagepath = getPathname(hostname, pathname, '.html');
  const filespath = getPathname(hostname, pathname, '_files');
  const originpath = getPathname(hostname);

  let html = '';
  let resourceDetails = [];

  return axios.get(url)
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
      const resources = resourceDetails.map(({ filename, url: resourceUrl }) => {
        const { pathname: path } = new URL(resourceUrl);
        return {
          title: path,
          task: () => axios.get(url, { responseType: 'arraybuffer' })
            .then(({ data }) => fs.writeFile(`${dir}/${filename}`, data))
            .catch((err) => console.error(err)),
        };
      });

      const tasks = new Listr(resources, { concurrent: true });

      // return downloadResources(resourceDetails, dir);
      return tasks.run();
    })
    .then(() => `${dir}/${pagepath}`);
};

// pageLoader('https://page-loader.hexlet.repl.co', './page-loader');
// pageLoader('https://ru.hexlet.io/courses', './load-courses');
// pageLoader('https://test.test/', './load-courses');
// page-loader -o page-loader https://test.test
// page-loader -o /page-loader https://page-loader.hexlet.repl.co
export default pageLoader;
