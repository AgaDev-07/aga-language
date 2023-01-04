import Environment from '../environment';
import { RuntimeVal } from '../values';
import {
  ArrayVal,
  MK_ARRAY_NATIVE,
  MK_FUNCTION,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
} from '../values/complex';
import { MK_PARSE } from '../values/internal';
import { MK_NUMBER } from '../values/primitive';

function pintar() {
  const args = [...arguments] as RuntimeVal[];
  const values = args.map(arg => arg.__pintar__());
  
  console.log(...values);
}

function Objeto(value: any = {}) {
  return MK_OBJECT(value);
}
Objeto.claves = MK_FUNCTION_NATIVE(function (object: RuntimeVal) {
  let obj = object.__pintar__();
  return MK_ARRAY_NATIVE(...Object.keys(obj).map(MK_PARSE));
});
Objeto.claves.name = 'Objeto.claves';

Objeto.valores = MK_FUNCTION_NATIVE(function (object: RuntimeVal) {
  let obj = object.__pintar__();
  return MK_ARRAY_NATIVE(...Object.values(obj).map(MK_PARSE));
});
Objeto.pares = MK_FUNCTION_NATIVE(function (object: RuntimeVal) {
  let obj = object.__pintar__();
  let entries = Object.entries(obj);
  return MK_PARSE(entries);
});
Objeto.desdePares = MK_FUNCTION_NATIVE(function (pares: ArrayVal) {
  let entries = pares.__pintar__();
  let obj = Object.fromEntries(entries);
  return MK_PARSE(obj);
})

export default (env: Environment) =>
  [
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
      'Objeto',
      MK_FUNCTION_NATIVE(
        Objeto,
        {
          claves: Objeto.claves,
          valores: Objeto.valores,
          pares: Objeto.pares,
          desdePares: Objeto.desdePares,
        },
        true
      ),
    ],
  ] as [string, RuntimeVal][];
