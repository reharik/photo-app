import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {typeof import('koa').default} */
const Application = require('koa/lib/application.js');
const { HttpError } = require('http-errors');

export default Application;
export { HttpError };
