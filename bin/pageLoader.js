#!/usr/bin/env node
/* eslint-disable import/extensions */
import { program } from 'commander';
import pageLoader from '../src/index.js';

program
  .version('0.0.1')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")')
  .argument('<url>')
  .action((url, option) => {
    pageLoader(url, option.output).then((result) => console.log(result));
  });

program.parse(process.argv);
