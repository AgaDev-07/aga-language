import { ErrorType, error } from '../../frontend/error.js';
import asyncToSync from '../../libs/asyncToSync.js';
import colors from '../../libs/colors.js';
import {
  getBooleano,
  getBuffer,
  getCadena,
  getFuncion,
  getLista,
  getNumero,
  getObjeto,
} from '../global/clases.js';
import { AnyVal, RuntimeClassVal, RuntimeVal, ValueType } from '../values.js';
import {
  ArrayVal,
  ClassVal,
  FunctionVal,
  MK_ARRAY_NATIVE,
  MK_FUNCTION_NATIVE,
  MK_OBJECT_NATIVE,
  ModuleVal,
  ObjectVal,
} from './complex.js';
import {
  MK_BOOLEAN,
  MK_BOOLEAN_RUNTIME,
  MK_BUFFER,
  MK_NULL,
  MK_NUMBER,
  MK_STRING,
  StringVal,
} from './primitive.js';

export const Colors = new Proxy(colors, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    return target.white;
  },
  set(target, p, newValue, receiver) {
    if (p in target) return false;
    if (typeof newValue !== 'function') return false;
    target[p] = newValue;
    return true;
  },
});

const defaultProps: Record<string, RuntimeVal> = {};

type propsDefault = {
  funcion: {
    nombre: StringVal;
  };
  modulo: {
    nombre: StringVal;
    folder: StringVal;
    hijos: ArrayVal<ModuleVal>;
    exporta: ObjectVal;
  };
  lista: {
    agregar: FunctionVal;
  };
  clase: {
    __prototipo__: ObjectVal;
    constructor: FunctionVal;
    nombre: StringVal
  };
} & {
  [key in ValueType]: {
    __pintar__: FunctionVal;
    aCadena: FunctionVal & { execute(): StringVal };
  };
} & {
  [key in Exclude<ValueType, 'clase'>]: {
    constructor: ClassVal;
  };
} & {
  [key in ValueType]: {
    [key: string]: AnyVal;
  };
};

export class Properties<C extends AnyVal> extends Map<string, RuntimeVal> {
  constructor(
    private val: C,
    entries?: [string, RuntimeVal][],
    ofType?: Record<string, RuntimeVal>
  ) {
    super(entries);
    this.ofType = ofType || {};
  }
  private default: { [key: string]: RuntimeVal } = {};
  private ofType: Record<string, RuntimeVal>;
  getProto(k){
    let Get = super.get(k);
    let Default = this.default[k];
    let OfType = this.ofType[k];
    let DefaultProps = defaultProps[k]
    if(Get instanceof RuntimeClassVal) return Get;
    if(Default instanceof RuntimeClassVal) return Default;
    if(OfType instanceof RuntimeClassVal) return OfType;
    if(DefaultProps instanceof RuntimeClassVal) return DefaultProps
  }
  get<T extends C['type'], K extends keyof propsDefault[T]>(
    k: K
  ): propsDefault[T][K] {
    let value: any = this.getProto(k) as propsDefault[T][K];
    if (!value) {
      if (k === 'constructor') {
        if (this.val.type === 'funcion') value = getFuncion();
        else if (this.val.type === 'booleano') value = getBooleano();
        else if (this.val.type === 'numero') value = getNumero();
        else if (this.val.type === 'lista') value = getLista();
        else if (this.val.type === 'objeto') value = getObjeto();
        else if (this.val.type === 'cadena') value = getCadena();
        else if (this.val.type === 'buffer') value = getBuffer();
      } else if (k === 'aCadena') {
        if (this.val.family === 'primitive')
          value = function (this: C) {
            return `${this.__native__()}`;
          };
        else
          value = function (this: C) {
            return `${this}`;
          };
      } else if (k === '__prototipo__') {
        if (this.val === getFuncion()) value = getFuncion.getProto()
        else if (this.val === getLista()) value = getLista.getProto()
        else if (this.val === getObjeto()) value = getObjeto.getProto()
        else if (this.val === getBooleano()) value = getBooleano.getProto()
        else if (this.val === getBuffer()) value = getBuffer.getProto()
        else if (this.val === getCadena()) value = getCadena.getProto()
        else if (this.val === getNumero()) value = getNumero.getProto()

        if (value) {
          this.setDefault(k, value);
        }
      } else {
        if (this.val.type !== 'clase') {
          const clase = this.get('constructor') as unknown as ClassVal;
          const proto = clase.properties.get('__prototipo__');
          value = proto.properties.getProto(k)
        }
      }
    }

    return MK_PARSE(value) as propsDefault[T][K];
  }
  setDefault(key: string, value: RuntimeVal) {
    this.default[key] = value;
    return this;
  }
  setAllDefault(entries: [string, RuntimeVal][]) {
    entries.forEach(([key, value]) => this.setDefault(key, value));
    return this;
  }
  setObjDefault(obj: Record<string, RuntimeVal>) {
    this.default = obj;
    return this;
  }
  setAll(entries: [string, RuntimeVal][]) {
    entries.forEach(([key, value]) => this.set(key, value));
    return this;
  }
  copy() {
    let prop = new Properties(this.val, [...this.entries()]);
    prop.default = { ...this.default };
    return prop;
  }
}

