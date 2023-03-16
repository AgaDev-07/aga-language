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
  PI: null as unknown as NumberVal,
  E: null as unknown as NumberVal,
  I: null as unknown as NumberVal,
  abs(xn: NumberRuntime) {
    if (!(xn instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${xn}"`
      );

    return xn.abs();
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
    let n = Math.round(x.value * z) / z;
    let ni = Math.round(x.imaginary * z) / z;
    return MK_NUMBER(n, ni);
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
      let n = 1 / y.value;
      return Mate.raiz(x, n);
    }
    return x.power(y);
  },
  raiz(x: NumberRuntime, yn: number | NumberRuntime = 2) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    let y = yn as NumberRuntime;
    if (typeof yn === 'number') y = MK_NUMBER(yn) as NumberRuntime;

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
    if (x.imaginary !== 0)
      error(
        ErrorType.MathError,
        0,
        0,
        'Raiz de numeros complejos no soportados'
      );

    if (y.value === 0) return NumberRuntime.One;
    if (y.value === 1) return x;

    let isPar = y.value % 2 === 0;
    let isNeg = x.value < 0;

    let n = 1 / y.value;

    if (isPar && isNeg) {
      let i = Math.pow(-x.value, n);
      return MK_NUMBER(0, i);
    } else return Math.pow(x.value, n);
  },
  log(x:NumberRuntime){
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    if (x.imaginary !== 0)
      error(
        ErrorType.MathError,
        0,
        0,
        'Logaritmo de numeros complejos no soportados'
      );
    return Math.log(x.value)
  },
  aleatorio() {
    return Math.random();
  },
  seno(x: NumberRuntime) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    return MK_NUMBER(Math.sin(x.value), Math.sin(x.imaginary));
  },
  coseno(x: NumberRuntime) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    if(x.imaginary === 0)
      return Math.cos(x.value);
    return MK_NUMBER(Math.cos(x.value), Math.cos(x.imaginary));
  },
  tangente(x: NumberRuntime) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    return MK_NUMBER(Math.tan(x.value), Math.tan(x.imaginary));
  },
  /*
  base10(x: NumberRuntime) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );

    let [n0, n1] = `${x.value}`.split('.');
    let [i0, i1] = `${x.imaginary}`.split('.');

    let m = Math.min(n0.length, i0.length);
    let y = Math.pow(10, m);

    return [MK_NUMBER(x.value / y, x.imaginary / y), y, m];
  }
  */
  entero(x: NumberRuntime) {
    if (!(x instanceof NumberRuntime))
      error(
        ErrorType.InvalidType,
        0,
        0,
        `Se esperaba un número en el primer argumento, pero se recibió "${x}"`
      );
    return MK_NUMBER(Math.floor(x.value), Math.floor(x.imaginary));
  },
};

export default (env: Environment) => {
  const Classes = clases(env);
  Mate.I ||= MK_NUMBER(0, 1);
  Mate.PI ||= MK_NUMBER(3.14159);
  Mate.E ||= MK_NUMBER(2.71828);
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
