import { FunctionDeclaration, IfStatement, Program, VarDeclaration } from '../../frontend/ast';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import { MK_FUNCTION, MK_NULL, RuntimeVal } from '../values';

export function eval_program(program: Program, env: Environment): RuntimeVal {
  let lastEvaluated: RuntimeVal = MK_NULL();

  for (const stmt of program.body) {
    lastEvaluated = evaluate(stmt, env);
  }

  return lastEvaluated;
}

export function eval_var_declaration(
  declaration: VarDeclaration,
  env: Environment
): RuntimeVal {
  const value = declaration.value
    ? evaluate(declaration.value, env)
    : MK_NULL();
  return env.declareVar(declaration.identifier, value, declaration.constant);
}

export function eval_function_declaration(
  declaration: FunctionDeclaration,
  env: Environment
): RuntimeVal {
  const value = MK_FUNCTION(declaration.params, declaration.body, env)
  return env.declareVar(declaration.identifier, value);
}

export function eval_if_statement(
  statement: IfStatement,
  env: Environment
): RuntimeVal {
  return MK_NULL();
}