import axios from 'axios';
import fs from 'fs/promises';
import { load } from 'cheerio';
import prettier from 'prettier';

const getPathname = (hostname, pathname = '', type = '') => {
  console.log('hostname: ', hostname);
  console.log('pathname:', pathname);
  const path = pathname.length === 1 ? '' : pathname;
  const formatted = `${hostname}${path}`.replace(/[^a-zA-Z0-9]/g, '-');
  // console.log('formatted: ', formatted);
  return `${formatted}${type}`;
};
// console.log(getPathname());

const getImageUrls = (html, originUrl = 'https://ru.hexlet.io') => {
  const $ = load(html);
  const imageUrls = [];
  $('img').each((i, image) => {
    const src = $(image).attr('src');
    imageUrls.push(`${originUrl}${src}`);
  });
  console.log('imageUrls: ', imageUrls);
  return imageUrls;
};

const updateHtml = (html, originpath, filespath) => {
  const $ = load(html);
  $('img').each((i, image) => {
    const formattedSrc = $(image)
      .attr('src').split('/').join('-');
    $(image).attr('src', `${filespath}/${originpath}${formattedSrc}`);
  });

  // console.log('$$$$$$: ', $.html());
  return prettier.format($.html(), { parser: 'html' });
};

const pageLoader = (url, dir = process.cwd()) => {
  // const filepath = 'ru-hexlet-io-courses.html';
  const { origin, hostname, pathname } = new URL(url);
  const pagepath = getPathname(hostname, pathname, '.html');
  const filespath = getPathname(hostname, pathname, '_files');
  const originpath = getPathname(hostname);
  // console.log('originpath: ', originpath);
  let html = '';
  return axios.get(url)
    .then(({ data }) => {
      // console.log(data);
      // html = data;
      const imageUrls = getImageUrls(data);
      html = updateHtml(data, originpath, filespath);
    })
    .then(() => fs.mkdir(dir, { recursive: true }))
    .then(() => fs.mkdir(`${dir}/${filespath}`, { recursive: true }))
    .then(() => fs.writeFile(`${dir}/${pagepath}`, html))
    .then(() => `${dir}/${pagepath}`);
};

// pageLoader('https://page-loader.hexlet.repl.co', './page-loader');
// pageLoader('https://ru.hexlet.io/courses', './load-courses');

export default pageLoader;
