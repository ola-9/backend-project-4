/* eslint-disable import/extensions */
import { test, expect, beforeAll, beforeEach } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';
import os from 'os';
import fs from 'fs/promises';
import pageLoader from '../src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);

nock.disableNetConnect();

let initial = '';
let expected = '';
let tempDir = '';

beforeAll(async () => {
  initial = await fs.readFile(getFixturePath('initial.html'), 'utf-8');
  expected = await fs.readFile(getFixturePath('expected.html'), 'utf-8');
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('page is downloaded', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, initial);

  // console.log('initial: ', initial);
  const filepath = await pageLoader('https://ru.hexlet.io/courses', tempDir);
  // console.log('filepath: ', filepath);
  const actual = await fs.readFile(filepath, 'utf-8');
  expect(actual).toEqual(expected);
});
