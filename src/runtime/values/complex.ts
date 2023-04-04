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
import { MK_NULL, MK_STRING, NumberVal, StringVal } from './primitive';

const FUNCTION_PROPS: Record<string, RuntimeVal> = {};
const ARRAY_PROPS: Record<string, RuntimeVal> = {};
const OBJECT_PROPS: Record<string, RuntimeVal> = {};
const CLASS_PROPS: Record<string, RuntimeVal> = {};
const CLASS_INSTANCE_PROPS: Record<string, RuntimeVal> = {};

export class Complex extends RuntimeClassVal implements RuntimeVal {
  family: 'complex' = 'complex';
  static props = {} as Record<symbol|string, FunctionVal>
  properties: Properties<AnyVal>;
  constructor(
    public type: ComplexType,
    properties: { [key: string]: RuntimeVal } = {},
    public parent?: Function,
    values?: any,
    ofType?: Record<string, RuntimeVal>
  ) {
    super();
    this.properties = new Properties(this as AnyVal, undefined, ofType);
    let props = Object.entries<RuntimeVal>(properties);

    props.forEach(([key, value]) => {
      this.properties.setDefault(key, MK_PARSE(value));
    });

    for (let [key, value] of Object.entries(values || {})) {
      this[key] = value;
    }
  }
  __pintar__(n = 0) {
    let pintar = this.properties.get('__pintar__') as FunctionVal;
    if (!pintar) return Colors.magenta(this.aCadena());
    return pintar.execute.call(this, n);
  }
  aCadena() {
    let aCadena = this.properties.get('aCadena') as FunctionVal;
    if (!aCadena) return `[complejo ${this.type}]`;
    return aCadena.execute.call(this);
  }
  __native__() {
    let nativo = this.properties[Symbol.toPrimitive] as FunctionVal;
    return nativo.execute.call(this);
  }
}

Complex.props = {
  __pintar__: MK_FUNCTION_NATIVE(function (this: ComplexVal, n: number = 0) {
    const limit = (this.properties.get('__limite__') as NumberVal).value || 4;
    if (n >= limit) return Colors.cyan(`[${this.type}]`);
    let str = '{';
    let props = [];
    for (let [key, value] of this.properties) {
      if(!/^([a-zA-Z0-9$_]*)$/.test(key))key = MK_STRING(key).__pintar__(1);
      if (this == value) {
        props.push(`${key}: ${Colors.cyan(`[circular *${n + 1}]`)}`);
        if (!str.startsWith( Colors.cyan(`[circular *${n + 1}]`)))
          str = Colors.cyan(`[circular *${n + 1}]`) + ' ' + str;
        continue;
      }

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
  [Symbol.toPrimitive]: MK_FUNCTION_NATIVE(function () {
    let obj = {};
    for (let [key, value] of this.properties) {
      if (value && value.__native__) {
        let _value = value.__native__();
        if (_value == undefined) continue;
        obj[key] = _value;
      }
    }
    return obj;
  }),
  aCadena: MK_FUNCTION_NATIVE(function (this: ComplexVal) {
    return `[${this.type}]`;
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
  if (!useProps) return FUNCTION_PROPS;
  FUNCTION_PROPS.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: FunctionVal,
    n = 0
  ) {
    let fn = Colors.cyan(
      `[Funcion: ${this.properties.get('nombre').value || '<anonima>'}]`
    );
    let props = [];
    for (let [key, value] of this.properties) {
      if (key == 'nombre') continue;
      props.push(`${key}: ${value.__pintar__(n + 1)}`);
    }
    let str =
      props.length > 0
        ? ` {\n${'  '.repeat(n + 1)}${
            props.join(',\n' + '  '.repeat(n + 1)) + '\n' + '  '.repeat(n)
          }}`
        : '';
    return fn + str;
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
  ARRAY_PROPS.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: ArrayVal<AnyVal>,
    n: number
  ) {
    let str = '[';
    let list = [];
    let props = [...this.properties.entries()].sort((a, b) => {
      let aNum = +a;
      let bNum = +b;
      if (aNum == aNum && bNum == bNum) return aNum - bNum;
      return a[0] < b[0] ? -1 : 1;
    });
    for (let [key, value] of props) {
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
  });
  ARRAY_PROPS.agregar ||= MK_FUNCTION_NATIVE(
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
  );
  ARRAY_PROPS.__tipode__ ||= MK_FUNCTION_NATIVE(() => 'lista');
  ARRAY_PROPS[Symbol.toPrimitive as unknown as string] ||= MK_FUNCTION_NATIVE(
    function (this: ArrayVal<AnyVal>) {
      let list = [];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (+key == +key) list.push(value.__native__());
        else list[key] = value.__native__();
      }
      return list;
    }
  );
  ARRAY_PROPS.aCadena ||= MK_FUNCTION_NATIVE(
    function (this: ArrayVal<AnyVal>) {
      let list = [];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (+key == +key) list.push(value.aCadena());
        else list[key] = value.aCadena();
      }
      return list.join(', ');
    },
    { name: MK_STRING('aCadena') }
  );
  return ARRAY_PROPS;
}

function MK_CLASS_PROPS() {
  CLASS_PROPS.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: ClassVal,
    n = 0
  ) {
    let name = (this.properties.get('nombre') as StringVal).value;
    return Colors.cyan(`[Clase ${name}]`);
  });
  CLASS_PROPS.__tipode__ ||= MK_FUNCTION_NATIVE(() => MK_STRING('clase'));
  CLASS_PROPS[Symbol.toPrimitive as unknown as string] ||= MK_FUNCTION_NATIVE(
    function (this: ClassVal) {
      let list = [''];
      let props = [...this.properties.entries()].sort((a, b) => {
        let aNum = +a;
        let bNum = +b;
        if (aNum == aNum && bNum == bNum) return aNum - bNum;
        return a[0] < b[0] ? -1 : 1;
      });
      for (let [key, value] of props) {
        if (+key == +key) list.push(value.__native__());
        else list[key] = value.__native__();
      }
      return list;
    }
  );
  CLASS_PROPS.aCadena ||= MK_FUNCTION_NATIVE(
    function (this: ClassVal) {
      let name = (this.properties.get('nombre') as StringVal).value;
      return (`[Clase ${name}]`);
    },
    { name: MK_STRING('aCadena') }
  );
  return CLASS_PROPS;
}
MK_CLASS_PROPS.INSTANCE = function () {
  CLASS_INSTANCE_PROPS.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: ClassVal,
    n = 0
  ) {
    let clase = this.properties.get('constructor') as FunctionVal;
    let nombre = (clase.properties.get('nombre') as StringVal).value;
    let props = [];
    for (let [key, value] of this.properties) {
      props.push(`${key}: ${value.__pintar__(n + 1)}`);
    }
    let str =
      props.length > 0
        ? ` {\n${'  '.repeat(n + 1)}${
            props.join(',\n' + '  '.repeat(n + 1)) + '\n' + '  '.repeat(n)
          }}`
        : '';
    return nombre + str;
  });
  return CLASS_INSTANCE_PROPS;
};

