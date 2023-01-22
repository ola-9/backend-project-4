import axios from 'axios';

export const getPathname = (hostname, pathname = '', type = '') => {
  const currPath = pathname.length === 1 ? '' : pathname;
  const formatted = `${hostname}${currPath}`.replace(/[^a-zA-Z0-9]/g, '-');
  return `${formatted}${type}`;
};

export const loadUrl = (url, responseType = {}) => axios.get(url, responseType);
