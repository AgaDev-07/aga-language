import { colors } from '@agacraft/functions';

export const enum ErrorType {
  DivisionByZero,
  InvalidToken,
  InvalidSyntax,
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
      typeError = 'MathError';
      message ||= 'Division by zero';
      break;
    case ErrorType.InvalidToken:
      typeError = 'SyntaxError';
      message ||= 'Invalid token';
      break;
    case ErrorType.InvalidSyntax:
      typeError = 'SyntaxError';
      message ||= 'Invalid syntax';
      break;
    case ErrorType.VariableAlreadyDeclared:
      typeError = 'RuntimeError';
      message ||= 'Variable already declared';
      break;
    case ErrorType.UndefinedVariable:
      typeError = 'RuntimeError';
      message ||= 'Variable is not defined';
      break;
    case ErrorType.ConstantAssignment:
      typeError = 'RuntimeError';
      message ||= 'Cannot assign to constant';
      break;
    default:
      message ||= 'Unknown error';
      break;
  }
  console.error(`${(colors.redBright as unknown as Function)('error')} ${typeError}:\n  ${message}`);
  process.exit(1);
}