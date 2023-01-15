/* eslint-disable import/extensions */
import {
  test,
  expect,
  beforeAll,
  beforeEach,
} from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';
import os from 'os';
import fs from 'fs/promises';
import pageLoader from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);

// https://github.com/nock/nock#debugging
// user @local$ DEBUG = nock.* node my_test.js

nock.disableNetConnect();

let initial = '';
let expected = '';
let tempDir = '';
let expectedImg = '';

beforeAll(async () => {
  initial = await fs.readFile(getFixturePath('initial.html'), 'utf-8');
  expected = await fs.readFile(getFixturePath('expected.html'), 'utf-8');
  expectedImg = await fs.readFile(getFixturePath('nodejs.png'), 'utf-8');
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('page and resources are downloaded', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, initial)
    .get('/assets/professions/nodejs.png')
    .reply(200, expectedImg)
    .get('/assets/application.css')
    .reply(200, expectedImg)
    .get('/packs/js/runtime.js')
    .reply(200, expectedImg)
    .get('/courses')
    .reply(200, expectedImg);

  const filepath = await pageLoader('https://ru.hexlet.io/courses', tempDir);
  const actual = await fs.readFile(filepath, 'utf-8');
  expect(actual).toEqual(expected);

  const imageFilename = 'ru-hexlet-io-assets-professions-nodejs.png';
  const imageFilePath = path.join(tempDir, 'ru-hexlet-io-courses_files', imageFilename);
  const actualImage = await fs.readFile(imageFilePath, 'utf-8');
  expect(actualImage).toEqual(expectedImg);
});

const httpErrors = [400, 500];

test.each(httpErrors)('network error: %d', async (errorCode) => {
  nock('https://ru.hexlet.io')
    .get('/webinars')
    .reply(errorCode)
    .get('/courses')
    .reply(errorCode);

  // https://github.com/jest-community/eslint-plugin-jest/issues/54
  await expect(() => pageLoader('https://ru.hexlet.io/webinars', tempDir))
    .rejects.toThrow();
  await expect(() => pageLoader('https://ru.hexlet.io/courses', '/none-exist'))
    .rejects.toThrow();
});
