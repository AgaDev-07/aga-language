import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  FunctionDeclaration,
  Identifier,
  IterableLiteral,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  PropertyIdentifier,
  StringLiteral,
} from '../../frontend/ast.js';
import { error, ErrorType } from '../../frontend/error.js';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import { RuntimeVal } from '../values';
import { ClassVal, ComplexVal, FunctionVal, MK_ARRAY, MK_OBJECT, ObjectVal } from '../values/complex';
import { MK_PROPERTY } from '../values/internal';
import {
  PrimitiveVal,
  MK_NULL,
  MK_NUMBER,
  MK_BOOLEAN,
  NumberVal,
  MK_STRING,
  MK_VOID,
  StringVal,
  NumberRuntime,
} from '../values/primitive.js';

export function eval_iterable_literal(
  iterable: IterableLiteral,
  env: Environment
): RuntimeVal {
  const identifier = evaluate(iterable.value, env);
  return identifier.__iterable__()
}

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
  lhs: NumberRuntime,
  rhs: NumberRuntime,
  operator: string
): RuntimeVal {
  if (operator === '+') return lhs.add(rhs);
  else if (operator === '-') return lhs.subtract(rhs);
  else if (operator === '*') return lhs.multiply(rhs);
  else if (operator === '/') {
    if (rhs.value == 0 && rhs.imaginary === 0){
      if(lhs.value > 0) return NumberRuntime.Infinity;
      else if(lhs.value < 0) return NumberRuntime.NegativeInfinity;
      else return NumberRuntime.NaN;
    }
    return lhs.divide(rhs);
  } else if (operator === '%') {
    if (rhs.value === 0 && rhs.imaginary === 0)
      return NumberRuntime.NaN;
    return lhs.modulo(rhs);
  } else if(operator === '^'){
    if(rhs.value === 0 && rhs.imaginary === 0)
      return NumberRuntime.One;
    if(lhs.value === 0 && lhs.imaginary === 0)
      return NumberRuntime.Zero;
    return lhs.power(rhs);
  }
  else {
    error(ErrorType.InvalidOperation, 0, 0, `Operador "${operator}" no valido`);
  }
}

function parse(value: PrimitiveVal, type: string): RuntimeVal {
  if (value.type == type) return value;
  if (type == 'cadena') return MK_STRING(value.value);
  if (type == 'numero') return MK_NUMBER(value.value);
  if (type == 'booleano') return MK_BOOLEAN(value.value);
  if (type == 'nulo') return MK_NULL();
  if (type == 'void') return MK_VOID();
  return MK_NULL();
}
function isNeN(value: PrimitiveVal): boolean {
  if (value.type == 'numero') return value.value == null;
  return false;
}

export function eval_string_binary_expr(
  lhs: StringVal,
  rhs: StringVal,
  operator: string
): RuntimeVal {
  if (operator == '+') return MK_STRING(lhs.value + rhs.value);
  error(ErrorType.InvalidOperation, 0, 0, 'No se puede operar con cadenas');
}

export function eval_parse_binary_expr(
  lhs: PrimitiveVal,
  rhs: PrimitiveVal,
  operator: string
): RuntimeVal {
  if (lhs.family != 'primitive' || rhs.family != 'primitive')
    error(
      ErrorType.InvalidOperation,
      0,
      0,
      'No se puede operar con valores complejos'
    );

  const hasNumber = lhs.type == 'numero' || rhs.type == 'numero';
  const hasString = lhs.type == 'cadena' || rhs.type == 'cadena';

  if (hasNumber) {
    let lVal = parse(lhs, 'numero') as NumberRuntime;
    let rVal = parse(rhs, 'numero') as NumberRuntime;
    if (isNeN(lVal) || isNeN(rVal)) return NumberRuntime.NaN;
    return eval_numeric_binary_expr(lVal, rVal, operator);
  }
  if (hasString) {
    let lVal = parse(lhs, 'cadena') as StringVal;
    let rVal = parse(rhs, 'cadena') as StringVal;
    return eval_string_binary_expr(lVal, rVal, operator);
  }

  error(ErrorType.InvalidOperation, 0, 0, `No se puede operar con ${lhs.type}`);
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
    if (obj.family != 'complex')
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
  obj: ObjectLiteral | ArrayLiteral,
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
  if (obj.kind == 'ArrayLiteral') return MK_ARRAY(object);
  return MK_OBJECT(object);
}

export function eval_member_expr(
  node: MemberExpr,
  env: Environment
): RuntimeVal {
  const obj = evaluate(node.object, env) as ObjectVal;

  const prop = evaluate(node.property, env);
  let name = (prop as StringVal).value;
  if(typeof name == 'number') name = `${name}`;

  const value = obj.properties.get(name);
  return value || MK_NULL();
}

export function eval_call_expr(node: CallExpr, env: Environment): RuntimeVal {
  const nameFunction: string =
    (node.callee as Identifier).symbol ||
    (node.callee as FunctionDeclaration).identifier ||
    (node.callee as StringLiteral).value ||
    'nulo';
  let callee = evaluate(node.callee, env) as FunctionVal | ClassVal | NumberVal;

  if(callee.type == 'clase')
    callee = callee.constructor

  const args = node.args.map(arg => evaluate(arg, env));

  if(callee.type == 'numero'){
    let arg = args[0] as NumberVal;

    if(!arg){
      error(ErrorType.InvalidSyntax, 0, 0, `No se puede multiplicar ${callee.value} por nulo`);
    }
    let number = MK_NUMBER(arg.value);

    if(number.value == null){
      error(ErrorType.InvalidSyntax, 0, 0, `No se puede multiplicar ${callee.value} por ${arg.value}`);
    }

    return MK_NUMBER(callee.value * number.value);
  }

  let thisValue:ComplexVal = callee;
  if(node.callee.kind == 'MemberExpr')
    thisValue = evaluate((node.callee as MemberExpr).object, env) as ComplexVal;

  if (callee.type != 'funcion')
    error(ErrorType.InvalidSyntax, 0, 0, `${nameFunction} no es una funcion`);

  let value = callee.execute.call(thisValue, ...args);

  return value || MK_VOID();
}
