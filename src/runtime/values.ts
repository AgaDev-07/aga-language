import { Stmt } from "../frontend/ast";
import Environment from "./environment";

export type PrimitiveType = 'nulo' | 'numero' | 'booleano' | 'void' | 'cadena';
export type ComplexType = 'object' | 'function';

export interface ValueFamily {
  primitive: PrimitiveType;
  complex: ComplexType;
}

export type ValueType = PrimitiveType | ComplexType;

export interface RuntimeVal {
  type: ValueFamily[this['family']];
  family: keyof ValueFamily;
}

export interface PrimitiveVal extends RuntimeVal {
  value: any;
  family: 'primitive';
}

function MK_PRIMITIVE(value: any, type: PrimitiveType): PrimitiveVal {
  return { value, type, family: 'primitive' };
}

export interface NullVal extends PrimitiveVal {
  type: 'nulo';
  value: null;
}

export function MK_NULL(): NullVal {
  return MK_PRIMITIVE('nulo', null) as NullVal;
}

export interface NumberVal extends PrimitiveVal {
  type: 'numero';
  value: number;
}

export function MK_NUMBER(value = 0): NumberVal {
  if(value != value) return MK_NAN();
  if(typeof value != 'number') return MK_NUMBER(Number(value));
  return MK_PRIMITIVE(value, 'numero') as NumberVal;
}
export function MK_NAN(): NumberVal {
  return MK_PRIMITIVE(null, 'numero') as NumberVal;
}

export interface BooleanVal extends PrimitiveVal {
  type: 'booleano';
  value: boolean;
}

export function MK_BOOLEAN(value = false): BooleanVal {
  return MK_PRIMITIVE(value, 'booleano') as BooleanVal;
}

export interface ComplexVal extends RuntimeVal {
  family: 'complex';
}

export function MK_COMPLEX(value:{type: ComplexType, [key:string]:any}): ComplexVal {
  return { ...value, family: 'complex' };
}

export interface ObjectVal extends ComplexVal {
  type: 'object';
  properties: Map<string, RuntimeVal>;
}

export function MK_OBJECT(properties: Map<string, RuntimeVal>): ObjectVal {
  return MK_COMPLEX({ type: 'object', properties }) as ObjectVal;
}

export interface FunctionVal extends ComplexVal {
  type: 'function';
  body: Stmt[];
  params: string[];
  env: ()=> Environment;
  native?: Function;
}

export function MK_FUNCTION(
  params: string[],
  body: Stmt[],
  env: Environment,
  native?: Function
): FunctionVal {
  return MK_COMPLEX({ type: 'function', body, params, env(){return new Environment(env)}, native }) as FunctionVal;
}

export interface VoidVal extends PrimitiveVal {
  type: 'void';
  value: null;
}

export function MK_VOID(): VoidVal {
  return MK_PRIMITIVE(null, 'void') as VoidVal;
}

export interface StringVal extends PrimitiveVal {
  type: 'cadena';
  value: string;
}

export function MK_STRING(value = ''): StringVal {
  return MK_PRIMITIVE(value, 'cadena') as StringVal;
}