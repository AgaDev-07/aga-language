import Environment from '../environment';
import { MK_BOOLEAN, MK_NULL, RuntimeVal } from '../values';

export default (env: Environment) =>
  [
    ['nulo', MK_NULL()],
    ['falso', MK_BOOLEAN(false)],
    ['verdadero', MK_BOOLEAN(true)],
  ] as [string, RuntimeVal][];
