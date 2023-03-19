import Parser from '../../frontend/parser.js';
import Environment from '../environment.js';
import { AnyVal, RuntimeVal } from '../values.js';
import {
  MK_OBJECT,
  MK_FUNCTION_NATIVE,
  MK_ARRAY_NATIVE,
  ArrayVal,
  MK_CLASS,
  MK_FUNCTION,
} from '../values/complex.js';
import { MK_PARSE } from '../values/internal.js';
import { MK_BOOLEAN, MK_NUMBER, MK_STRING, StringVal } from '../values/primitive.js';

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
function getLista() {
  let constructor = MK_FUNCTION_NATIVE(
    function (...args: AnyVal[]) {
      return MK_ARRAY_NATIVE(...args);
    },
    { nombre: MK_STRING('Lista') },
    true
  );

  let props = {
    desde: MK_FUNCTION_NATIVE(
      function (...args: AnyVal[]) {
        return MK_ARRAY_NATIVE(...args);
      },
      { nombre: MK_STRING('Lista.desde') },
      true
    ),
    esLista: MK_FUNCTION_NATIVE(
      function (value: AnyVal) {
        return value.type === 'lista'
      },
      { nombre: MK_STRING('Lista.esLista') },
      true
    ),
  };

  return MK_CLASS(constructor, props);
}
function getBooleano(){
  let constructor = MK_FUNCTION_NATIVE(
    function (value: boolean) {
      return MK_BOOLEAN(value)
    },
    { nombre: MK_STRING('Buleano') },
    true
  );

  let props = {};

  return MK_CLASS(constructor, props);
}
function getNumero(){
  let constructor = MK_FUNCTION_NATIVE(
    function (value: number) {
      return MK_NUMBER(value)
    },
    { nombre: MK_STRING('Numero') },
    true
  );

  let props = {
    esNeN: MK_FUNCTION_NATIVE(
      function (value: AnyVal) {
        if(value.type !== 'numero') return false;
        return value.value === null
      },
      { nombre: MK_STRING('Numero.esNeN') },
      true
    ),
    esFinito: MK_FUNCTION_NATIVE(
      function (value: AnyVal) {
        if(value.type !== 'numero') return false;
        return Number.isFinite(value.value)
      },
      { nombre: MK_STRING('Numero.esFinito') },
      true
    ),
    esEntero: MK_FUNCTION_NATIVE(
      function (value: AnyVal) {
        if(value.type !== 'numero') return false;
        return Number.isInteger(value.value)
      },
      { nombre: MK_STRING('Numero.esEntero') },
      true
    ),
    parsearEntero: MK_FUNCTION_NATIVE(
      function (value: StringVal) {
        return parseInt(value.value)
      },
      { nombre: MK_STRING('Numero.parsearEntero') },
      true
    ),
    parsearFlotante: MK_FUNCTION_NATIVE(
      function (value: StringVal) {
        return parseFloat(value.value)
      },
      { nombre: MK_STRING('Numero.parsearFlotante') },
      true
    ),
  };

  return MK_CLASS(constructor, props);
}

export default (env: Environment) => [
  ['Objeto', getObjeto()],
  ['Funcion', getFuncion()],
  ['Lista', getLista()],
  ['Booleano', getBooleano()],
  ['Numero', getNumero()],
];
