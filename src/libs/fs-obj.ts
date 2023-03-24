import fs from 'fs';
import JSZip from 'jszip';

export default function fs_obj(path: string) {
  const obj = {};
  fs.readdirSync(path).forEach(file => {
    const stat = fs.statSync(`${path}/${file}`);
    if (stat.isDirectory()) {
      obj[file] = { dir: true, value: fs_obj(`${path}/${file}`) };
    } else {
      obj[file] = { dir: false, value: fs.readFileSync(`${path}/${file}`) };
    }
  });
  return obj;
}
fs_obj.fromJSZip = function (zip: JSZip) {
  const obj = {};
  zip.forEach((path, file) => {
    const paths = path.split('/');
    let actual = obj;
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (i == paths.length - 1) {
        actual[path] = {
          dir: false,
          value: file.async('nodebuffer'),
        };
      } else {
        actual[path] ||= { dir: true, value: {} };
        actual = actual[path].value;
      }
    }
  });
  return obj;
};
