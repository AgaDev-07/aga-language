import { readFileSync } from 'fs';
import Parser from './frontend/parser';
import Environment from './runtime/environment';
import { evaluate } from './runtime/interpreter';

function run(sourceCode: string) {
  const env = Environment.getGlobalScope();
  const parser = new Parser();

  const program = parser.produceAST(sourceCode);

  const result = evaluate(program, env);
}

run(readFileSync(__dirname+'/../index.txt', 'utf-8'))