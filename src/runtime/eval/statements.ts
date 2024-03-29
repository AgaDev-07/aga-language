import {
  ClassDeclaration,
  FunctionDeclaration,
  IfStatement,
  Program,
  ReturnStatement,
  VarDeclaration,
  WhileStatement,
} from '../../frontend/ast.js';
import Environment from '../environment.js';
import { evaluate } from '../interpreter.js';
import { RuntimeVal } from '../values.js';
import { FunctionVal, MK_CLASS, MK_FUNCTION } from '../values/complex.js';
import {
  MK_NULL,
  BooleanVal,
  MK_BOOLEAN,
  MK_VOID,
  MK_STRING,
  MK_BOOLEAN_RUNTIME,
} from '../values/primitive.js';

export function eval_program(program: Program, env: Environment): RuntimeVal {
  let lastEvaluated: RuntimeVal = MK_NULL();

  for (const stmt of program.body) {
    lastEvaluated = evaluate(stmt, env);
  }

  return env.lookupVar('modulo');
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
    nombre: MK_STRING(declaration.identifier || ''),
  });
  return env.declareVar(declaration.identifier, value);
}

export function eval_class_declaration(
  declaration: ClassDeclaration,
  env: Environment
): RuntimeVal {
  const statics: Record<string, RuntimeVal> = {nombre: MK_STRING(declaration.identifier)};
  const props = declaration.body
    .map(prop => {
      if (prop.extra || prop.identifier == 'constructor') {
        statics[prop.identifier] = evaluate(prop.value, env);
        return;
      }
      return [prop.identifier, evaluate(prop.value, env)];
    })
    .filter(Boolean) as [string, RuntimeVal][];
  const constructor = statics['constructor'] as FunctionVal;

  const value = MK_CLASS(
    constructor,
    statics,
    Object.fromEntries(props)
  );
  return env.declareVar(declaration.identifier, value);
}

export function eval_class_property(
  identifier: string,
  env: Environment
): RuntimeVal {
  return env.lookupVar(identifier);
}

export function eval_while_statement(
  statement: WhileStatement,
  env: Environment
): RuntimeVal {
  let preCondition = evaluate(statement.condition, env) as BooleanVal;

  let condition = MK_BOOLEAN_RUNTIME(preCondition);

  while (condition.value) {
    const result = evaluate(statement.body, env);

    preCondition = evaluate(statement.condition, env) as BooleanVal;
    condition = MK_BOOLEAN_RUNTIME(preCondition);
    if (result.type == 'break') break;
    if (result.type == 'continue') continue;
  }

  return MK_NULL();
}

export function eval_if_statement(
  statement: IfStatement,
  env: Environment
): RuntimeVal {
  let preCondition = evaluate(statement.condition, env) as BooleanVal;
  let condition = MK_BOOLEAN_RUNTIME(preCondition);

  if (condition.value) {
    return evaluate(statement.body, env);
  } else if (statement.else) {
    return evaluate(statement.else, env);
  }

  return MK_NULL();
}

export function eval_return_statement(
  statement: ReturnStatement,
  env: Environment
): RuntimeVal {
  const value = statement.value ? evaluate(statement.value, env) : MK_VOID();
  return (value);
}
