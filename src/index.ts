import { error, ErrorType } from './frontend/error';
import getArgs from './libs/args';
import run from './run';


let file = getArgs().filter(Boolean)[0];

if(file === ''){
  error(ErrorType.FileNotFound, 0, 0)
  process.exit(1);
}

if(file.startsWith('.')){}
else if(file.startsWith('/')){}
else if(/^[A-Z][:]/.test(file)){}

let index = run.file(file, './')

import fs from 'fs';
fs.writeFileSync('./program.json', JSON.stringify(index[Symbol.toPrimitive], null, 2));