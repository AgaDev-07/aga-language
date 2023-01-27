import Parser from '../../frontend/parser';
import Environment from '../environment';
import { AnyVal, RuntimeVal } from '../values';
import {
  MK_OBJECT,
  MK_FUNCTION_NATIVE,
  MK_ARRAY_NATIVE,
  ArrayVal,
  MK_CLASS,
  MK_FUNCTION,
} from '../values/complex';
import { MK_PARSE } from '../values/internal';
import { MK_STRING, StringVal } from '../values/primitive';

function getObjeto() {
  let constructor = MK_FUNCTION_NATIVE(
    function (value: any = {}) {
      return MK_OBJECT(value);
    },
    { nombre: MK_STRING('Objeto') },
    true
  );

  let props = {
    claves: MK_FUNCTION_NATIVE(
      function (object: RuntimeVal) {
        let obj = object.__NATIVO__();
        return MK_ARRAY_NATIVE(...Object.keys(obj).map(MK_PARSE));
      },
      { nombre: MK_STRING('Objeto.claves') },
      true
    ),
    valores: MK_FUNCTION_NATIVE(
      function (object: RuntimeVal) {
        let obj = object.__NATIVO__();
        return MK_ARRAY_NATIVE(...Object.values(obj).map(MK_PARSE));
      },
      { nombre: MK_STRING('Objeto.valores') },
      true
    ),
    pares: MK_FUNCTION_NATIVE(
      function (object: RuntimeVal) {
        let obj = object.__NATIVO__();
        let entries = Object.entries(obj);
        return MK_PARSE(entries);
      },
      { nombre: MK_STRING('Objeto.pares') },
      true
    ),
    desdePares: MK_FUNCTION_NATIVE(
      function (pares: ArrayVal<AnyVal>) {
        let entries = pares.__NATIVO__();
        let obj = Object.fromEntries(entries);
        return MK_PARSE(obj);
      },
      { nombre: MK_STRING('Objeto.desdePares') },
      true
    ),
  };

  return MK_CLASS(constructor, props);
}

function getFuncion() {
  let constructor = MK_FUNCTION_NATIVE(
    function (...args: StringVal[]) {
      const [sourceCode, ..._params] = args.reverse();
      const params = _params.reverse().map(param => param.value);

      const env = Environment.getGlobalScope();
      const parser = new Parser();
      const program = parser.produceAST(sourceCode.value, true);

      return MK_FUNCTION(params, program.body, env);
    },
    { nombre: MK_STRING('Funcion') },
    true
  );

  let props = {};

  return MK_CLASS(constructor, props);
}
export default (env: Environment) => [
  ['Objeto', getObjeto()],
  ['Funcion', getFuncion()],
];
