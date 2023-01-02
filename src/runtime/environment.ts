import { error, ErrorType } from '../frontend/error';
import {
  MK_BOOLEAN,
  MK_FUNCTION,
  MK_NULL,
  MK_NUMBER,
  RuntimeVal,
} from './values';

function setupGlobalScope(env: Environment): void {
  env.declareVar('pi', MK_NUMBER(3.14159));
  env.declareVar('e', MK_NUMBER(2.71828));
  env.declareVar('nulo', MK_NULL(), true);
  env.declareVar('falso', MK_BOOLEAN(false), true);
  env.declareVar('verdadero', MK_BOOLEAN(true), true);
  env.declareVar(
    'pintar',
    MK_FUNCTION(['value'], [], env, function () {
      console.log(...arguments);
    })
  );
}

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeVal>;
  private constants: Set<string>;

  constructor(parentENV?: Environment) {
    const globalScope = !parentENV;
    this.parent = parentENV;
    this.variables = new Map();
    this.constants = new Set();

    if (globalScope) setupGlobalScope(this);
  }

  public declareVar(
    name: string,
    value: RuntimeVal,
    constant: boolean = false
  ): RuntimeVal {
    if (this.variables.has(name))
      error(
        ErrorType.VariableAlreadyDeclared,
        0,
        0,
        `Variable '${name}' has already been declared`
      );
    if (constant) this.constants.add(name);
    this.variables.set(name, value);
    return value;
  }

  public assignVar(name: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(name);
    if (env.constants.has(name))
      error(
        ErrorType.ConstantAssignment,
        0,
        0,
        `Variable '${name}' is a constant and cannot be assigned`
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
      `Variable '${name}' has not been declared`
    );
  }
}
