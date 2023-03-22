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
  MK_CLASS_NATIVE,
  MK_OBJECT_NATIVE,
} from '../values/complex.js';
import { MK_PARSE, MK_PARSE_TYPE } from '../values/internal.js';
import { MK_BOOLEAN, MK_BOOLEAN_RUNTIME, MK_NUMBER, MK_STRING, StringVal } from '../values/primitive.js';

export function getObjeto() {
  if(getObjeto.value) return getObjeto.value;
  let props = {
    nombre: MK_STRING('Objeto'),
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
    )
  };

  getObjeto.value = MK_CLASS_NATIVE(function(obj:RuntimeVal){
    return MK_OBJECT_NATIVE({...obj.__NATIVO__()})
  }, props);
  return getObjeto.value;
}
getObjeto.value = null;
export function getFuncion() {
  if(getFuncion.value) return getFuncion.value;
  let props = {
    nombre: MK_STRING('Funcion'),
  };

  getFuncion.value = MK_CLASS_NATIVE(function(...args: StringVal[]) {
    const [sourceCode, ..._params] = args.reverse();
    const params = _params.reverse().map(param => param.value);

    const env = Environment.getGlobalScope();
    const parser = new Parser();
    const program = parser.produceAST(sourceCode.value, true);

    return MK_FUNCTION(params, program.body, env);
  }, props);
  return getFuncion.value;
}
getFuncion.value = null;
export function getLista() {
  if(getLista.value) return getLista.value;
  let props = {
    nombre: MK_STRING('Lista'),
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

  getLista.value = MK_CLASS_NATIVE(()=>MK_ARRAY_NATIVE(...arguments), props);
  return getLista.value;
}
getLista.value = null;
export function getBooleano(){
  if(getBooleano.value) return getBooleano.value;
  let props = {};

  getBooleano.value = MK_CLASS_NATIVE(MK_BOOLEAN_RUNTIME, props);
  return getBooleano.value;
}
getBooleano.value = null;
export function getNumero(){
  if(getNumero.value) return getNumero.value;
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

  getNumero.value = MK_CLASS_NATIVE((v:AnyVal)=>MK_PARSE_TYPE(v, 'numero'), props);
  return getNumero.value;
}
getNumero.value = null;

export default (env: Environment) => [
  ['Objeto', getObjeto()],
  ['Funcion', getFuncion()],
  ['Lista', getLista()],
  ['Booleano', getBooleano()],
  ['Numero', getNumero()],
];
