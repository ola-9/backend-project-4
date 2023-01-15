import debug from 'debug';
import axiosDebugLog from 'axios-debug-log';

// axios- debug
// https://github.com/Gerhut/axios-debug-log

// nock debug
// https://github.com/nock/nock#debugging

// DEBUG=page-loader page-loader -o page-loader https://page-loader.hexlet.repl.co
const debugPageLoader = debug('page-loader');

axiosDebugLog({
  request: (debugAxios, config) => {
    debugAxios(`Request with ${config.headers['content-type']}`);
  },
  response: (debugAxios, response) => {
    debugAxios(`Response with ${response.headers['content-type']}`, `from ${response.config.url}`);
  },
  error: (debugAxios, error) => {
    debugAxios('error is', error);
  },
});

export default debugPageLoader;
