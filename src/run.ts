import fs from 'fs';

import Parser from './frontend/parser';
import Environment from './runtime/environment';
import { evaluate } from './runtime/interpreter';
import { RuntimeVal } from './runtime/values';
import { ObjectVal } from './runtime/values/complex';
import { MK_STRING } from './runtime/values/primitive';

function betterPath(path: string): string {
  let paths = path.split(/[\\\/]/);
  paths.forEach((path, i) => {
    if (path == '..') {
      paths.splice(i - 1, 2);
    }
  });

  return paths.join('/');
}

export default function run(
  sourceCode: string,
  values: [string, RuntimeVal][] = []
): ObjectVal {
  const env = Environment.getGlobalScope();

  (env.lookupVar('modulo') as ObjectVal).properties.setAll(values);

  const parser = new Parser();

  const program = parser.produceAST(sourceCode);

  const module = evaluate(program, env) as ObjectVal;
  return module;
}
run.file = function (path: string) {
  path = betterPath(path);
  const sourceCode = fs.readFileSync(path, 'utf-8');
  const module = run(sourceCode, [
    ['nombre', MK_STRING(path)],
    [
      'folder',
      MK_STRING(path.split('/').slice(0, -1).join('/')),
    ],
  ]);
  return module;
};
