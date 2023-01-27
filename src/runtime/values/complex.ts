import {
  ArrayLiteral,
  BinaryExpr,
  CallExpr,
  ElseStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  Property,
  PropertyIdentifier,
  ReturnStatement,
  Stmt,
  StringLiteral,
  VarDeclaration,
} from '../../frontend/ast';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import { AnyVal, RuntimeClassVal, RuntimeVal } from '../values';
import { Colors, MK_PARSE, Properties } from './internal';
import { MK_NULL, MK_STRING } from './primitive';

const FUNCTION_PROPS: { [key: string]: RuntimeVal } = {};

class Complex extends RuntimeClassVal implements RuntimeVal {
  family: 'complex' = 'complex';
  properties = new Properties();
  static props = {};
  constructor(
    public type: ComplexType,
    properties: { [key: string]: RuntimeVal } = {},
    public parent?: Function,
    values?: any
  ) {
    super()
    let props = Object.entries<RuntimeVal>({ ...Complex.props, ...properties });

    props.forEach(([key, value]) => {
      this.properties.setDefault(key, MK_PARSE(value));
    });

    for (let [key, value] of Object.entries(values || {})) {
      this[key] = value;
    }
  }
  __pintar__(n = 0) {
    let pintar = this.properties.get('__pintar__') as FunctionVal;
    return pintar.execute.call(this, n);
  }
  __NATIVO__() {
    let nativo = this.properties.get('__NATIVO__') as FunctionVal;
    return nativo.execute.call(this);
  }
}

Complex.props = {
  __pintar__: MK_FUNCTION_NATIVE(function (n: number) {
    let str = '{';
    let props = [];
    for (let [key, value] of this.properties) {
      if (key.startsWith('__') && key.endsWith('__')) continue;
      if (value && value.__pintar__)
        props.push(`${key}: ${value.__pintar__(n + 1)}`);
    }
    if (props.length > 0) {
      str += '\n' + '  '.repeat(n + 1);
      let join = ',\n' + '  '.repeat(n + 1);
      str += props.join(join);
      str += '\n' + '  '.repeat(n);
    }
    str += '}';
    return str;
  }),
  __NATIVO__: MK_FUNCTION_NATIVE(function () {
    let obj = {};
    for (let [key, value] of this.properties) {
      if (key.startsWith('__') && key.endsWith('__')) continue;
      if (value && value.__NATIVO__) obj[key] = value.__NATIVO__();
    }
    return obj;
  }),
};

function unParse(stmt: Stmt): string {
  switch (stmt.kind) {
    case 'VarDeclaration':
      let varDecl = stmt as VarDeclaration;
      let typevar = varDecl.constant ? 'const' : 'def';
      return `${typevar} ${varDecl.identifier} = ${unParse(varDecl.value)};`;
    case 'StringLiteral':
      let str = stmt as StringLiteral;
      let quote = str.value.includes('"') ? "'" : '"';
      return `${quote}${str.value}${quote}`;
    case 'ReturnStatement':
      let ret = stmt as ReturnStatement;
      return `retorna ${unParse(ret.value)};`;
    case 'PropertyIdentifier':
      let propId = stmt as PropertyIdentifier;
      return propId.symbol;
    case 'Property':
      let prop = stmt as Property;
      return `${prop.key}: ${unParse(prop.value)}`;
    case 'ObjectLiteral':
      let obj = stmt as ObjectLiteral;
      let props = obj.properties.map(unParse).join(', ');
      return `{ ${props} }`;
    case 'NumericLiteral':
      let num = stmt as NumericLiteral;
      return num.value.toString();
    case 'MemberExpr':
      let member = stmt as MemberExpr;
      return `${unParse(member.object)}.${unParse(member.property)}`;
    case 'IfStatement':
      let ifStmt = stmt as IfStatement;
      let cond = unParse(ifStmt.condition);
      let then = ifStmt.body.map(unParse).join('\n  ');
      let els = ifStmt.else ? unParse(ifStmt.else) : '';
      return `si (${cond}){ ${then} }${els}`;
    case 'Identifier':
      let id = stmt as Identifier;
      return id.symbol;
    case 'FunctionDeclaration':
      let func = stmt as FunctionDeclaration;
      let code = func.body.map(unParse).join('\n  ');
      let name = func.identifier;
      let params = func.params.join(', ');
      return `funcion ${name}(${params}){${code ? `\n  ${code}\n` : ''}}`;
    case 'ElseStatement':
      let elseStmt = stmt as ElseStatement;
      let elseCode = elseStmt.body.map(unParse).join('\n  ');
      return `entonces{ ${elseCode} }`;
    case 'CallExpr':
      let call = stmt as CallExpr;
      let args = call.args.map(unParse).join(', ');
      return `${unParse(call.callee)}(${args})`;
    case 'BinaryExpr':
      let bin = stmt as BinaryExpr;
      return `${unParse(bin.left)} ${bin.operator} ${unParse(bin.right)}`;
    case 'AssignmentExpr':
      let assign = stmt as BinaryExpr;
      return `${unParse(assign.left)} = ${unParse(assign.right)}`;
    case 'ArrayLiteral':
      let arr = stmt as ArrayLiteral;
      let elems = arr.properties.map(prop => unParse(prop)).join(', ');
      return `[${elems}]`;

    default:
      return stmt.toString();
  }
}

