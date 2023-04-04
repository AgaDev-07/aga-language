import { MK_FUNCTION_NATIVE } from './complex';
import { AnyVal, RuntimeClassVal, RuntimeVal } from '../values';
import { Colors, Properties } from './internal';
import { Mate } from '../global/vars';

function getPrimitiveProps() {
  getPrimitiveProps.value.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: Primitive,
    n: number = 0
  ) {
    return Colors.magenta(this.value);
  });
  getPrimitiveProps.value.aCadena ||= MK_FUNCTION_NATIVE(function (
    this: Primitive
  ) {
    return this.value;
  });
  return getPrimitiveProps.value;
}
getPrimitiveProps.value = {} as Record<string, RuntimeVal>;

export class Primitive extends RuntimeClassVal implements RuntimeVal {
  family: 'primitive' = 'primitive';
  properties: Properties<AnyVal>;
  constructor(
    public type: PrimitiveType,
    public value: any,
    props: Record<string, RuntimeVal> = getPrimitiveProps()
  ) {
    super();
    this.properties = new Properties(this as AnyVal, undefined, props);
  }
  __pintar__(n: number = 0) {
    let pintar = this.properties.get('__pintar__');
    if (!pintar) return Colors.yellow(this.aCadena());
    return pintar.execute.call(this, n);
  }
  aCadena() {
    let aCadena = this.properties.get('aCadena');
    if (!aCadena) return this.value;
    return aCadena.execute.call(this);
  }
  __native__() {
    return this.value;
  }
}

