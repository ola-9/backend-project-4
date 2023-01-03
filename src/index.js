import axios from 'axios';
import fs from 'fs/promises';
import { load } from 'cheerio';
import prettier from 'prettier';
import path from 'path';

const getPathname = (hostname, pathname = '', type = '') => {
  const path = pathname.length === 1 ? '' : pathname;
  const formatted = `${hostname}${path}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${formatted}${type}`;
};

export const getImageDetails = (html, originUrl, originpath) => {
  const $ = load(html);
  const imagesDetails = [];
  $('img').each((i, image) => {
    const src = $(image).attr('src');
    imagesDetails.push({
      filename: `${originpath}${src.split('/').join('-')}`,
      url: `${originUrl}${src}`,
    });
  });

  return imagesDetails;
};

export const downloadImages = (imagesDetails, dir, filepath) => {
  // console.log('imagesDetails: ', imagesDetails);
  // console.log('dir: ', dir);
  // console.log('filepath: ', filepath);
  // const [image] = imagesDetails;
  // let imageData = '';
  // return axios.get(image.url, { responseType: 'arraybuffer' })
  //   .then(({ data }) => {
  //     imageData = data;
  //     fs.writeFile(`${dir}/${filepath}/${image.filename}`, data);
  //   })
  //   .then(() => imageData)
  //   .then((data) => console.log(data));

  const promises = imagesDetails.map(({ filename, url }) => axios.get(url, { responseType: 'arraybuffer' })
    .then(({ data }) => fs.writeFile(`${dir}/${filepath}/${filename}`, data))
    .catch((err) => console.log(err)));
    // .then((url) => url));
  return Promise.all(promises);
};

const updateHtml = (html, originpath, filespath) => {
  const $ = load(html);
  $('img').each((i, image) => {
    const formattedSrc = $(image)
      .attr('src').split('/').join('-');
    $(image).attr('src', `${filespath}/${originpath}${formattedSrc}`);
  });

  return prettier.format($.html(), { parser: 'html' });
};

const pageLoader = (url, dir = process.cwd()) => {
  const { origin, hostname, pathname } = new URL(url);
  const pagepath = getPathname(hostname, pathname, '.html');
  const filespath = getPathname(hostname, pathname, '_files');
  const originpath = getPathname(hostname);
  let html = '';
  let imagesDetails = [];
  return axios.get(url)
    .then(({ data }) => {
      imagesDetails = getImageDetails(data, origin, originpath);
      // downloadImages(imagesDetails, dir, filespath);
      // console.log('imagesDetails: ', imagesDetails);
      html = updateHtml(data, originpath, filespath);
    })
    .then(() => fs.mkdir(dir, { recursive: true }))
    .then(() => fs.mkdir(`${dir}/${filespath}`, { recursive: true }))
    .then(() => fs.writeFile(`${dir}/${pagepath}`, html))
    .then(() => downloadImages(imagesDetails, dir, filespath))
    .then(() => `${dir}/${pagepath}`);
};

// pageLoader('https://page-loader.hexlet.repl.co', './page-loader');
// pageLoader('https://ru.hexlet.io/courses', './load-courses');

export default pageLoader;
