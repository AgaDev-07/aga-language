import { ArrayVal, ComplexType, FunctionVal, ModuleVal, ObjectVal } from "./values/complex.js";
import { InternalType, InternalVal, IteratorVal, Properties } from "./values/internal.js";
import { BooleanVal, BufferVal, NullVal, NumberVal, PrimitiveType, StringVal, VoidVal } from "./values/primitive.js";

export interface ValueFamily {
  primitive: PrimitiveType;
  complex: ComplexType;
  internal: InternalType;
}

export type ValueType = PrimitiveType | ComplexType | InternalType;
export type AnyVal = FunctionVal | ObjectVal | ArrayVal<AnyVal> | StringVal | BooleanVal | NullVal | VoidVal | ModuleVal | NumberVal | BufferVal;

export interface RuntimeVal{
  family: keyof ValueFamily;
  type: ValueFamily[this['family']];
  properties: Properties<AnyVal>;
  value?: any;
  __pintar__: (n?:number) => string;
  __native__: () => any;
  __iterable__: () => IteratorVal;
  aCadena: () => string;
  aNumero: () => number;
}

export class RuntimeClassVal{
  __iterable__(){
    let iterable = (this as unknown as RuntimeVal).properties.get('__iterable__');
    if(iterable.type === 'funcion'){
      return iterable.execute.call(this);
    }
  };
  __pintar__(){
    let pintar = (this as unknown as RuntimeVal).properties.get('__pintar__');
    if(pintar.type === 'funcion'){
      return pintar.execute.call(this);
    }
  };
  __native__(){
    let nativo = (this as unknown as RuntimeVal).properties[Symbol.toPrimitive]
    if(nativo.type === 'funcion'){
      return nativo.execute.call(this);
    }
  }
  aCadena(){
    let aCadena = (this as unknown as RuntimeVal).properties.get('aCadena');
    if(aCadena.type === 'funcion'){
      return aCadena.execute.call(this);
    }
    return '<instancia de ' + (this as unknown as RuntimeVal).properties.get('nombre').type + '>';
  }
  aNumero(){
    let aNumero = (this as unknown as RuntimeVal).properties.get('aNumero');
    if(aNumero.type === 'funcion'){
      return aNumero.execute.call(this);
    }
    return NaN;
  }
}
