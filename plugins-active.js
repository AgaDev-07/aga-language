const fs = require('fs');
const cp = require('child_process');
fs.readdirSync(__dirname+'/plugins').forEach(file => {
  cp.execSync(`cd ${__dirname}/plugins/${file} && npm i`);
})