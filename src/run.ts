import fs from 'fs';
import cp from 'child_process';

import afs from '@agacraft/fs';

import Parser from './frontend/parser';
import Environment from './runtime/environment';
import { evaluate } from './runtime/interpreter';
import { RuntimeVal } from './runtime/values';
import { MK_OBJECT, ModuleVal, ObjectVal } from './runtime/values/complex';
import { MK_STRING, StringVal } from './runtime/values/primitive';
import { error, ErrorType } from './frontend/error';

import agal_modules from './agal_modules';

const EXTENCION = 'agal';
const INDEX = 'principal';
const DIR_MODULES = `modulos_${EXTENCION}`;

function getDir(): string {
  const cd = cp.execSync('cd').toString().replace(/\n|\r/g, '');
  const dir = cd
    .split(/[\\\/]/)
    .filter(Boolean)
    .join('/');
  return dir;
}

function getModulePaths(path: string): string[] {
  const paths = path.split(/[\\\/]/);
  const modulePaths = [];
  for (let i = paths.length; i > 0; i--) {
    const modulePath = paths.slice(0, i).join('/');
    modulePaths.push(modulePath + '/' + DIR_MODULES);
  }
  return modulePaths;
}

function getPath(path: string): string {
  if (afs.isDirectory(path))return getPath(`${path}/${INDEX}`);

  if (afs.isFile(path)) return path;
  if (afs.isFile(`${path}.${EXTENCION}`)) return `${path}.${EXTENCION}`;
}

function getModulePath(actualDir: string, module: string): string | void {
  const modulePaths = getModulePaths(actualDir);
  for (let i = 0; i < modulePaths.length; i++) {
    const path = getPath(`${modulePaths[i]}/${module}`);
    if (path) return path;
  }
}

function betterPath(path: string): string {
  let actualDir = getDir();
  if (path.startsWith('.')) path = `${actualDir}/${path}`;
  else if (path.startsWith('/')) path = actualDir.split('/')[0] + path;
  else if (/^[A-Z][:]/.test(path)) {
  } else
    path = getModulePath(actualDir, path) || error(
      ErrorType.UnwnownModule,
      0,
      0,
      `No se encontró el módulo '${path}'`
    ) || '';

  let paths = path.split(/[\\\/]/);
  paths.forEach((path, i) => {
    if (path == '..') {
      paths.splice(i - 1, 2);
    }
    if (path == '.') paths.splice(i, 1);
  });

  return paths.join('/');
}

export default function run(
  sourceCode: string,
  values: [string, RuntimeVal][] = []
): ModuleVal {
  const env = Environment.getGlobalScope();

  const modulo = env.lookupVar('modulo') as ModuleVal;

  modulo.properties.setAll(values);

  const folder = modulo.properties.get('folder');

  env.declareVar('__folder', folder);
  const archivo = modulo.properties.get('archivo');
  env.declareVar('__archivo', archivo);

  const parser = new Parser();
  const program = parser.produceAST(sourceCode);

  const module = evaluate(program, env) as ModuleVal;
  return module;
}

run.file = function (original_path: string) {
  console.log(agal_modules, original_path)
  if(agal_modules[original_path]){
    const fn = agal_modules[original_path];
    const module = MK_OBJECT({
      exporta: fn(original_path),
      nombre: MK_STRING(original_path),
    });
    return module;
  }
  const path = betterPath(original_path);
  const sourceCode = fs.readFileSync(path, 'utf-8');
  let module = run(sourceCode, [
    ['nombre', MK_STRING(original_path)],
    ['folder', MK_STRING(path.split('/').slice(0, -1).join('/'))],
    ['archivo', MK_STRING(path)],
  ]);
  return module;
};
