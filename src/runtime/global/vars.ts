import Environment from '../environment';
import { RuntimeVal } from '../values';
import {
  MK_FUNCTION,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
} from '../values/complex';
import { MK_NUMBER } from '../values/primitive';
import clases from './clases';

function pintar() {
  const args = [...arguments] as RuntimeVal[];
  console.log(args)
  const values = args.map(arg => arg.__pintar__());
  process.stdout.write(values.join(' '));
}

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
    ...clases(env),
  ] as [string, RuntimeVal][];
