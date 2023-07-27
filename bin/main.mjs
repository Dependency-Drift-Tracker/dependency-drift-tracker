import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import { main } from '../scripts/fill-date.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
await main(join(__dirname, '../data'));
