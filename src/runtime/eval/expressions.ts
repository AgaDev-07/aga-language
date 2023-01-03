import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  FunctionDeclaration,
  Identifier,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  PropertyIdentifier,
} from '../../frontend/ast';
import { error, ErrorType } from '../../frontend/error';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import {
  NumberVal,
  RuntimeVal,
  MK_NUMBER,
  MK_NULL,
  MK_NAN,
  ObjectVal,
  FunctionVal,
  MK_BOOLEAN,
  PrimitiveVal,
  MK_VOID,
  StringVal,
  MK_STRING,
  MK_OBJECT,
  MK_PROPERTY,
  ObjectPropVal,
  ReturnVal,
} from '../values';

export function eval_condition_binary_expr(
  lhs: PrimitiveVal,
  rhs: PrimitiveVal,
  operator: string
) {
  const not_undefined = lhs.type != undefined && rhs.type != undefined;
  if (!not_undefined) return MK_NULL();

  const lVal = lhs.value;
  const rVal = rhs.value;

  const lType = lhs.type;
  const rType = rhs.type;

  let value: number | boolean;

  if (operator == '==') value = lVal == rVal;
  else if (operator == '!=') value = lVal != rVal;
  else if (operator == '&&') value = lVal && rVal;
  else if (operator == '||') value = lVal || rVal;
  else if (operator == '===') value = lVal == rVal && lType == rType;
  else if (operator == '!==') value = lVal != rVal || lType != rType;
  else if (operator == '&') value = lVal & rVal;
  else if (operator == '|') value = lVal | rVal;
  if (typeof value == 'number') return MK_NUMBER(value);
  return MK_BOOLEAN(value);
}

export function eval_numeric_binary_expr(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string
): RuntimeVal {
  let result = 0;

  if (operator == '+') result = lhs.value + rhs.value;
  else if (operator == '-') result = lhs.value - rhs.value;
  else if (operator == '*') result = lhs.value * rhs.value;
  else if (operator == '/') {
    if (rhs.value == 0)
      error(ErrorType.DivisionByZero, 0, 0, 'Division entre cero no permitido');
    result = lhs.value / rhs.value;
  } else if (operator == '%') {
    if (rhs.value == 0)
      error(ErrorType.DivisionByZero, 0, 0, 'Division entre cero no permitido');
    result = lhs.value % rhs.value;
  }

  return MK_NUMBER(result);
}

function parse(value: PrimitiveVal, type: string): RuntimeVal {
  if (value.type == type) return value;
  if (value.type == 'numero') return MK_NUMBER(value.value);
  if (value.type == 'booleano') return MK_BOOLEAN(value.value);
  if (value.type == 'nulo') return MK_NULL();
  if (value.type == 'void') return MK_VOID();
  return MK_NULL();
}
function isNaN(value: PrimitiveVal): boolean {
  if (value.type == 'numero') return value.value == null;
  return false;
}

export function eval_string_binary_expr(
  lhs: StringVal,
  rhs: StringVal,
  operator: string
): RuntimeVal {
  if (operator == '+') return MK_STRING(lhs.value + rhs.value);
  return MK_NULL();
}

export function eval_parse_binary_expr(
  lhs: PrimitiveVal,
  rhs: PrimitiveVal,
  operator: string
): RuntimeVal {
  if (lhs.family != 'primitive' || rhs.family != 'primitive') return MK_NULL();

  const hasNumber = lhs.type == 'numero' || rhs.type == 'numero';
  const hasString = lhs.type == 'cadena' || rhs.type == 'cadena';

  if (hasNumber) {
    let lVal = parse(lhs, 'numero') as NumberVal;
    let rVal = parse(rhs, 'numero') as NumberVal;
    if (isNaN(lVal) || isNaN(rVal)) return MK_NAN();
    return eval_numeric_binary_expr(lVal, rVal, operator);
  }

  return MK_NULL();
}

