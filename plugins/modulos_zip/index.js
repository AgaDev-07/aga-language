const fs = require('fs');
const JSZip = require('jszip');

const afs = require('@agacraft/fs');

const values_types = require('../../dist/runtime/values');

const fs_obj = require('../../dist/libs/fs-obj').default;
const complexValues = require('../../dist/runtime/values/complex');

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

function fromJSZip(zip) {
  const obj = {};
  zip.forEach((path, file) => {
      const paths = path.split('/');
      let actual = obj;
      for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          if (i == paths.length - 1) {
              actual[path] = {
                  foler: false,
                  valor: file.async('nodebuffer'),
              };
          }
          else {
              actual[path] ||= { folder: true, valor: {} };
              actual = actual[path].valor;
          }
      }
  });
  return obj;
};

/**
 * @param {{  registerReaderFile(cb: (file: string) => string): void, registerModule(name: string, module: values_types.AnyVal): void }
 * } obj
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

      if (!file.endsWith('.pagal') && !file.endsWith('.zip')) return;
      if (!afs.isFile(file)) return error(`No se encontro el archivo "${file}"`); 

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
  obj.registerModule('zip', complexValues.MK_OBJECT({
    leer: complexValues.MK_FUNCTION_NATIVE(async (buffer) => {
      const zip = await JSZip.loadAsync(buffer.value);
      return fromJSZip(zip);
    })
  }))
};

