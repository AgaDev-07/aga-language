import { RuntimeVal } from '../values';
import { MK_FUNCTION_NATIVE } from './complex';
import { Colors, Properties } from './internal';

class Primitive implements RuntimeVal {
  family: 'primitive' = 'primitive';
  properties = new Properties([
    [
      '__pintar__',
      MK_FUNCTION_NATIVE(function () {
        return this.value;
      }),
    ],
    [
      'aCadena',
      MK_FUNCTION_NATIVE(function () {
        return MK_STRING(this.value);
      }),
    ],
  ]);
  constructor(
    public type: PrimitiveType,
    public value: any,
    props: [string, RuntimeVal][]
  ) {
    this.properties.setAll(props);
  }
  __pintar__(n: number) {
    let pintar = this.properties.get('__pintar__');
    return pintar.execute.call(this, n);
  }
  __NATIVO__() {
    return this.value;
  }
}

//#region PrimitiveTypes
export type PrimitiveType = 'nulo' | 'numero' | 'booleano' | 'vacio' | 'cadena' | 'buffer';

export type PrimitiveVal = Primitive;

function MK_PRIMITIVE(
  value: any,
  type: PrimitiveType,
  props: [string, RuntimeVal][] = []
): PrimitiveVal {
  return new Primitive(type, value, props) as PrimitiveVal;
}

export interface NullVal extends PrimitiveVal {
  type: 'nulo';
  value: null;
}

export function MK_NULL(): NullVal {
  return MK_PRIMITIVE(null, 'nulo', [
    ['__pintar__', MK_FUNCTION_NATIVE(() => Colors.whiteBright('nulo'))],
  ]) as NullVal;
}

export interface NumberVal extends PrimitiveVal {
  type: 'numero';
  value: number;
}

export function MK_NUMBER(value = 0): NumberVal {
  if (value != value) return MK_NAN();
  if (typeof value != 'number') return MK_NUMBER(Number(value));
  return MK_PRIMITIVE(value, 'numero', [
    ['__pintar__', MK_FUNCTION_NATIVE(() => Colors.yellow(value+''))],
  ]) as NumberVal;
}
export function MK_NAN(): NumberVal {
  return MK_PRIMITIVE(null, 'numero', [
    ['__pintar__', MK_FUNCTION_NATIVE(() => Colors.yellow('NeN'))],
  ]) as NumberVal;
}

export interface BooleanVal extends PrimitiveVal {
  type: 'booleano';
  value: boolean;
}

export function MK_BOOLEAN(value = false): BooleanVal {
  return MK_PRIMITIVE(value, 'booleano', [
    [
      '__pintar__',
      MK_FUNCTION_NATIVE(() => Colors.yellow(value ? 'verdadero' : 'falso')),
    ],
  ]) as BooleanVal;
}

export interface StringVal extends PrimitiveVal {
  type: 'cadena';
  value: string;
}

export function MK_STRING(value = ''): StringVal {
  return MK_PRIMITIVE(value + '', 'cadena', [
    [
      '__pintar__',
      MK_FUNCTION_NATIVE(function (this: StringVal, n: number) {
        if (!n) return this.value;
        let quote = this.value.includes("'") ? '"' : "'";
        return Colors.green(quote + this.value.replace(quote, `\\${quote}`) + quote);
      }),
    ],
  ]) as StringVal;
}

export interface BufferVal extends PrimitiveVal {
  type: 'buffer';
  value: Buffer;
}

export function MK_BUFFER(value = Buffer.alloc(0)): BufferVal {
  return MK_PRIMITIVE(value, 'buffer', [
    ['__pintar__', MK_FUNCTION_NATIVE(() => Colors.yellow('buffer'))],
  ]) as BufferVal;
}

export interface VoidVal extends PrimitiveVal {
  type: 'vacio';
  value: null;
}

export function MK_VOID(): VoidVal {
  return MK_PRIMITIVE(null, 'vacio', [
    ['__pintar__', MK_FUNCTION_NATIVE(() => Colors.gray('vacio'))],
  ]) as VoidVal;
}

//#endregion