export function eval_binary_expr(
  binop: BinaryExpr,
  env: Environment
): RuntimeVal {
  const lhs = evaluate(binop.left, env);
  const rhs = evaluate(binop.right, env);

  const isCondition = ['==', '!=', '&', '|', '===', '!==', '&&', '||'].includes(
    binop.operator
  );

  if (isCondition)
    return eval_condition_binary_expr(
      lhs as PrimitiveVal,
      rhs as PrimitiveVal,
      binop.operator
    );

  return eval_parse_binary_expr(
    lhs as PrimitiveVal,
    rhs as PrimitiveVal,
    binop.operator
  );
}

export function eval_identifier(id: Identifier, env: Environment): RuntimeVal {
  const val = env.lookupVar(id.symbol);
  if (!val)
    error(
      ErrorType.UndefinedVariable,
      0,
      0,
      `Variable "${id.symbol}" no definida`
    );
  return val;
}

export function eval_property_identifier(
  id: PropertyIdentifier,
  env: Environment
): RuntimeVal {
  return MK_PROPERTY(id.symbol);
}
export function eval_assignment(
  node: AssignmentExpr,
  env: Environment
): RuntimeVal {
  if (node.assignee.kind === 'MemberExpr') {
    const obj = evaluate(
      (node.assignee as MemberExpr).object,
      env
    ) as ObjectVal;
    if (obj.type !== 'object')
      error(
        ErrorType.InvalidSyntax,
        0,
        0,
        `No se puede asignar la propiedad "${
          ((node.assignee as MemberExpr).property as PropertyIdentifier).symbol
        }" a un "${obj.type}"`
      );
    const prop = evaluate((node.assignee as MemberExpr).property, env);
    const name = (prop as StringVal).value;
    const value = evaluate(node.value, env);
    obj.properties.set(name, value);
    return value;
  }
  if (node.assignee.kind === 'Identifier') {
    const name = (node.assignee as Identifier).symbol;
    return env.assignVar(name, evaluate(node.value, env));
  }
  error(ErrorType.InvalidSyntax, 0, 0, 'Asignacion invalida');
}

export function eval_object_expr(
  obj: ObjectLiteral,
  env: Environment
): RuntimeVal {
  const object = {};
  for (const { key, value } of obj.properties) {
    if (value) {
      const runtimeVal =
        value == undefined ? env.lookupVar(key) : evaluate(value, env);
      object[key] = runtimeVal;
    }
  }
  return MK_OBJECT(object);
}

export function eval_member_expr(
  node: MemberExpr,
  env: Environment
): RuntimeVal {
  const obj = evaluate(node.object, env) as ObjectVal;
  if (obj.type != 'object')
    error(
      ErrorType.InvalidSyntax,
      0,
      0,
      `"${(node.property as PropertyIdentifier).symbol}" no es propiedad de ${
        obj.type
      }`
    );

  const prop = evaluate(node.property, env);
  const name = (prop as StringVal).value;
  const value = obj.properties.get(name);
  return value || MK_NULL();
}

export function eval_call_expr(node: CallExpr, env: Environment): RuntimeVal {
  const nameFunction: string =
    (node.callee as Identifier).symbol ||
    (node.callee as FunctionDeclaration).identifier ||
    (node.callee as NumericLiteral).value.toString() ||
    'nulo';
  const callee = evaluate(node.callee, env) as FunctionVal;

  if (callee.type != 'function')
    error(ErrorType.InvalidSyntax, 0, 0, `${nameFunction} no es una funcion`);

  const args = node.args.map(arg => evaluate(arg, env));
  const calleeEnv = callee.env();
  callee.params.forEach((param, i) => {
    calleeEnv.declareVar(param, args[i] || MK_NULL());
  });

  let value;

  if (callee.native) value = callee.native(...args);
  else value = evaluate(callee.body, calleeEnv)

  return value || MK_VOID();
}