function MK_OBJECT_PROPS() {
  OBJECT_PROPS.__pintar__ ||= Complex.props.__pintar__;
  OBJECT_PROPS.aCadena ||= MK_FUNCTION_NATIVE(
    function (this: ObjectVal) {
      let clase = this.properties.get('constructor') as FunctionVal;
      let nombre = (clase.properties.get('nombre') as StringVal).value;
      return `[Objeto ${nombre}]`;
    },
    { name: MK_STRING('aCadena') }
  );
  OBJECT_PROPS.__tipode__ ||= MK_FUNCTION_NATIVE(() => MK_STRING('objeto'));
  return OBJECT_PROPS;
}

//#region ComplexTypes

export type entries = { [key: string]: RuntimeVal };

export type extendsObjectType = 'lista' | 'funcion' | 'clase' | 'modulo';
export type ComplexType = 'objeto' | extendsObjectType;

export interface ComplexVal extends Complex {}

export function MK_COMPLEX(
  type: ComplexType,
  ofType?: Record<string, RuntimeVal>,
  properties: entries = {},
  parent?: Function,
  values?: any,
): ComplexVal {
  return new Complex(type, properties, parent, values, ofType) as ComplexVal;
}

export interface ObjectVal extends ComplexVal {
  type: 'objeto';
}

export function MK_OBJECT_NATIVE(object: Object): ObjectVal {
  let entries: [string, AnyVal][] = Object.entries(object).map(
    ([key, value]) => [key, MK_PARSE(value, key)]
  );
  let obj = MK_COMPLEX('objeto', MK_OBJECT_PROPS());
  obj.properties.setAll(entries);
  return obj as ObjectVal;
}
export function MK_OBJECT(
  prop: { [key: string]: RuntimeVal } = {},
  privateProps: { [key: string]: RuntimeVal } = {}
): ObjectVal {
  let obj = MK_COMPLEX('objeto', MK_OBJECT_PROPS());
  obj.properties.setAll(Object.entries(prop));
  obj.properties.setAllDefault(
    Object.entries(privateProps)
  );
  return obj as ObjectVal;
}
MK_OBJECT.fromProperties = function (prop: Properties<AnyVal>) {
  let obj = MK_COMPLEX('objeto');
  obj.properties = prop.copy();
  return obj as ObjectVal;
};

