import Environment from '../environment';
import { RuntimeVal } from '../values';
import { MK_BOOLEAN, MK_NULL, MK_VOID } from '../values/primitive';

export default (env: Environment) =>
  [
    ['nulo', MK_NULL()],
    ['falso', MK_BOOLEAN(false)],
    ['verdadero', MK_BOOLEAN(true)],
    ['vacio', MK_VOID()]
  ] as [string, RuntimeVal][];
