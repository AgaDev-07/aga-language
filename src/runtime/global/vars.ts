import { error, ErrorType } from '../../frontend/error.js';
import Environment from '../environment.js';
import { AnyVal, RuntimeVal } from '../values.js';
import {
  ArrayVal,
  FunctionVal,
  MK_FUNCTION,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  ObjectVal,
} from '../values/complex.js';
import { MK_PARSE } from '../values/internal.js';
import {
  MK_NUMBER,
  MK_STRING,
  NumberRuntime,
  NumberVal,
  StringVal,
} from '../values/primitive.js';
import clases from './clases.js';

function pintar() {
  const args = [...arguments] as RuntimeVal[];
  const values = args.map(arg => arg.__pintar__());
  process.stdout.write(values.join(' ') + '\n');
}
export const Mate = {
  PI: 3.14159,
  E: 2.71828,
  I:null as unknown as NumberVal,
  abs() {
    const x = arguments[0];
    console.log(...arguments);
    if (typeof x !== 'number')
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el argumento, pero se recibió "${x}"`
      );
    if (x < 0) return -x;
    return x;
  },
  redondear(x: NumberRuntime, y: NumberRuntime = NumberRuntime.Zero) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    let z = Math.pow(10, y.value);
    return Math.round(x.value * z) / z;
  },
  elevado(x: NumberRuntime, y: NumberRuntime) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    if (!(y instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el segundo argumento, pero se recibió "${y}"`
      );

    if (y.imaginary !== 0)
      error(
        ErrorType.MathError,
        0,
        0,
        'Numeros complejos no soportados como potencia'
      );

    if (y.value === 0) return NumberRuntime.One;
    if (y.value === 1) return this;
    if (this.imaginary !== 0) {
      let v = null as unknown as NumberRuntime;
      for (let n = 1; n < y.value; n++) {
        v = (v ? v._multiply(this) : this._multiply(this)) as NumberRuntime;
      }
      return v;
    }
    if (y.value < 0) {
      let n = 1/y.value;
      return Mate.raiz(x, n)
    }
    return x.power(y);
  },
  raiz(x: NumberRuntime, yn: number | NumberRuntime = 2) {
    if(!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    let y = yn as NumberRuntime;
    if(typeof yn === 'number') y = MK_NUMBER(yn) as NumberRuntime;

    if (!(y instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el segundo argumento, pero se recibió "${y}"`
      );

    if (y.imaginary !== 0)
      error(
        ErrorType.MathError,
        0,
        0,
        'Numeros complejos no soportados como raiz'
      );
    if(x.imaginary !== 0) error(ErrorType.MathError, 0, 0, 'Raiz de numeros complejos no soportados');

    if (y.value === 0) return NumberRuntime.One;
    if (y.value === 1) return x;

    let isPar = y.value % 2 === 0;
    let isNeg = x.value < 0;

    let n = 1 / y.value;

    if (isPar && isNeg) {
      let i = Math.pow(-x.value, n);
      return MK_NUMBER(0, i);
    }else return Math.pow(x.value, n);
  }
};

export default (env: Environment) => {
  const Classes = clases(env);
  Mate.I ||= MK_NUMBER(0, 1);
  return [
    ['pintar', MK_FUNCTION_NATIVE(pintar, undefined, true)],
    ['Mate', MK_PARSE(Mate)],
    [
      'JSON',
      MK_OBJECT({
        texto: MK_FUNCTION_NATIVE(
          function (
            this: FunctionVal,
            value: ArrayVal<AnyVal> | ObjectVal,
            spaces = 0
          ) {
            let agalo = '';
            let v = value.__NATIVO__();

            agalo += JSON.stringify(v, null, spaces);
            return MK_STRING(agalo);
          },
          { nombre: MK_STRING('JSON.texto') }
        ),
        parsear: MK_FUNCTION_NATIVE(
          (value: StringVal) => {
            let json = JSON.parse(value.value);
            return MK_PARSE(json);
          },
          { nombre: MK_STRING('JSON.parsear') }
        ),
      }),
    ],
    ...Classes,
  ] as [string, RuntimeVal][];
};
