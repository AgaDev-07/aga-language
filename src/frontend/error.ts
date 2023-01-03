import { colors } from '@agacraft/functions';

export const enum ErrorType {
  DivisionByZero,
  InvalidToken,
  InvalidSyntax,
  InvalidType,
  VariableAlreadyDeclared,
  UndefinedVariable,
  ConstantAssignment
}

export interface Error {
  type: ErrorType;
  message: string;
  line: number;
  column: number;
}

export function error(type: ErrorType, line: number, column: number, message: string = '') {
  let typeError = 'Error';
  switch (type) {
    case ErrorType.DivisionByZero:
      typeError = 'ErrorMatematico';
      message ||= 'No se puede dividir entre cero';
      break;
    case ErrorType.InvalidToken:
      typeError = 'ErrorSintactico';
      message ||= 'Token invalido';
      break;
    case ErrorType.InvalidSyntax:
      typeError = 'ErrorSintactico';
      message ||= 'Sintaxis invalida';
      break;
    case ErrorType.VariableAlreadyDeclared:
      typeError = 'ErrorEjecucion';
      message ||= 'Variable ya declarada';
      break;
    case ErrorType.UndefinedVariable:
      typeError = 'ErrorEjecucion';
      message ||= 'Variable no definida';
      break;
    case ErrorType.ConstantAssignment:
      typeError = 'ErrorEjecucion';
      message ||= 'No se puede reasignar una constante';
      break;
    case ErrorType.InvalidType:
      typeError = 'ErrorTipos';
      message ||= 'Tipo invalido';
    default:
      message ||= 'Error desconocido';
      break;
  }
  console.error(`${(colors.redBright as unknown as Function)('error')} ${typeError}:\n  ${message}`);
  process.exit(1);
}