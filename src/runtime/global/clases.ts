import Parser from '../../frontend/parser.js';
import Environment from '../environment.js';
import { AnyVal, RuntimeVal } from '../values.js';
import {
  MK_FUNCTION_NATIVE,
  MK_ARRAY_NATIVE,
  ArrayVal,
  MK_FUNCTION,
  MK_CLASS_NATIVE,
  MK_OBJECT_NATIVE,
  MK_OBJECT,
  MK_OBJECT_PROPS,
  MK_FUNCTION_PROPS,
  MK_ARRAY_PROPS,
} from '../values/complex.js';
import { MK_PARSE, MK_PARSE_TYPE } from '../values/internal.js';
import { MK_BOOLEAN_PROPS, MK_BOOLEAN_RUNTIME, MK_BUFFER_PROPS, MK_NUMBER_PROPS, MK_STRING, MK_STRING_PROPS, StringVal } from '../values/primitive.js';

export function getObjeto() {
  if(getObjeto.value) return getObjeto.value;
  let props = {
    nombre: MK_STRING('Objeto'),
    claves: MK_FUNCTION_NATIVE(
      function (object: RuntimeVal) {
        let obj = object.__native__();
        return MK_ARRAY_NATIVE(...Object.keys(obj).map(MK_PARSE));
      },
      { nombre: MK_STRING('Objeto.claves') },
      true
    ),
    valores: MK_FUNCTION_NATIVE(
      function (object: RuntimeVal) {
        let obj = object.__native__();
        return MK_ARRAY_NATIVE(...Object.values(obj).map(MK_PARSE));
      },
      { nombre: MK_STRING('Objeto.valores') },
      true
    ),
    pares: MK_FUNCTION_NATIVE(
      function (object: RuntimeVal) {
        let obj = object.__native__();
        let entries = Object.entries(obj);
        return MK_PARSE(entries);
      },
      { nombre: MK_STRING('Objeto.pares') },
      true
    ),
    desdePares: MK_FUNCTION_NATIVE(
      function (pares: ArrayVal<AnyVal>) {
        let entries = pares.__native__();
        let obj = Object.fromEntries(entries);
        return MK_PARSE(obj);
      },
      { nombre: MK_STRING('Objeto.desdePares') },
      true
    )
  };

  getObjeto.value = MK_CLASS_NATIVE(function(obj:RuntimeVal){
    return MK_OBJECT_NATIVE({...obj.__native__()})
  }, props);
  return getObjeto.value;
}
getObjeto.value = null;
getObjeto.proto = null
getObjeto.getProto = function(){
  if(getObjeto.proto) return getObjeto.proto;
  getObjeto.proto = MK_OBJECT(undefined, MK_OBJECT_PROPS())
  return getObjeto.proto
}
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
getFuncion.proto = null;
getFuncion.getProto = function(){
  if(getFuncion.proto) return getFuncion.proto
  getFuncion.proto = MK_OBJECT(undefined, MK_FUNCTION_PROPS(true))
  return getFuncion.proto
}

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
getLista.proto = null
getLista.getProto = function(){
  if(getLista.proto) return getLista.proto;
  getLista.proto = MK_OBJECT(undefined, MK_ARRAY_PROPS())
  return getLista.proto
}
export function getBooleano(){
  if(getBooleano.value) return getBooleano.value;
  let props = {
    nombre: MK_STRING('Booleano'),
  };

  getBooleano.value = MK_CLASS_NATIVE(MK_BOOLEAN_RUNTIME, props);
  return getBooleano.value;
}
getBooleano.value = null;
getBooleano.proto = null
getBooleano.getProto = function(){
  if(getBooleano.proto) return getBooleano.proto;
  getBooleano.proto = MK_OBJECT(undefined, MK_BOOLEAN_PROPS())
  return getBooleano.proto
}
export function getNumero(){
  if(getNumero.value) return getNumero.value;
  let props = {
    nombre: MK_STRING('Numero'),
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
getNumero.proto = null
getNumero.getProto = function(){
  if(getNumero.proto) return getNumero.proto;
  getNumero.proto = MK_OBJECT(undefined, MK_NUMBER_PROPS())
  return getNumero.proto
}
export function getCadena(){
  if(getCadena.value) return getCadena.value;
  let props = {
    nombre: MK_STRING('Cadena'),
  };

  getCadena.value = MK_CLASS_NATIVE((v:AnyVal)=>MK_PARSE_TYPE(v, 'cadena'), props);
  return getCadena.value;
}
getCadena.value = null;
getCadena.proto = null
getCadena.getProto = function(){
  if(getCadena.proto) return getCadena.proto;
  getCadena.proto = MK_OBJECT(undefined, MK_STRING_PROPS())
  return getCadena.proto
}
export function getBuffer(){
  if(getBuffer.value) return getBuffer.value;
  let props = {
    nombre: MK_STRING('Buffer'),
  };

  getBuffer.value = MK_CLASS_NATIVE((v:AnyVal)=>MK_PARSE_TYPE(v, 'buffer'), props);
  return getBuffer.value;
}
getBuffer.value = null;
getBuffer.proto = null
getBuffer.getProto = function(){
  if(getBuffer.proto) return getBuffer.proto;
  getBuffer.proto = MK_OBJECT(undefined, MK_BUFFER_PROPS())
  return getBuffer.proto
}

export default (env: Environment) => [
  ['Objeto', getObjeto()],
  ['Funcion', getFuncion()],
  ['Lista', getLista()],
  ['Booleano', getBooleano()],
  ['Numero', getNumero()],
];
