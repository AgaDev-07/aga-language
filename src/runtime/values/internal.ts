import colors from '../../libs/colors';
import { RuntimeVal } from '../values';
import { MK_ARRAY_NATIVE, MK_OBJECT } from './complex';
import { MK_BOOLEAN, MK_NULL, MK_NUMBER, MK_STRING } from './primitive';

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

const defaultProps = {} as any

export class Properties extends Map<string, RuntimeVal> {
  constructor(entries?: [string, RuntimeVal][], private type = 'objeto') {
    super(entries);
  }
  private default = {};
  get(key: string) {
    return super.get(key) || this.default[key] || defaultProps[key] || MK_NULL();
  }
  setDefault(key: string, value: RuntimeVal) {
    this.default[key] = value;
  }
  setAll(entries: [string, RuntimeVal][]) {
    entries.forEach(([key, value]) => this.set(key, value));
  }
}

defaultProps.__pintar__ = {
  execute(){
    return Colors.magenta('[Valor en tiempo de ejecución]');
  },
  properties: new Properties(),
}
defaultProps.aCadena = {
  execute(){},
  properties: new Properties(),
  __pintar__(){
    return Colors.cyan('[Funcion aCadena]');
  }
}
defaultProps.__pintar__.__pintar__ = defaultProps.__pintar__;
defaultProps.__pintar__.aCadena = defaultProps.aCadena;

defaultProps.aCadena.aCadena = defaultProps.aCadena;
export type InternalType = 'property' | 'return';

export interface InternalVal extends RuntimeVal {
  family: 'internal';
}

export function MK_INTERNAL(value: {
  type: InternalType;
  [key: string]: any;
}): InternalVal {
  return { ...value, family: 'internal' } as RuntimeVal as InternalVal;
}

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

export function MK_PARSE(value: any): RuntimeVal {
  if (typeof value == 'string') {
    if (value.startsWith('$')) return MK_PROPERTY(value.slice(1));
    if (value.startsWith('@')) return MK_RETURN(MK_STRING(value.slice(1)));
    return MK_STRING(value);
  }
  if (typeof value == 'number') return MK_NUMBER(value);
  if (typeof value == 'boolean') return MK_BOOLEAN(value);
  if (typeof value == 'object') {
    if ((value as RuntimeVal).__NATIVO__) return value;
    if (value == null) return MK_NULL();
    if (Array.isArray(value)) return MK_ARRAY_NATIVE(...value.map(MK_PARSE));
    let entries = Object.entries(value).map(([key, value]) => [
      key,
      MK_PARSE(value),
    ]);
    return MK_OBJECT(Object.fromEntries(entries));
  }
}
