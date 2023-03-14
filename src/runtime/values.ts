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
  properties: Properties<this['type']>;
  value?: any;
  __pintar__: (n?:number) => string;
  __NATIVO__: () => any;
  __iterable__: () => IteratorVal;
}

export class RuntimeClassVal{
  __iterable__(){
    let iterable = (this as unknown as RuntimeVal).properties.get('__iterable__');
    if(iterable.type === 'funcion'){
      return iterable.execute.call(this);
    }
  };
}
