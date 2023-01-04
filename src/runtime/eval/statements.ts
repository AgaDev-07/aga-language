import { FunctionDeclaration, IfStatement, Program, ReturnStatement, VarDeclaration } from '../../frontend/ast';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import { RuntimeVal } from '../values';
import { MK_FUNCTION } from '../values/complex';
import { MK_RETURN } from '../values/internal';
import { MK_NULL, BooleanVal, MK_BOOLEAN, MK_VOID, MK_STRING } from '../values/primitive';

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
  const value = MK_FUNCTION(declaration.params, declaration.body, env, {
    name: MK_STRING(declaration.identifier || ''),
  })
  return env.declareVar(declaration.identifier, value);
}

export function eval_if_statement(
  statement: IfStatement,
  env: Environment
): RuntimeVal {
  let condition = evaluate(statement.condition, env) as BooleanVal;
  if (condition.type !== 'booleano')condition = MK_BOOLEAN(condition.value)

  if (condition.value) {
    return evaluate(statement.body, env);
  } else if (statement.else){
    return evaluate(statement.else, env);
  }

  return MK_NULL();
}

export function eval_return_statement(
  statement: ReturnStatement,
  env: Environment
): RuntimeVal {
  const value = statement.value ? evaluate(statement.value, env) : MK_VOID();
  return MK_RETURN(value);
}