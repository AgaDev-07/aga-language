import run from '../../run';
import Environment from '../environment';
import { RuntimeVal } from '../values';
import {
  ArrayVal,
  MK_ARRAY,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  ModuleVal,
} from '../values/complex';
import { MK_BOOLEAN, MK_NULL, MK_VOID, StringVal } from '../values/primitive';

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

    const module = run.file(calcPath(path.value, folder.value));
    childrens.properties.get('agregar').execute.call(childrens, module);
    return module.properties.get('exporta');
  };
}

export default (env: Environment) =>
  [
    ['nulo', MK_NULL()],
    ['falso', MK_BOOLEAN(false)],
    ['verdadero', MK_BOOLEAN(true)],
    ['vacio', MK_VOID()],
    [
      'modulo',
      MK_OBJECT({
        exporta: MK_OBJECT(),
        hijos: MK_ARRAY(),
      }),
    ],
    ['requiere', MK_FUNCTION_NATIVE(requiere(env))],
  ] as [string, RuntimeVal][];
