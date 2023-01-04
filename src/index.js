/* eslint-disable import/extensions */
import axios from 'axios';
import fs from 'fs/promises';
import debug from 'debug';
// import Listr from 'listr';
import {
  updateHtml,
  downloadResources,
} from './resources.js';

const debugPageLoader = debug('page-loader');

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
      // console.log('resourclearceDetails: ', resourceDetails);
    })
    .then(() => fs.mkdir(dir, { recursive: true }))
    .then(() => fs.mkdir(`${dir}/${filespath}`, { recursive: true }))
    .then(() => fs.writeFile(`${dir}/${pagepath}`, html))
    .then(() => downloadResources(resourceDetails, dir))
    .then(() => {
      debugPageLoader(`Page was successfully downloaded into ${dir}${pagepath}`);
      return `${dir}/${pagepath}`;
    });
};

// pageLoader('https://page-loader.hexlet.repl.co', './page-loader');
pageLoader('https://ru.hexlet.io/courses', './load-courses');
// pageLoader('https://htmlacademy.ru/', './load-courses');

export default pageLoader;