export interface ExtendsObjectVal extends ComplexVal {
  type: extendsObjectType;
  parent: Function;
}

export interface ModuleVal extends ExtendsObjectVal {
  type: 'modulo';
  parent: Function;
}

export function MK_MODULE(props:Record<string, AnyVal> = {}, native = false): ModuleVal {
  let obj = MK_COMPLEX(
    'modulo',
    MK_OBJECT_PROPS(),
    {
      __pintar__: MK_FUNCTION_NATIVE(function (this: ModuleVal, n: number) {
        let type = native ? 'Modulo nativo' : 'Modulo';
        let obj = Complex.props.__pintar__.execute.call(this, n);
        return `${type} ${obj}`;
      }),
    },
    MK_MODULE
  );
  obj.properties.setAll(
    Object.entries({
      exporta: MK_OBJECT(),
      hijos: MK_ARRAY(),
      ...props,
    })
  );
  return obj as ModuleVal;
}

export interface ArrayVal<T extends AnyVal> extends ExtendsObjectVal {
  type: 'lista';
  parent: Function;
  properties: Properties<ArrayVal<T>>;
}

export function MK_ARRAY_NATIVE<T extends AnyVal>(...args: T[]): ArrayVal<T> {
  let _args = [...args].map((arg, i) => [i, arg]);
  return MK_ARRAY(Object.fromEntries(_args));
}

export function MK_ARRAY<T extends AnyVal>(
  prop: { [key: string]: T } = {}
): ArrayVal<T> {
  let array = MK_COMPLEX('lista', MK_ARRAY_PROPS(), undefined, MK_ARRAY) as ArrayVal<T>;
  array.properties.setAll(Object.entries(prop));
  return array;
}

export interface FunctionVal extends ExtendsObjectVal {
  type: 'funcion';
  values: any;
  body: Stmt[];
  params: string[];
  env: () => Environment;
  native?: Function;
  nombre?: string;
  execute: (...args: RuntimeVal[]) => RuntimeVal;
  properties: Properties<FunctionVal>;
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
      calleeEnv.declareVar('este', this);
      calleeEnv.declareVar(
        'argumentos',
        MK_ARRAY_NATIVE(...(args as AnyVal[]))
      );
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
    MK_FUNCTION,
    values
  ) as FunctionVal;
  fn.properties.setAll(Object.entries(prop));
  return fn;
}

export interface ClassVal extends ExtendsObjectVal {
  __prototipo__: ObjectVal;
  instace(): ObjectVal;
  type: 'clase';
  parent: Function;
  constructor: FunctionVal;
}

export function MK_CLASS(
  constructor?: FunctionVal,
  statics: { [key: string]: RuntimeVal } = {},
  prop: { [key: string]: RuntimeVal } = {}
): ClassVal {
  let fn = MK_COMPLEX(
    'clase',
    MK_CLASS_PROPS(),
    { constructor },
    MK_FUNCTION,
    {
      ...constructor.values,
      constructor,
      execute() {
        if (!constructor) return;
        constructor.execute.call(this, ...arguments);
      },
    }
  ) as ClassVal;
  fn.__prototipo__ = statics.__prototipo__ = MK_OBJECT(undefined, {
    ...MK_CLASS_PROPS.INSTANCE(),
    ...prop,
    constructor: fn,
  });
  fn.instace = function () {
    return MK_OBJECT.fromProperties(fn.__prototipo__.properties);
  };
  fn.properties.setAll(Object.entries(statics));
  return fn;
}

export function MK_CLASS_NATIVE(
  native: Function,
  statics: Record<string, RuntimeVal> = {}
): ClassVal {
  let constructor = MK_FUNCTION_NATIVE(native);
  let fn = MK_COMPLEX(
    'clase',
    MK_CLASS_PROPS(),
    { constructor },
    MK_FUNCTION,
    {
      ...constructor.values,
      constructor,
      execute() {
        if (!constructor) return;
        constructor.execute.call(this, ...arguments);
      },
    }
  ) as ClassVal;

  fn.instace = function () {
    return null as any;
  };
  fn.properties.setAll(Object.entries(statics));
  return fn;
}

//#endregion
