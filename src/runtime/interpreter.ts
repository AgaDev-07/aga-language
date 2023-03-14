import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  ElseStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  IterableLiteral,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  Program,
  PropertyIdentifier,
  ReturnStatement,
  Stmt,
  StringLiteral,
  VarDeclaration,
} from '../frontend/ast.js';
import { error, ErrorType } from '../frontend/error.js';
import Environment from './environment.js';
import {
  eval_identifier,
  eval_binary_expr,
  eval_assignment,
  eval_object_expr,
  eval_member_expr,
  eval_call_expr,
  eval_property_identifier,
  eval_iterable_literal,
} from './eval/expressions.js';
import {
  eval_function_declaration,
  eval_if_statement,
  eval_program,
  eval_return_statement,
  eval_var_declaration,
} from './eval/statements.js';
import { RuntimeVal } from './values.js';
import { MK_NUMBER, MK_STRING } from './values/primitive.js';

export function evaluate(astNode: Stmt | Stmt[], env: Environment): RuntimeVal {
  if (Array.isArray(astNode)) {
    let result: RuntimeVal = MK_NUMBER(0);
    for (let i = 0; i < astNode.length; i++) {
      result = evaluate(astNode[i], env);
      if(result.type == 'return') break;
    }
    return result;
  }
  switch (astNode.kind) {
    // Expressions
    case 'CallExpr':
      return eval_call_expr(astNode as CallExpr, env);
    case 'BinaryExpr':
      return eval_binary_expr(astNode as BinaryExpr, env);
    case 'MemberExpr':
      return eval_member_expr(astNode as MemberExpr, env);
    case 'AssignmentExpr':
      return eval_assignment(astNode as AssignmentExpr, env);

    // Literals
    case 'ObjectLiteral':
    case 'ArrayLiteral':
      return eval_object_expr(astNode as ObjectLiteral, env);
    case 'NumericLiteral':
      return MK_NUMBER((astNode as NumericLiteral).value);
    case 'StringLiteral':
      return MK_STRING((astNode as StringLiteral).value);
    case 'IterableLiteral':
      return eval_iterable_literal(astNode as IterableLiteral, env);

    // Identifiers
    case 'Identifier':
      return eval_identifier(astNode as Identifier, env);
    case 'PropertyIdentifier':
      return eval_property_identifier(astNode as PropertyIdentifier, env);

    // Declarations
    case 'VarDeclaration':
      return eval_var_declaration(astNode as VarDeclaration, env);
    case 'FunctionDeclaration':
      return eval_function_declaration(astNode as FunctionDeclaration, env);

    // Statements
    case 'Program':
      return eval_program(astNode as Program, env);

    case 'IfStatement':
      return eval_if_statement(astNode as IfStatement, env);
    case 'ElseStatement':
      return evaluate((astNode as ElseStatement).body, env);
    case 'ReturnStatement':
      return eval_return_statement(astNode as ReturnStatement, env);

    default:
      console.log(astNode);
      error(ErrorType.InvalidSyntax, 0, 0, 'No se pudo evaluar el nodo');
  }
}
