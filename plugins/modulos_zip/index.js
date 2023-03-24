const fs = require('fs');
const JSZip = require('jszip');

const afs = require('@agacraft/fs');

const fs_obj = require('../../dist/libs/fs-obj').default;

function getZipFolder(paths, fileC = '') {
  const next = paths.shift();
  if (!next) return fileC;
  const file = `${fileC ? fileC + '/' : ''}${next}`;
  if (afs.isFile(file)) return file;
  else return getZipFolder(paths, file);
}

function getZipFile(paths, obj, fileName) {
  if(fileName) return obj instanceof Promise ? obj : obj[fileName]?.value;
  const next = paths.shift();
  if (!next) return obj;
  const file = obj[next] || obj;
  if (file) return getZipFile(paths, file.value);
  else return null
}

/**
 * @param {{registerReaderFile(cb:(file:string)=>string):void, registerModule(name: string, module: any):void}} obj
 */
module.exports = function (obj) {
  const error = message => obj.error(message, 'MODULOS ZIP');
  obj.registerReaderFile(
    /**
     * @param {string} filePath
     * @param {{INDEX:string, EXTENCION:string}} param1
     * @returns {string}
     */
    async function (filePath, { INDEX, EXTENCION }) {
      const paths = filePath.split('/');
      const file = getZipFolder(paths);

      if (!file.endsWith('.pagal')) return;

      const content = fs.readFileSync(file);

      const zip = await JSZip.loadAsync(content);
      const zipFolder = fs_obj.fromJSZip(zip);

      const fileInZip = paths.join('/')
      const folderZip = getZipFile(paths, zipFolder);
      const fileZip = getZipFile(paths, folderZip, `${INDEX}.${EXTENCION}`);

      if (!fileZip)
        return error(
          `No se encontro el archivo "${fileInZip}" en el zip "${file}"`
        );
      return await fileZip.then(a => a.toString());
    }
  );
};
