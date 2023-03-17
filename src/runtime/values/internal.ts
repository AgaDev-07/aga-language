import colors from '../../libs/colors.js';
import { AnyVal, RuntimeClassVal, RuntimeVal, ValueType } from '../values.js';
import {
  ArrayVal,
  FunctionVal,
  MK_ARRAY_NATIVE,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  MK_OBJECT_NATIVE,
  ModuleVal,
  ObjectVal,
} from './complex.js';
import {
  MK_BOOLEAN,
  MK_BUFFER,
  MK_NULL,
  MK_NUMBER,
  MK_STRING,
  NullVal,
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

const defaultProps: { [key: string]: RuntimeVal } = {};

type propsDefault<T extends AnyVal> = {
  funcion: {
    nombre: StringVal;
    constructor: FunctionVal;
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
} & {
  [key in ValueType]: {
    __pintar__: FunctionVal;
    aTexto: FunctionVal & { execute(): StringVal };
  };
} & {
  [key in ValueType]: {
    [key: string]: T;
  };
};

export class Properties<
  T extends ValueType,
  C extends AnyVal = AnyVal
> extends Map<string, RuntimeVal> {
  constructor(entries?: [string, RuntimeVal][], private type = 'objeto') {
    super(entries);
  }
  private default: { [key: string]: RuntimeVal } = {};
  get<V extends keyof propsDefault<C>[T], R extends propsDefault<C>[T][V]>(
    key: V
  ): R {
    const k = key as string;
    const value =
      super.get(k) || this.default[k] || defaultProps[k] || MK_NULL();

    return value as R;
  }
  setDefault(key: string, value: RuntimeVal) {
    this.default[key] = value;
    return this;
  }
  setAllDefault(entries: [string, RuntimeVal][]) {
    entries.forEach(([key, value]) => this.setDefault(key, value));
    return this;
  }
  setAll(entries: [string, RuntimeVal][]) {
    entries.forEach(([key, value]) => this.set(key, value));
    return this;
  }
}

defaultProps.__pintar__ = {
  execute() {
    return Colors.magenta('[Valor en tiempo de ejecución]');
  },
  properties: new Properties(),
} as unknown as FunctionVal;
defaultProps.aCadena = {
  execute() {},
  properties: new Properties(),
  __pintar__() {
    return Colors.cyan('[Funcion aCadena]');
  },
} as unknown as FunctionVal;
defaultProps.__pintar__.properties.set('__pintar__', defaultProps.__pintar__);
defaultProps.__pintar__.properties.set('aCadena', defaultProps.aCadena);

defaultProps.aCadena.properties.set('__pintar__', defaultProps.__pintar__);

export type InternalType = 'property' | 'return' | 'iterator' | 'break' | 'continue';

export interface InternalVal extends RuntimeVal {
  family: 'internal';
}

export function MK_INTERNAL(value: {
  type: InternalType;
  [key: string]: any;
}): InternalVal {
  return { ...value, family: 'internal' } as RuntimeVal as InternalVal;
}
MK_INTERNAL.BREAK = null as BreakVal;
MK_INTERNAL.CONTINUE = null as ContinueVal;

export interface ObjectPropVal extends InternalVal {
  type: 'property';
  symbol: string;
}

export function MK_PROPERTY(value: string): ObjectPropVal {
  return MK_INTERNAL({ type: 'property', value }) as ObjectPropVal;
}

export interface ReturnVal extends InternalVal {
  type: 'return';
  value: RuntimeVal;
}

export function MK_RETURN(value: RuntimeVal): ReturnVal {
  return MK_INTERNAL({ type: 'return', value }) as ReturnVal;
}

export interface BreakVal extends InternalVal {
  type: 'break';
}

export function MK_BREAK() {
  if(MK_INTERNAL.BREAK) return MK_INTERNAL.BREAK;
  else {
    MK_INTERNAL.BREAK = MK_INTERNAL({ type: 'break' }) as BreakVal;
    return MK_INTERNAL.BREAK;
  }
}

export interface ContinueVal extends InternalVal {
  type: 'continue';
}

export function MK_CONTINUE() {
  if(MK_INTERNAL.CONTINUE) return MK_INTERNAL.CONTINUE;
  else {
    MK_INTERNAL.CONTINUE = MK_INTERNAL({ type: 'continue' }) as ContinueVal;
    return MK_INTERNAL.CONTINUE;
  }
}

export interface IteratorVal extends InternalVal {
  type: 'iterator';
  value: RuntimeVal;
}

export function MK_ITERATOR(value:any): ReturnVal {
  return MK_INTERNAL({ type: 'iterator', value }) as ReturnVal;
}

type MK_PARSE = ((value: string) => StringVal)| ((value: any) => RuntimeVal);

export function MK_PARSE(value:any=null): AnyVal {
  if (typeof value == 'string') return MK_STRING(value);
  if (typeof value == 'number') return MK_NUMBER(value);
  if (typeof value == 'boolean') return MK_BOOLEAN(value);
  if(typeof value == 'function') return MK_FUNCTION_NATIVE(value)
  if (typeof value == 'object') {
    if (value instanceof RuntimeClassVal) return value as AnyVal;
    if (Buffer.isBuffer(value)) return MK_BUFFER(value)
    if ((value as RuntimeVal).__NATIVO__) return value;
    if (value == null) return MK_NULL();
    if (Array.isArray(value)) return MK_ARRAY_NATIVE(...value.map(MK_PARSE));
    return MK_OBJECT_NATIVE(value);
  }
  return MK_NULL();
}
