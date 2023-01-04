/* eslint-disable import/extensions */
import axios from 'axios';
import fs from 'fs/promises';
import {
  updateHtml,
  downloadResources,
} from './resources.js';

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
      // console.log('data: ', data);
      const result = updateHtml(data, origin, originpath, filespath);
      resourceDetails = result.resourceDetails;
      html = result.updatedHtml;
      // console.log('resourceDetails: ', resourceDetails);
    })
    .then(() => fs.mkdir(dir, { recursive: true }))
    .then(() => fs.mkdir(`${dir}/${filespath}`, { recursive: true }))
    .then(() => fs.writeFile(`${dir}/${pagepath}`, html))
    .then(() => downloadResources(resourceDetails, dir))
    .then(() => `${dir}/${pagepath}`);
};

// pageLoader('https://page-loader.hexlet.repl.co', './page-loader');
// pageLoader('https://ru.hexlet.io/courses', './load-courses');
// pageLoader('https://www.tema.ru/main.html', './load-courses');

export default pageLoader;
