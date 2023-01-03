import Environment from '../environment';
import { MK_FUNCTION, MK_NUMBER, MK_OBJECT, RuntimeVal } from '../values';

function pintar(...args: RuntimeVal[]) {
}

export default (env: Environment) =>
  [
    [
      'pintar',
      MK_FUNCTION(['value'], [], env, function () {
        console.log(...arguments);
      }),
    ],
    [
      'Mate',
      MK_OBJECT({
        PI: MK_NUMBER(3.14159),
        E: MK_NUMBER(2.71828),
        abs: MK_FUNCTION(['x'], [], env, Math.abs) as RuntimeVal,
        redondear: MK_FUNCTION(['x'], [], env, Math.round) as RuntimeVal,
      }),
    ],
  ] as [string, RuntimeVal][];