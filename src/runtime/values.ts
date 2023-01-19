import { ComplexType } from "./values/complex";
import { InternalType } from "./values/internal";
import { PrimitiveType } from "./values/primitive";

export interface ValueFamily {
  primitive: PrimitiveType;
  complex: ComplexType;
  internal: InternalType;
}

export type ValueType = PrimitiveType | ComplexType | InternalType;

export interface RuntimeVal{
  family: keyof ValueFamily;
  type: ValueFamily[this['family']];
  __pintar__: (n?:number) => string;
  __NATIVO__: () => any;
}