defaultProps.__pintar__ = {
  execute() {
    return Colors.magenta('[Valor en tiempo de ejecución]');
  },
  type: 'funcion',
} as any;

defaultProps.__pintar__.properties = new Properties(
  defaultProps.__pintar__ as FunctionVal
);

defaultProps.aCadena = {
  execute() {},
  __pintar__() {
    return Colors.cyan('[Funcion aCadena]');
  },
} as unknown as RuntimeVal;
defaultProps.aCadena.properties = new Properties(
  defaultProps.aCadena as FunctionVal
);
defaultProps.__pintar__.properties.set('__pintar__', defaultProps.__pintar__);
defaultProps.__pintar__.properties.set('aCadena', defaultProps.aCadena);

defaultProps.aCadena.properties.set('__pintar__', defaultProps.__pintar__);

export type InternalType =
  | 'property'
  | 'return'
  | 'iterator'
  | 'break'
  | 'continue';

export interface InternalVal extends RuntimeVal {
  family: 'internal';
}

export class Internal extends RuntimeClassVal implements InternalVal {
  family: 'internal' = 'internal';
  properties: Properties<AnyVal>;
  constructor(public type: InternalType, public value: any) {
    super();
  }
  __pintar__() {
    return Colors.magenta(`[Valor interno: ${this.type}]`);
  }
  __native__() {
    return this.value.__native__ ? this.value.__native__() : this.value;
  }
}

export function MK_INTERNAL(type: InternalType, value: any): InternalVal {
  return new Internal(value.type, value) as InternalVal;
}
MK_INTERNAL.BREAK = null as BreakVal;
MK_INTERNAL.CONTINUE = null as ContinueVal;

export interface ObjectPropVal extends InternalVal {
  type: 'property';
  symbol: string;
}

export function MK_PROPERTY(value: string): ObjectPropVal {
  return MK_INTERNAL('property', value) as ObjectPropVal;
}

export interface BreakVal extends InternalVal {
  type: 'break';
}

export function MK_BREAK() {
  if (MK_INTERNAL.BREAK) return MK_INTERNAL.BREAK;
  else {
    MK_INTERNAL.BREAK = MK_INTERNAL('break', undefined) as BreakVal;
    return MK_INTERNAL.BREAK;
  }
}

export interface ContinueVal extends InternalVal {
  type: 'continue';
}

export function MK_CONTINUE() {
  if (MK_INTERNAL.CONTINUE) return MK_INTERNAL.CONTINUE;
  else {
    MK_INTERNAL.CONTINUE = MK_INTERNAL('continue', undefined) as ContinueVal;
    return MK_INTERNAL.CONTINUE;
  }
}

export interface IteratorVal extends InternalVal {
  type: 'iterator';
  value: RuntimeVal;
}

export function MK_ITERATOR(value: any): IteratorVal {
  return MK_INTERNAL('iterator', value) as IteratorVal;
}

type MK_PARSE = ((value: string) => StringVal) | ((value: any) => RuntimeVal);

export function MK_PARSE(value: any = null, name?: any): AnyVal {
  if (typeof value == 'string') return MK_STRING(value);
  if (typeof value == 'number') return MK_NUMBER(value);
  if (typeof value == 'boolean') return MK_BOOLEAN(value);
  if (typeof value == 'function') {
    let fn = MK_FUNCTION_NATIVE(value);
    if (typeof name == 'string') fn.properties.set('nombre', MK_STRING(name));
    return fn;
  }
  if (typeof value == 'object') {
    if (value == null) return MK_NULL();
    if (
      value instanceof RuntimeClassVal ||
      value.properties instanceof Properties
    )
      return value as AnyVal;
    if (value instanceof Promise) return MK_PARSE(asyncToSync(value));
    if (Buffer.isBuffer(value)) return MK_BUFFER(value);
    if ((value as RuntimeVal).__native__) return value;
    if (Array.isArray(value)) return MK_ARRAY_NATIVE(...value.map(MK_PARSE));
    return MK_OBJECT_NATIVE(value);
  }
  return MK_NULL();
}

export function MK_PARSE_TYPE(value: AnyVal, type: AnyVal['type']) {
  if (value.type == type) return value;
  if (value.type == 'clase')
    return error(ErrorType.InvalidType, 0, 0, 'No se puede parsear una clase');
  if (type == 'clase')
    return error(
      ErrorType.InvalidArgument,
      0,
      0,
      `No se puede parsear un ${value.type} a una clase`
    );
  if (type == 'cadena') return MK_STRING(value.aCadena().value);
  if (type == 'numero') return MK_NUMBER(value.aNumero().value);
  if (type == 'booleano') return MK_BOOLEAN_RUNTIME(value);
  if (type == 'lista') return MK_ARRAY_NATIVE(value);
  if (type == 'objeto') return MK_OBJECT_NATIVE(value);
  if (type == 'funcion') return MK_FUNCTION_NATIVE(() => {});
  if (type == 'buffer') return MK_BUFFER(Buffer.from(''));
  return MK_NULL();
}
