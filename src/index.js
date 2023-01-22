/* eslint-disable import/extensions */
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';
import {
  updateHtml,
  // downloadResources,
} from './resources.js';
import debugPageLoader from './debug.js';

const getPathname = (hostname, pathname = '', type = '') => {
  const currPath = pathname.length === 1 ? '' : pathname;
  const formatted = `${hostname}${currPath}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${formatted}${type}`;
};

const pageLoader = (url, dir = process.cwd()) => {
  const { origin, hostname, pathname } = new URL(url);

  const pagepath = getPathname(hostname, pathname, '.html');
  const filespath = getPathname(hostname, pathname, '_files');
  const originpath = getPathname(hostname);

  let html = '';
  let resourceDetails = [];
  // const resources = [];

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
      const promises = resourceDetails.map(({ filename, url: resourceUrl }) => axios
        .get(resourceUrl, { responseType: 'arraybuffer' })
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

// pageLoader('https://page-loader.hexlet.repl.co', './page-loader');
// pageLoader('https://ru.hexlet.io/courses', './load-courses');
// pageLoader('https://test.test/', './load-courses');
// page-loader -o page-loader https://test.test
// page-loader -o /page-loader https://page-loader.hexlet.repl.co
export default pageLoader;
