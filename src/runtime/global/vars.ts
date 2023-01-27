import Environment from '../environment';
import { AnyVal, RuntimeVal } from '../values';
import {
  ArrayVal,
  FunctionVal,
  MK_FUNCTION,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  ObjectVal,
} from '../values/complex';
import { MK_PARSE } from '../values/internal';
import { MK_NUMBER, MK_STRING, StringVal } from '../values/primitive';
import clases from './clases';

function pintar() {
  const args = [...arguments] as RuntimeVal[];
  const values = args.map(arg => arg.__pintar__());
  process.stdout.write(values.join(' '));
}

export default (env: Environment) => {
  const Classes = clases(env);
  return [
    ['pintar', MK_FUNCTION_NATIVE(pintar, undefined, true)],
    [
      'Mate',
      MK_OBJECT({
        PI: MK_NUMBER(3.14159),
        E: MK_NUMBER(2.71828),
        abs: MK_FUNCTION(['x'], [], env, undefined, Math.abs) as RuntimeVal,
        redondear: MK_FUNCTION(
          ['x'],
          [],
          env,
          undefined,
          Math.round
        ) as RuntimeVal,
      }),
    ],
    [
      'JSON',
      MK_OBJECT({
        texto: MK_FUNCTION_NATIVE(function (this: FunctionVal, value: ArrayVal<AnyVal> | ObjectVal, spaces = 0) {
            let agalo = '';
            let v = value.__NATIVO__();

            agalo+=JSON.stringify(v, null, spaces);
            return MK_STRING(agalo);
          },
          { nombre: MK_STRING('AGALO.texto') }
        ),
        parsear: MK_FUNCTION_NATIVE(
          (value: StringVal) => {
            let json = JSON.parse(value.value);
            return MK_PARSE(json);
          },
          { nombre: MK_STRING('AGALO.texto') }
        ),
      }),
    ],
    ...Classes,
  ] as [string, RuntimeVal][];
};
