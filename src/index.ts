import getArgs from './libs/args';
import run from './run';


let file = getArgs().join(' ');

if(file.startsWith('.')){}
else if(file.startsWith('/')){}
else if(/^[A-Z][:]/.test(file)){}
else file = './' + file

let index = run.file(file)