import { error, ErrorType } from '../../frontend/error.js';
import run from '../../run.js';
import Environment from '../environment.js';
import { RuntimeVal } from '../values.js';
import {
  ArrayVal,
  Complex,
  MK_ARRAY_NATIVE,
  MK_FUNCTION_NATIVE,
  MK_MODULE,
  MK_OBJECT,
  MK_OBJECT_NATIVE,
  ModuleVal,
  ObjectVal,
} from '../values/complex.js';
import { MK_STRING, StringVal } from '../values/primitive.js';

function calcPath(path: string, folder: string) {
  if (path.startsWith('./')) return folder + '/' + path.slice(2);
  if (path.startsWith('../')) {
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

export default (env: Environment) => {
  const modulo = MK_MODULE();
  return [
    ['modulo', modulo],
    ['exporta', modulo.properties.get('exporta')],
    ['requiere', MK_FUNCTION_NATIVE(requiere(env))],
    [
      'proceso',
      MK_OBJECT({
        argv: MK_ARRAY_NATIVE(...process.argv.slice(1).map(
        MK_STRING)),
        env: MK_OBJECT_NATIVE(process.env as any),
        salir: MK_FUNCTION_NATIVE((code: number) => process.exit(code)),
        plataforma: MK_STRING(process.platform),
        titulo: MK_STRING(process.title),
        ponerTitulo: MK_FUNCTION_NATIVE((title?: StringVal) => {
          if (!title) return process.title;
          if (title.type !== 'cadena')
            error(
              ErrorType.InvalidType,
              0,
              0,
              'Se esperaba una cadena como argumento'
            );
          process.title = title.value;
        }),
        moduloPrincipal: modulo,
      }, {
        __pintar__: MK_FUNCTION_NATIVE(function(this: ObjectVal, n?: number) {
          return 'proceso '+Complex.props.__pintar__.execute.call(this, n);
        })
      }),
    ],
  ] as [string, RuntimeVal][];
};
