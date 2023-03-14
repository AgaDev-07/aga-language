import { error, ErrorType } from '../frontend/error.js';

import definition from './global/definition.js';
import { RuntimeVal } from './values.js';

const keywords = new Set(['nulo', 'verdadero', 'falso', 'vacio']);
export default class Environment {
  static getGlobalScope(): Environment {
    const env = new Environment();
    definition(env);
    return env;
  }
  private parent?: Environment;
  private variables: Map<string, RuntimeVal>;
  private constants: Set<string>;

  constructor(parentENV?: Environment) {
    this.parent = parentENV;
    this.variables = new Map();
    this.constants = new Set();
  }

  public declareVar(
    name: string,
    value: RuntimeVal,
    constant: boolean = false,
    keyword: boolean = false
  ): RuntimeVal {
    if (!keyword && keywords.has(name))
      error(
        ErrorType.KeywordAssignment,
        0,
        0,
        `Variable '${name}' es una palabra reservada y no puede ser declarara`
      );
    else if (this.variables.has(name))
      error(
        ErrorType.VariableAlreadyDeclared,
        0,
        0,
        `Variable '${name}' ya ha sido declarada`
      );
    if (constant) this.constants.add(name);
    this.variables.set(name, value);
    return value;
  }

  public assignVar(name: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(name);
    if (keywords.has(name))
      error(
        ErrorType.KeywordAssignment,
        0,
        0,
        `Variable '${name}' es una palabra reservada y no puede ser modificada`
      );
    else if (env.constants.has(name))
      error(
        ErrorType.ConstantAssignment,
        0,
        0,
        `Variable '${name}' es una constante y no puede ser modificada`
      );
    env.variables.set(name, value);
    return value;
  }

  public lookupVar(name: string): RuntimeVal {
    const env = this.resolve(name);
    return env.variables.get(name);
  }

  public resolve(name: string): Environment {
    if (this.variables.has(name)) return this;
    if (this.parent) return this.parent.resolve(name);
    error(
      ErrorType.VariableAlreadyDeclared,
      0,
      0,
      `Variable '${name}' no ha sido declarada`
    );
  }
}
