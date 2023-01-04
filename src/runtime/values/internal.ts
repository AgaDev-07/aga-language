import { colors } from '@agacraft/functions';
import { RuntimeVal } from '../values';
import { MK_ARRAY_NATIVE, MK_OBJECT } from './complex';
import { MK_BOOLEAN, MK_NULL, MK_NUMBER, MK_STRING } from './primitive';

type staticColor = 'clear' | 'bold' | 'inverse';
type color =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'grey';

type colorVariants = '' |'bg' | 'Bright' | 'BrightBg';

type colorType = staticColor | `${color}${colorVariants}`;

export const Colors = new Proxy(colors, {
  get: (target, prop: string) => {
    if (prop in target) return target[prop] as unknown as Function;
    return target.white as unknown as Function;
  },
}) as unknown as { [key in colorType]: Function };

export class Properties extends Map<string, RuntimeVal> {
  constructor(entries?: [string, RuntimeVal][], private type = 'objeto') {
    super(entries);
  }
  private default = {
    __pintar__: () => {
      if (this.type == 'objeto') {
        let keys = [...this.keys()];
        if (keys.length == 0) return {};
        let entries = keys.map(key => [key, this.get(key).__pintar__()]);
        return Object.fromEntries(entries);
      }
      if (this.type == 'funcion') return Colors.cyan('[Funcion]');
      if (this.type == 'lista') {
        let entries = [...this.values()].map(value => value.__pintar__());
        return entries;
      }
      return 'indefinido';
    },
    aCadena: () => MK_STRING(),
  };
  get(key: string) {
    return super.get(key) || this.default[key] || MK_NULL();
  }
  setAll(entries: [string, RuntimeVal][]) {
    entries.forEach(([key, value]) => this.set(key, value));
  }
}

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
    if (value == null) return MK_NULL();
    if (Array.isArray(value)) return MK_ARRAY_NATIVE(...value.map(MK_PARSE));
    let entries = Object.entries(value).map(([key, value]) => [
      key,
      MK_PARSE(value),
    ]);
    return MK_OBJECT(Object.fromEntries(entries));
  }
}