function MK_FUNCTION_PROPS(useProps: boolean) {
  if(!useProps) return FUNCTION_PROPS;
  FUNCTION_PROPS.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: FunctionVal
  ) {
    return Colors.cyan(
      `[Funcion: ${this.properties.get('nombre').value || '<anonima>'}]`
    );
  });
  FUNCTION_PROPS.aCadena ||= MK_FUNCTION_NATIVE(
    function () {
      let code = (this as FunctionVal).body.map(unParse).join('\n  ');
      let name = (this as FunctionVal).properties.get('nombre').value || '';
      let str = `funcion ${name}(${this.params.join(', ')}){${
        code ? `\n  ${code}\n` : this.native ? '[codigo nativo]' : ''
      }}`;
      return MK_STRING(str);
    },
    { name: MK_STRING('aCadena') }
  );
  FUNCTION_PROPS.__tipode__ ||= MK_FUNCTION_NATIVE(() => MK_STRING('funcion'));
  FUNCTION_PROPS.nombre ||= MK_STRING('');
  return FUNCTION_PROPS;
}

function MK_ARRAY_PROPS() {
  return {
    __pintar__: MK_FUNCTION_NATIVE(function (this: ArrayVal<AnyVal>, n: number) {
      let str = '[';
      let list = [];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (key.startsWith('__') && key.endsWith('__')) continue;
        if (+key == +key) list.push(value.__pintar__(n + 1));
        else list.push(`${key}: ${value.__pintar__(n + 1)}`);
      }
      if (list.length > 0) {
        str += '\n' + '  '.repeat(n + 1);
        let join = ',\n' + '  '.repeat(n + 1);
        str += list.join(join);
        str += '\n' + '  '.repeat(n);
      }
      str += ']';
      return str;
    }),
    agregar: MK_FUNCTION_NATIVE(
      function (this: ArrayVal<AnyVal>, value: RuntimeVal) {
        let e = [...this.properties.keys()]
          .map(v => +v)
          .filter(v => v == v)
          .sort((a, b) => a - b)
          .pop();
        let index = e == undefined ? 0 : e + 1;
        this.properties.set(index.toString(), value);
        return this;
      },
      { name: MK_STRING('Lista.Agregar') },
      true
    ),
    __typeof__: MK_FUNCTION_NATIVE(() => MK_STRING('lista')),
    __NATIVO__: MK_FUNCTION_NATIVE(function (this: ArrayVal<AnyVal>) {
      let list = [];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (key.startsWith('__') && key.endsWith('__')) continue;
        if (+key == +key) list.push(value.__NATIVO__());
        else list[key] = value.__NATIVO__();
      }
      return list;
    }),
  };
}

function MK_CLASS_PROPS() {
  return {
    __pintar__: MK_FUNCTION_NATIVE(function (this: ClassVal, n: number) {
      let name = this.constructor.properties.get('nombre').value;
      let str = Colors.cyan(`[Clase ${name}]`) + ' {';
      let list = [];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (key.startsWith('__') && key.endsWith('__')) continue;
        if (+key == +key) list.push(value.__pintar__(n + 1));
        else list.push(`${key}: ${value.__pintar__(n + 1)}`);
      }
      if (list.length > 0) {
        str += '\n' + '  '.repeat(n + 1);
        let join = ',\n' + '  '.repeat(n + 1);
        str += list.join(join);
        str += '\n' + '  '.repeat(n);
      }
      str += '}';
      return str;
    }),
    __tipode__: MK_FUNCTION_NATIVE(() => MK_STRING('clase')),
    __NATIVO__: MK_FUNCTION_NATIVE(function (this: ClassVal) {
      let list = [''];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (key.startsWith('__') && key.endsWith('__')) continue;
        if (+key == +key) list.push(value.__NATIVO__());
        else list[key] = value.__NATIVO__();
      }
      return list;
    }),
  };
}

