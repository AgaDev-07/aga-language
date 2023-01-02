import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Identifier,
  MemberExpr,
  ObjectLiteral,
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
} from '../values';

export function eval_condition_binary_expr(
  lhs: PrimitiveVal,
  rhs: PrimitiveVal,
  operator: string
){
  const not_undefined = lhs.type != undefined && rhs.type != undefined;
  if(!not_undefined) return MK_NULL();

  const lVal = lhs.value;
  const rVal = rhs.value;

  const lType = lhs.type;
  const rType = rhs.type;

  let value: number | boolean;

  if (operator == '==') value = (lVal == rVal);
  else if (operator == '!=') value = (lVal != rVal);
  else if (operator == '&&') value = (lVal && rVal) ;
  else if (operator == '||') value = (lVal || rVal);
  else if (operator == '===') value = (lVal == rVal) && lType == rType;
  else if (operator == '!==') value = (lVal != rVal) || lType != rType;
  else if (operator == '&') value = (lVal & rVal);
  else if (operator == '|') value = (lVal | rVal);
  if(typeof value == 'number') return MK_NUMBER(value)
  return MK_BOOLEAN(value);
}

export function eval_numeric_binary_expr(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string
): RuntimeVal {
  let result = 0;

  if(lhs.value || rhs.value) return MK_NAN();

  if (operator == '+') result = lhs.value + rhs.value;
  else if (operator == '-') result = lhs.value - rhs.value;
  else if (operator == '*') result = lhs.value * rhs.value;
  else if (operator == '/') {
    if (rhs.value == 0)
      error(ErrorType.DivisionByZero, 0, 0, 'Division by zero is not allowed');
    result = lhs.value / rhs.value;
  } else if (operator == '%') {
    if (rhs.value == 0)
      error(ErrorType.DivisionByZero, 0, 0, 'Division by zero is not allowed');
    result = lhs.value % rhs.value;
  }

  return MK_NUMBER(result);
}

function parse(value: PrimitiveVal, type: string): RuntimeVal {
  if(value.type == type) return value;
  if(value.type == 'numero') return MK_NUMBER(value.value);
  if(value.type == 'booleano') return MK_BOOLEAN(value.value);
  if(value.type == 'nulo') return MK_NULL();
  if(value.type == 'void') return MK_VOID();
  return MK_NULL();
}
function isNaN(value: PrimitiveVal): boolean {
  if(value.type == 'numero') return value.value == null;
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
  if(lhs.family != 'primitive' || rhs.family != 'primitive')return MK_NULL();
  const hasNumber = lhs.type == 'numero' || rhs.type == 'numero';
  const hasString = lhs.type == 'cadena' || rhs.type == 'cadena';

  if (hasNumber){
    let lVal = parse(lhs, 'numero') as NumberVal;
    let rVal = parse(rhs, 'numero') as NumberVal;
    if(isNaN(lVal) || isNaN(rVal)) return MK_NAN();
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

  const isNumber = lhs.type == 'numero' && rhs.type == 'numero';

  const isCondition = ['==', '!=', '&', '|', '===', '!==', '&&', '||'].includes(binop.operator);

  if (isCondition) return eval_condition_binary_expr(lhs as PrimitiveVal, rhs as PrimitiveVal, binop.operator);

  if (isNumber)
    return eval_numeric_binary_expr(
      lhs as NumberVal,
      rhs as NumberVal,
      binop.operator
    );
  return eval_parse_binary_expr(lhs as PrimitiveVal, rhs as PrimitiveVal, binop.operator);
}

export function eval_identifier(id: Identifier, env: Environment): RuntimeVal {
  const val = env.lookupVar(id.symbol);
  if (!val)
    error(
      ErrorType.UndefinedVariable,
      0,
      0,
      `Variable ${id.symbol} is not defined`
    );
  return val;
}
export function eval_assignment(
  node: AssignmentExpr,
  env: Environment
): RuntimeVal {
  if (node.assignee.kind !== 'Identifier')
    error(ErrorType.InvalidSyntax, 0, 0, 'Invalid assignment target');

  const name = (node.assignee as Identifier).symbol;
  return env.assignVar(name, evaluate(node.value, env));
}

export function eval_object_expr(
  obj: ObjectLiteral,
  env: Environment
): RuntimeVal {
  const object = { type: 'object', properties: new Map() } as ObjectVal;
  for (const { key, value } of obj.properties) {
    if (value) {
      const runtimeVal =
        value == undefined ? env.lookupVar(key) : evaluate(value, env);
      object.properties.set(key, runtimeVal);
    }
  }
  return object;
}

export function eval_member_expr(
  node: MemberExpr,
  env: Environment
): RuntimeVal {
  const obj = evaluate(node.object, env) as ObjectVal;
  if (obj.type != 'object')
    error(ErrorType.InvalidSyntax, 0, 0, 'Invalid object');
  if (node.property.kind != 'Identifier')
    error(ErrorType.InvalidSyntax, 0, 0, 'Invalid property');

  const prop =
    obj.properties.get((node.property as Identifier).symbol) || MK_NULL();
  return prop;
}

export function eval_call_expr(node: CallExpr, env: Environment): RuntimeVal {
  const callee = evaluate(node.callee, env) as FunctionVal;

  if (callee.type != 'function')
    error(ErrorType.InvalidSyntax, 0, 0, 'Invalid function call');

  const args = node.args.map(arg => evaluate(arg, env));
  const calleeEnv = callee.env();
  callee.params.forEach((param, i) => {
    calleeEnv.declareVar(param, args[i] || MK_NULL());
  });

  let value;

  if(callee.native)
    value = callee.native(...args);
  else
    value = callee.body.forEach(stmt => evaluate(stmt, calleeEnv, true));

  return value || MK_VOID();
}