interface NumVal {
  value: number;
  imaginary: number;
  _multiply(other: NumberRuntime): NumVal;
  __runtime__(): NumberRuntime;
}
export function MK_NUMBER_PROPS() {
  MK_NUMBER_PROPS.value.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: NumberRuntime
  ) {
    return Colors.yellow(this.aCadena());
  });
  MK_NUMBER_PROPS.value.aCadena ||= MK_FUNCTION_NATIVE(function(this:NumberRuntime){
    return this.console || getNumberString(this.value, this.imaginary)
  })
  return MK_NUMBER_PROPS.value
}
MK_NUMBER_PROPS.value = {} as Record<string, RuntimeVal>;
export class NumberRuntime extends Primitive implements NumberVal {
  type: 'numero' = 'numero';
  declare value: number;
  declare imaginary: number;
  constructor(
    value: number | null,
    public console: string = '',
    imaginary: number = 0
  ) {
    super('numero', value, MK_NUMBER_PROPS());
    this.value = value as number;
    this.imaginary = imaginary;
  }
  __runtime__() {
    return this;
  }
  _multiply(other: NumberRuntime): NumVal {
    if (this.value == null || other.value == null) return NumberRuntime.NaN;
    let n1 = this.value * other.value;
    let n2 = this.imaginary * other.imaginary;
    let i1 = this.value * other.imaginary;
    let i2 = this.imaginary * other.value;
    let self = this;
    let num = {
      value: n1 - n2,
      imaginary: i1 + i2,
      _multiply(other: NumberRuntime) {
        return self._multiply.call(num, other);
      },
      __runtime__() {
        return new NumberRuntime(num.value, '', num.imaginary);
      },
    };
    return num;
  }
  abs() {
    let x = this.value;
    let y = this.imaginary;
    let z = x * x + y * y;
    return Math.sqrt(z);
  }
  multiply(other: NumberRuntime) {
    let n = this._multiply(other);
    if (n.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(n.value, n.imaginary);
  }
  divide(other: NumberRuntime) {
    if (this.value == null || other.value == null) return NumberRuntime.NaN;
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
    if (this.value == null || other.value == null) return NumberRuntime.NaN;
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
    if (this.value == null || other.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(
      this.value + other.value,
      this.imaginary + other.imaginary
    );
  }
  subtract(other: NumberRuntime) {
    if (this.value == null || other.value == null) return NumberRuntime.NaN;
    return MK_NUMBER(
      this.value - other.value,
      this.imaginary - other.imaginary
    );
  }
  power(other: NumberRuntime) {
    if (this.value == null || other.value == null) return NumberRuntime.NaN;
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
  props: Record<string, RuntimeVal> = getPrimitiveProps()
): PrimitiveVal {
  return new Primitive(type, value, props) as PrimitiveVal;
}

export interface NullVal extends PrimitiveVal {
  type: 'nulo';
  value: null;
}

export function MK_NULL_PROPS(){
  MK_NULL_PROPS.value.__pintar__ ||= MK_FUNCTION_NATIVE(()=>Colors.whiteBright('nulo'))
  MK_NULL_PROPS.value.aCadena ||= MK_FUNCTION_NATIVE(()=>'nulo')
  return MK_NULL_PROPS.value
}
MK_NULL_PROPS.value = {} as Record<string, RuntimeVal>

export function MK_NULL(): NullVal {
  if (MK_NULL.value) return MK_NULL.value;
  MK_NULL.value = MK_PRIMITIVE(null, 'nulo', MK_NULL_PROPS()) as NullVal;
  return MK_NULL.value;
}
MK_NULL.value = null;

export interface NumberVal extends PrimitiveVal {
  type: 'numero';
  value: number;
  imaginary: number;
}

export function getNumberString(value: number, imaginary: number) {
  if (!imaginary) return value.toString();
  if (!value) {
    if (imaginary == 1) return 'i';
    if (imaginary == -1) return '-i';
    return imaginary.toString() + 'i';
  }
  if (imaginary == 1) return value.toString() + '+i';
  if (imaginary == -1) return value.toString() + '-i';
  if (imaginary > 0) return value.toString() + '+' + imaginary.toString() + 'i';
  return value.toString() + imaginary.toString() + 'i';
}

export function MK_NUMBER(
  value: number | null = 0,
  imaginary = 0
): NumberRuntime {
  NumberRuntime.NaN ||= new NumberRuntime(null, 'NeN');
  NumberRuntime.Infinity ||= new NumberRuntime(Infinity, 'Infinito');
  NumberRuntime.NegativeInfinity ||= new NumberRuntime(-Infinity, '-Infinito');
  NumberRuntime.Zero ||= new NumberRuntime(0);
  NumberRuntime.One ||= new NumberRuntime(1);
  NumberRuntime.NegativeOne ||= new NumberRuntime(-1);

  if (value == 0 && imaginary == 0) return NumberRuntime.Zero;
  if (value == 1 && imaginary == 0) return NumberRuntime.One;
  if (value == -1 && imaginary == 0) return NumberRuntime.NegativeOne;

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

export function MK_BOOLEAN_PROPS(): Record<string, RuntimeVal> {
  MK_BOOLEAN_PROPS.value.__pintar__ ||= MK_FUNCTION_NATIVE(function (
    this: BooleanVal
  ) {
    return Colors.yellow(this.aCadena());
  });
  MK_BOOLEAN_PROPS.value.aCadena ||= MK_FUNCTION_NATIVE(function (
    this: BooleanVal
  ){
    return this.value ? 'verdadero' : 'falso'
  })
  return MK_BOOLEAN_PROPS.value;
}
MK_BOOLEAN_PROPS.value = {} as Record<string, RuntimeVal>;

export function MK_BOOLEAN(value = false): BooleanVal {
  let bool = value ? 'TRUE' : 'FALSE';
  if (!MK_BOOLEAN.bool[bool])
    MK_BOOLEAN.bool[bool] = MK_PRIMITIVE(value, 'booleano', MK_BOOLEAN_PROPS()) as BooleanVal;
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

export function MK_STRING_PROPS(){
  MK_STRING_PROPS.value.__pintar__ ||= MK_FUNCTION_NATIVE(function (this: StringVal, n: number) {
    if (!n) return this.value;
    let quote = this.value.includes("'") ? '"' : "'";
    return Colors.green(
      quote + this.value.replace(quote, `\\${quote}`) + quote
    );
  })
  MK_STRING_PROPS.value.aCadena ||= MK_FUNCTION_NATIVE(function(this:StringVal){return this})
  return MK_STRING_PROPS.value
}
MK_STRING_PROPS.value = {} as Record<string, RuntimeVal>

export function MK_STRING(value = ''): StringVal {
  return MK_PRIMITIVE(value + '', 'cadena', MK_STRING_PROPS()) as StringVal;
}

export interface BufferVal extends PrimitiveVal {
  type: 'buffer';
  value: Buffer;
}

export function MK_BUFFER_PROPS(){
  MK_BUFFER_PROPS.value.__pintar__ ||= MK_FUNCTION_NATIVE(() => Colors.yellow('buffer'))
  MK_VOID_PROPS.value.aCadena ||= MK_FUNCTION_NATIVE(function(this:BufferVal){return this.__native__()+''})
  return MK_BUFFER_PROPS.value
}
MK_BUFFER_PROPS.value = {} as Record<string, RuntimeVal>

export function MK_BUFFER(value = Buffer.alloc(0)): BufferVal {
  return MK_PRIMITIVE(value, 'buffer', MK_BUFFER_PROPS()) as BufferVal;
}

export interface VoidVal extends PrimitiveVal {
  type: 'vacio';
  value: null;
}

export function MK_VOID_PROPS(){
  MK_VOID_PROPS.value.__pintar__ ||= MK_FUNCTION_NATIVE(() => Colors.gray('vacio'))
  MK_VOID_PROPS.value.aCadena ||= MK_FUNCTION_NATIVE(()=>'void')
  return MK_VOID_PROPS.value
}
MK_VOID_PROPS.value = {} as Record<string, RuntimeVal>

export function MK_VOID(): VoidVal {
  return MK_PRIMITIVE(null, 'vacio', MK_VOID_PROPS()) as VoidVal;
}

//#endregion