//#region ComplexTypes

export type entries = { [key: string]: RuntimeVal };

export type extendsObjectType = 'lista' | 'clase' | 'modulo';
export type ComplexType = 'objeto' | 'funcion' | extendsObjectType;

export interface ComplexVal extends Complex {}

export function MK_COMPLEX(
  type: ComplexType,
  properties: entries = {},
  parent?: Function,
  values?: any
): ComplexVal {
  return new Complex(type, properties, parent, values) as ComplexVal;
}

export interface ObjectVal extends ComplexVal {
  type: 'objeto';
}

export function MK_OBJECT(prop: { [key: string]: RuntimeVal } = {}, privateProps: { [key: string]: RuntimeVal } = {}): ObjectVal {
  let obj = MK_COMPLEX('objeto');
  obj.properties.setAll(Object.entries(prop));
  obj.properties.setAllDefault(Object.entries(privateProps));
  return obj as ObjectVal;
}

export interface ExtendsObjectVal extends ComplexVal {
  type: extendsObjectType;
  parent: Function;
}

export interface ModuleVal extends ExtendsObjectVal {
  type:'modulo'
  parent: Function;
}
export interface ArrayVal<T extends AnyVal> extends ExtendsObjectVal {
  type: 'lista';
  parent: Function;
  properties: Properties<'lista', T>;
}

export function MK_ARRAY_NATIVE(...args: RuntimeVal[]): ArrayVal<AnyVal> {
  let _args = [...args].map((arg, i) => [i, arg]);
  return MK_ARRAY(Object.fromEntries(_args));
}

export function MK_ARRAY<T extends AnyVal>(prop: { [key: string]: AnyVal } = {}): ArrayVal<T> {
  let array = MK_COMPLEX('lista', MK_ARRAY_PROPS(), MK_OBJECT) as ArrayVal<T>;
  array.properties.setAll(Object.entries(prop));
  return array;
}

export interface FunctionVal extends ComplexVal {
  type: 'funcion';
  values: any;
  body: Stmt[];
  params: string[];
  env: () => Environment;
  native?: Function;
  nombre?: string;
  execute: (...args: RuntimeVal[]) => RuntimeVal;
  properties: Properties<'funcion'>;
}

export function MK_FUNCTION_NATIVE(
  native: Function,
  prop: { [key: string]: RuntimeVal } = {},
  useProps = false
): FunctionVal {
  return MK_FUNCTION([], [], undefined, prop, native, useProps);
}

export function MK_FUNCTION(
  params: string[],
  body: Stmt[],
  env: Environment,
  prop: { [key: string]: RuntimeVal } = {},
  native?: Function,
  useProps = true
): FunctionVal {
  let values = {
    execute(this: FunctionVal, ...args: RuntimeVal[]) {
      const calleeEnv = values.env();
      values.params.forEach((param, i) => {
        calleeEnv.declareVar(param, args[i] || MK_NULL());
      });

      return native ? native.call(this, ...args) : evaluate(body, calleeEnv);
    },
    params,
    body,
    env() {
      return new Environment(env);
    },
    native,
  };
  let fn = MK_COMPLEX(
    'funcion',
    MK_FUNCTION_PROPS(useProps),
    undefined,
    values
  ) as FunctionVal;
  fn.properties.setAll(Object.entries(prop));
  return fn
}

export interface ClassVal extends ExtendsObjectVal {
  type: 'clase';
  parent: Function;
  constructor: FunctionVal;
}

export function MK_CLASS(
  constructor: FunctionVal,
  prop: { [key: string]: RuntimeVal } = {}
): ClassVal {
  let fn = MK_COMPLEX(
    'clase',
    { ...MK_CLASS_PROPS(), constructor },
    MK_FUNCTION,
    { ...constructor.values, constructor, execute(){constructor.execute(...arguments)} }
  ) as ClassVal;
  fn.properties.setAll(Object.entries(prop));
  return fn;
}

//#endregion
