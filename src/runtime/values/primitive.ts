import { MK_FUNCTION_NATIVE } from './complex';
import { AnyVal, RuntimeClassVal, RuntimeVal } from '../values';
import { Colors, Properties } from './internal';
import { Mate } from '../global/vars';

class Primitive extends RuntimeClassVal implements RuntimeVal {
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
    super();
    this.properties.setAll(props);
  }
  __pintar__(n: number=0) {
    let pintar = this.properties.get('__pintar__');
    return pintar.execute.call(this, n);
  }
  __NATIVO__() {
    return this.value;
  }
}

export class NumberRuntime extends Primitive implements NumberVal {
  type: 'numero' = 'numero';
  declare value: number;
  declare imaginary: number;
  constructor(value: number | null, _console: string = '', imaginary: number = 0) {
    const number = _console || getNumberString(value as number, imaginary);
    super('numero', value, [
      ['__pintar__', MK_FUNCTION_NATIVE(() => Colors.yellow(number))],
      ['aCadena', MK_FUNCTION_NATIVE(() => MK_STRING(number))],
    ]);
    this.value = value as number;
    this.imaginary = imaginary;
  }
  _multiply(other: NumberRuntime) {
    if(this.value == null || other.value == null) return NumberRuntime.NaN;
    let n1 = this.value * other.value;
    let n2 = this.imaginary * other.imaginary;
    let i1 = this.value * other.imaginary;
    let i2 = this.imaginary * other.value;
    let self = this
    let num = {value:n1 - n2, imaginary:i1 + i2, _multiply(other:NumberRuntime){
      return self._multiply.call(num, other)
    }};
    return num;
  }
  multiply(other: NumberRuntime) {
    let n = this._multiply(other);
    if(n.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(n.value, n.imaginary);
  }
  divide(other: NumberRuntime) {
    if(this.value == null || other.value == null) return NumberRuntime.NaN;
    let nv = {
      value: other.value,
      imaginary: -other.imaginary,
    } as NumberRuntime;
    let n1 = this._multiply(nv);
    let n2 = other._multiply(nv);

    let n = n1.value / n2.value;
    let i = n1.imaginary / n2.value;
    return MK_NUMBER(n, i);
  }
  modulo(other: NumberRuntime) {
    if(this.value == null || other.value == null) return NumberRuntime.NaN;
    let nv = {
      value: other.value,
      imaginary: -other.imaginary,
    } as NumberRuntime;
    let n1 = this._multiply(nv);
    let n2 = other._multiply(nv);

    let n = n1.value % n2.value;
    let i = n1.imaginary % n2.value;

    return MK_NUMBER(n, i);
  }
  add(other: NumberRuntime) {
    if(this.value == null || other.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(
      this.value + other.value,
      this.imaginary + other.imaginary
    );
  }
  subtract(other: NumberRuntime) {
    if(this.value == null || other.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(
      this.value - other.value,
      this.imaginary - other.imaginary
    );
  }
  power(other: NumberRuntime) {
    if(this.value == null || other.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(Mate.elevado(this, other));
  }
  static NaN: NumberRuntime;
  static Infinity: NumberRuntime;
  static NegativeInfinity: NumberRuntime;
  static Zero: NumberRuntime;
  static One: NumberRuntime;
  static NegativeOne: NumberRuntime;
}

//#region PrimitiveTypes
export type PrimitiveType =
  | 'nulo'
  | 'numero'
  | 'booleano'
  | 'vacio'
  | 'cadena'
  | 'buffer';

export type PrimitiveVal = Primitive;

function MK_PRIMITIVE(
  value: any,
  type: PrimitiveType,
  props: [string, AnyVal][] = []
): PrimitiveVal {
  return new Primitive(type, value, [
    ['aCadena', MK_FUNCTION_NATIVE(() => MK_STRING(value))],
    ...props,
  ]) as PrimitiveVal;
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
  imaginary: number;
}

export function getNumberString(value: number, imaginary: number) {
  if (!imaginary) return value.toString();
  if (!value){
    if(imaginary == 1) return 'i';
    return imaginary.toString() + 'i';
  }
  return `${value}${imaginary > 0 ? '+' : ''}${imaginary == 1 ? '' : imaginary}i`;
}

export function MK_NUMBER(value:number | null = 0, imaginary = 0): NumberVal {
  NumberRuntime.NaN ||= new NumberRuntime(null, 'NeN');
  NumberRuntime.Infinity ||= new NumberRuntime(Infinity, 'Infinito');
  NumberRuntime.NegativeInfinity ||= new NumberRuntime(-Infinity, '-Infinito');
  NumberRuntime.Zero ||= new NumberRuntime(0);
  NumberRuntime.One ||= new NumberRuntime(1);
  NumberRuntime.NegativeOne ||= new NumberRuntime(-1);

  if(value == 0 && imaginary == 0) return NumberRuntime.Zero;
  if(value == 1 && imaginary == 0) return NumberRuntime.One;
  if(value == -1 && imaginary == 0) return NumberRuntime.NegativeOne;

  if (value !== value || value === null) return NumberRuntime.NaN;
  if (typeof value != 'number') return MK_NUMBER(Number(value));
  if (value == Infinity) return NumberRuntime.Infinity;
  if (value == -Infinity) return NumberRuntime.NegativeInfinity;
  return new NumberRuntime(value, '', imaginary);
}

export interface BooleanVal extends PrimitiveVal {
  type: 'booleano';
  value: boolean;
}

export function MK_BOOLEAN(value = false): BooleanVal {
  let bool = value ? 'TRUE' : 'FALSE';
  if (!MK_BOOLEAN.bool[bool])
    MK_BOOLEAN.bool[bool] = MK_PRIMITIVE(value, 'booleano', [
      [
        '__pintar__',
        MK_FUNCTION_NATIVE(() => Colors.yellow(value ? 'verdadero' : 'falso')),
      ],
    ]) as BooleanVal;
  return MK_BOOLEAN.bool[bool];
}

MK_BOOLEAN.bool = {} as { FALSE: BooleanVal; TRUE: BooleanVal };

export function MK_BOOLEAN_RUNTIME(value: RuntimeVal): BooleanVal {
  if (value.type == 'numero' && value.value == 'NeN') return MK_BOOLEAN(false);
  if (value.family == 'primitive') return MK_BOOLEAN(value.value);
  if (value.family == 'complex') return MK_BOOLEAN(value.properties.size > 0);
  return MK_BOOLEAN(false);
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
        return Colors.green(
          quote + this.value.replace(quote, `\\${quote}`) + quote
        );
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
