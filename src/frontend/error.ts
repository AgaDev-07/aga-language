import colors from '../libs/colors';
































export const enum ErrorType {
  DivisionByZero,
  InvalidToken,
  InvalidSyntax,
  InvalidType,
  InvalidOperation,
  VariableAlreadyDeclared,
  UndefinedVariable,
  ConstantAssignment,
  KeywordAssignment,
  UnwnownModule,
  RuntimeError,
  FileNotFound,
  InvalidArgument
}

export interface Error {
  type: ErrorType;
  message: string;
  line: number;
  column: number;
}

export function error(
  type: ErrorType,
  line: number,
  column: number,
  message: string = ''
) {
  let typeError = 'Error';
  switch (type) {
    case ErrorType.DivisionByZero:
      typeError = 'ErrorMatematico';
      message ||= 'No se puede dividir entre cero';
      break;
    case ErrorType.InvalidOperation:
      typeError = 'ErrorMatematico';
      message ||= 'Operacion invalida';
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
    case ErrorType.KeywordAssignment:
      typeError = 'ErrorEjecucion';
      message ||= 'No se puede reasignar una palabra reservada';
      break;
    case ErrorType.UnwnownModule:
      typeError = 'ErrorEjecucion';
      message ||= 'Modulo no encontrado';
      break;

    case ErrorType.InvalidType:
      typeError = 'ErrorTipos';
      message ||= 'Tipo invalido';
      break;
    default:
      message ||= 'Error desconocido';
      break;
  }
  console.error(`${colors.redBright('error')} ${typeError}:\n  ${message}`);
  process.exit(1);
}
