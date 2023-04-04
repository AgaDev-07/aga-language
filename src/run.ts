import fs from 'fs';
import cp from 'child_process';

import afs from '@agacraft/fs';

import Parser from './frontend/parser';
import Environment from './runtime/environment';
import { evaluate } from './runtime/interpreter';
import { AnyVal, RuntimeVal } from './runtime/values';
import { MK_MODULE, ModuleVal } from './runtime/values/complex';
import { MK_STRING } from './runtime/values/primitive';
import { error, ErrorType } from './frontend/error';

import agal_modules from './agal_modules/index';
import asyncToSync from './libs/asyncToSync';

const EXTENCION = 'agal';
const INDEX = 'principal';
const DIR_MODULES = `modulos_${EXTENCION}`;

const plugins_modules: Record<string, ModuleVal> = {};

type FileReader = (
  file: string,
  obj: Record<string, string>
) => Promise<string> | string;

const sourceCode: FileReader[] = [file => fs.readFileSync(file, 'utf-8')];
const readSourceCode = (file: string) => {
  for (let i = 0; i < sourceCode.length; i++) {
    const code = asyncToSync(
      sourceCode[i](file, { INDEX, EXTENCION }) as Promise<string>
    );
    if (code) return code;
  }
  return '';
};

const pluginObj = {
  registerReaderFile: (callback: FileReader) => sourceCode.unshift(callback),
  registerModule(name: string, module: AnyVal) {
    plugins_modules[name] = MK_MODULE(
      {
        exporta: module,
        nombre: MK_STRING(name),
      },
      true
    );
  },
  error(message: string, pluginName: string='') {
    message = `Plugin ${pluginName}:\n    ${message}`;
    error(ErrorType.PluginError, 0, 0, message);
  },
};

fs.readdirSync(__dirname + '/../plugins').forEach(file => {
  const plugin = require(`../plugins/${file}`);
  plugin(pluginObj);
});

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
  const modulePaths: string[] = [];
  for (let i = paths.length; i > 0; i--) {
    const modulePath = paths.slice(0, i).join('/');
    modulePaths.push(modulePath + '/' + DIR_MODULES);
  }
  return modulePaths;
}

function getPath(path: string): string {
  if (afs.isDirectory(path)) return getPath(`${path}/${INDEX}`);

  if (afs.isFile(path)) return path;
  if (afs.isFile(`${path}.${EXTENCION}`)) return `${path}.${EXTENCION}`;

  return path;
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
    path =
      getModulePath(actualDir, path) ||
      error(
        ErrorType.UnwnownModule,
        0,
        0,
        `No se encontró el módulo '${path}'`
      ) ||
      '';

  const paths = path.split(/[\\\/]/);
  const newPaths: string[] = [];

  for (let i = 0; i < paths.length; i++) {
    if(paths[i] == '..') newPaths.pop();
    else if(paths[i] == '.'){}
    else newPaths.push(paths[i]);
  }
  return newPaths.join('/');
}

export default function run(
  sourceCode: string,
  values: [string, RuntimeVal][] = []
) {
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
  module[Symbol.toPrimitive] = program;
  return module;
}

run.file = function (original_path: string, folder: string = '') {
  if (original_path == './') original_path = `./${INDEX}`;
  if (agal_modules[original_path]) {
    const fn = agal_modules[original_path];
    const module = MK_MODULE(
      {
        exporta: fn(folder),
        nombre: MK_STRING(original_path),
      },
      true
    );
    return module as unknown as ModuleVal;
  }
  if (plugins_modules[original_path]) {
    const module = plugins_modules[original_path]
    return module as unknown as ModuleVal;
  }
  const path = betterPath(folder + original_path);
  const file = getPath(path);
  const sourceCode = readSourceCode(file);
  let module = run(sourceCode, [
    ['nombre', MK_STRING(original_path)],
    ['folder', MK_STRING(file.split('/').slice(0, -1).join('/')+'/')],
    ['archivo', MK_STRING(file)],
  ]);
  return module;
};
