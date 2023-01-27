import { ArrayVal, ComplexType, FunctionVal, ModuleVal, ObjectVal } from "./values/complex";
import { InternalType, InternalVal, Properties } from "./values/internal";
import { BooleanVal, NullVal, PrimitiveType, StringVal, VoidVal } from "./values/primitive";

export interface ValueFamily {
  primitive: PrimitiveType;
  complex: ComplexType;
  internal: InternalType;
}

export type ValueType = PrimitiveType | ComplexType | InternalType;
export type AnyVal = FunctionVal | ObjectVal | ArrayVal<AnyVal> | StringVal | BooleanVal | NullVal | VoidVal | ModuleVal;

export interface RuntimeVal{
  family: keyof ValueFamily;
  type: ValueFamily[this['family']];
  properties: Properties<this['type']>;
  value?: any;
  __pintar__: (n?:number) => string;
  __NATIVO__: () => any;
}

export class RuntimeClassVal{}