import { readFileSync, writeFileSync } from 'fs';
import Parser from './frontend/parser';
import Environment from './runtime/environment';
import { evaluate } from './runtime/interpreter';

function run(sourceCode: string) {
  const env = new Environment();
  const parser = new Parser();

  const program = parser.produceAST(sourceCode);
  writeFileSync('ast.json', JSON.stringify(program, null, 2))

  const result = evaluate(program, env);
}

run(readFileSync(__dirname+'/../index.txt', 'utf-8'))