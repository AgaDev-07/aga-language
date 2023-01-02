import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Stmt,
  VarDeclaration,
} from '../frontend/ast';
import { error, ErrorType } from '../frontend/error';
import Environment from './environment';
import {
  eval_identifier,
  eval_binary_expr,
  eval_assignment,
  eval_object_expr,
  eval_member_expr,
  eval_call_expr,
} from './eval/expressions';
import { eval_function_declaration, eval_if_statement, eval_program, eval_var_declaration } from './eval/statements';
import { RuntimeVal, MK_NUMBER } from './values';

export function evaluate(astNode: Stmt, env: Environment, isFunction: boolean = false): RuntimeVal {
  switch (astNode.kind) {
    case 'CallExpr':
      return eval_call_expr(astNode as CallExpr, env);
    case 'BinaryExpr':
      return eval_binary_expr(astNode as BinaryExpr, env);
    case 'MemberExpr':
      return eval_member_expr(astNode as MemberExpr, env);
    case 'ObjectLiteral':
      return eval_object_expr(astNode as ObjectLiteral, env);
    case 'NumericLiteral':
      return MK_NUMBER((astNode as NumericLiteral).value);

    case 'Identifier':
      return eval_identifier(astNode as Identifier, env);

    case 'Program':
      return eval_program(astNode as Program, env);
    case 'AssignmentExpr':
      return eval_assignment(astNode as AssignmentExpr, env);
    case 'VarDeclaration':
      return eval_var_declaration(astNode as VarDeclaration, env);
    case 'FunctionDeclaration':
      return eval_function_declaration(astNode as FunctionDeclaration, env);
    case 'IfStatement':
      return eval_if_statement(astNode as IfStatement, env);

    default:
      console.log(astNode);
      error(
        ErrorType.InvalidSyntax,
        0,
        0,
        'This AST Node has not yet been setup for interpretation'
      );
  }
}
