import run from '../../run.js';
import Environment from '../environment.js';
import { RuntimeVal } from '../values.js';
import {
  ArrayVal,
  MK_ARRAY,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  ModuleVal,
} from '../values/complex.js';
import { StringVal } from '../values/primitive.js';

function calcPath(path: string,folder: string) {
  if (path.startsWith('./'))
    return folder + '/' + path.slice(2);
  if (path.startsWith('../')){
    const pathParts = path.split('/');
    const folderParts = folder.split('/');
    let i = 0;
    while (pathParts[i] === '..') {
      i++;
    }
    return [...folderParts.slice(0, -i), ...pathParts.slice(i)].join('/');
  }
  return path;
}

function requiere(env: Environment) {
  return (path: StringVal) => {
    const thisModule = env.lookupVar('modulo') as ModuleVal;
    const childrens = thisModule.properties.get('hijos') as ArrayVal<ModuleVal>;
    const folder = thisModule.properties.get('folder') as StringVal;

    const module = run.file(calcPath(path.value, folder.value), folder.value);
    childrens.properties.get('agregar').execute.call(childrens, module);
    return module.properties.get('exporta');
  };
}

export default (env: Environment) =>
  [
    [
      'modulo',
      MK_OBJECT({
        exporta: MK_OBJECT(),
        hijos: MK_ARRAY(),
      }),
    ],
    ['requiere', MK_FUNCTION_NATIVE(requiere(env))],
  ] as [string, RuntimeVal][];
