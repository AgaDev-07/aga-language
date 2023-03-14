import fs from 'fs';


export default (()=>{
  let modules = {}
  fs.readdirSync(__dirname).forEach((file)=>{
    if(file === 'index.js') return;
    const name = file.split('.')[0]
    const module = require(`./${name}`).default
    modules[name] = module;
    modules[`agal:${name}`] = module;
  })
  return modules;
})()