import Environment from "../environment.js";
import { RuntimeVal } from "../values.js";
import { MK_NULL, MK_BOOLEAN, MK_VOID } from "../values/primitive.js";

export default (env: Environment) => [
  ['nulo', MK_NULL()],
  ['falso', MK_BOOLEAN(false)],
  ['verdadero', MK_BOOLEAN(true)],
  ['vacio', MK_VOID()],
] as [string, RuntimeVal][];