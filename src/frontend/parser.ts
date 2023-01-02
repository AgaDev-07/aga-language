import {
  Stmt,
  Program,
  Expr,
  BinaryExpr,
  NumericLiteral,
  Identifier,
  VarDeclaration,
  AssignmentExpr,
  Property,
  ObjectLiteral,
  CallExpr,
  MemberExpr,
  ElseStatement,
  IfStatement,
} from './ast';
import { tokenize, Token, TokenType } from './lexer';
import { error, ErrorType } from './error';

export default class Parser {
  private tokens: Token[];

  private not_eof(): boolean {
    return this.tokens[0].type != TokenType.EOF;
  }

  private at(): Token {
    return this.tokens[0];
  }

  private eat(): Token {
    const prev = this.tokens.shift();
    return prev;
  }
  private expect(type: TokenType, err: any): Token {
    const prev = this.tokens.shift();
    if (!prev || prev.type != type) error(ErrorType.InvalidSyntax, 0, 0, err);
    return prev;
  }

  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);
    const program: Program = {
      kind: 'Program',
      body: [],
    };

    // Parse until the end of the file
    while (this.not_eof()) {
      program.body.push(this.parse_stmt());
    }

    return program;
  }

  private parse_stmt(): Stmt {
    switch (this.at().type) {
      case TokenType.Def:
      case TokenType.Const:
        return this.parse_var_decl();
      case TokenType.Funcion:
        return this.parse_func_decl();
      case TokenType.Si:
        return this.parse_if_stmt();
      case TokenType.Entonces:
        error(
          ErrorType.InvalidSyntax,
          0,
          0,
          'Unexpected then keyword "entonces"'
        );
      default:
        return this.parse_expr();
    }
  }

  private parse_if_stmt(): Stmt {
    this.expect(TokenType.Si, 'Expected if keyword');
    this.expect(TokenType.OpenParen, 'Expected open parenthesis');
    const condition = this.parse_expr();
    this.expect(TokenType.CloseParen, 'Expected close parenthesis');
    this.expect(TokenType.OpenBrace, 'Expected open brace');
    const body: Stmt[] = [];
    while (this.at().type != TokenType.CloseBrace) {
      body.push(this.parse_stmt());
    }
    this.expect(TokenType.CloseBrace, 'Expected close brace');
    let elseStmt: ElseStatement | undefined;
    if (this.at().type == TokenType.Entonces) {
      this.eat();
      // else if
      if (this.at().type == TokenType.Si) {
        elseStmt = {
          kind: 'ElseStatement',
          body: [this.parse_if_stmt()],
        };
      } else {
        this.expect(TokenType.OpenBrace, 'Expected open brace');
        const elseBody: Stmt[] = [];
        while (this.at().type != TokenType.CloseBrace) {
          elseBody.push(this.parse_stmt());
        }
        this.expect(TokenType.CloseBrace, 'Expected close brace');
        elseStmt = {
          kind: 'ElseStatement',
          body: elseBody,
        };
      }
    }
    return {
      kind: 'IfStatement',
      condition,
      body,
      else: elseStmt,
    } as Stmt;
  }

  private parse_func_decl(): Stmt {
    this.expect(TokenType.Funcion, 'Expected function keyword');
    const name = this.expect(TokenType.Identifier, 'Expected identifier').value;
    this.expect(TokenType.OpenParen, 'Expected open parenthesis');
    const args: string[] = [];
    while (this.at().type != TokenType.CloseParen) {
      args.push(this.expect(TokenType.Identifier, 'Expected identifier').value);
      if (this.at().type == TokenType.Comma) this.eat();
    }
    this.expect(TokenType.CloseParen, 'Expected close parenthesis');
    this.expect(TokenType.OpenBrace, 'Expected open brace');
    const body: Stmt[] = [];
    while (this.at().type != TokenType.CloseBrace) {
      body.push(this.parse_stmt());
    }
    this.expect(TokenType.CloseBrace, 'Expected close brace');
    return {
      kind: 'FunctionDeclaration',
      identifier: name,
      params: args,
      body,
    } as Stmt;
  }

  private parse_var_decl(): Stmt {
    const isConstant = this.eat().type == TokenType.Const;
    const name = this.expect(TokenType.Identifier, 'Expected identifier').value;
    if (this.at().type == TokenType.Semicolon) {
      if (isConstant)
        error(ErrorType.InvalidSyntax, 0, 0, 'Constant must have value');
      return {
        kind: 'VarDeclaration',
        constant: isConstant,
        identifier: name,
        value: undefined,
      } as VarDeclaration;
    }
    this.expect(
      TokenType.Equals,
      'Expected equals token following identifier in variable declaration.'
    );
    const declaration = {
      kind: 'VarDeclaration',
      value: this.parse_expr(),
      constant: isConstant,
      identifier: name,
    } as VarDeclaration;
    this.expect(
      TokenType.Semicolon,
      'Variable declaration statement must end with semicolon.'
    );
    return declaration;
  }

  private parse_expr(): Expr {
    let value = this.parse_assignment_expr();
    return value;
  }

  private parse_assignment_expr(operator = '', left = this.parse_object_expr()): Expr {

    if (this.at().type == TokenType.Equals) {
      this.eat(); // Advance the equals token
      operator += '=';
      if(this.at().type == TokenType.Equals) {
        this.eat(); // Advance the equals token
        operator += '=';
      }
      if(operator.length >= 2) {
        const right = this.parse_assignment_expr(operator) as BinaryExpr;
        return {
          kind: 'BinaryExpr',
          left,
          operator,
          right
        } as BinaryExpr;
      }
      return {
        kind: 'AssignmentExpr',
        assignee: left,
        value: this.parse_assignment_expr(operator, left),
      } as AssignmentExpr;
    }
    if (this.at().type == TokenType.Negate) {
      this.eat(); // Advance the negate token
      return this.parse_assignment_expr('!', left) as BinaryExpr;
    }
    if (this.at().type == TokenType.Or) {
      this.eat(); // Advance the or token
      return this.parse_assignment_expr('|', left) as BinaryExpr;
    }
    if (this.at().type == TokenType.And) {
      this.eat(); // Advance the and token
      return this.parse_assignment_expr('&', left) as BinaryExpr;
    }
    return left;
  }

  private parse_object_expr(): Expr {
    if (this.at().type != TokenType.OpenBrace)
      return this.parse_additive_expr();

    this.eat(); // Advance the open brace token
    const properties: Property[] = [];

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const key = this.expect(
        TokenType.Identifier,
        'Object literal key exprected'
      ).value;

      // Allow shorthand
      if (this.at().type == TokenType.Comma) {
        this.eat(); // Advance the colon token
        properties.push({ key, kind: 'Property' });
        continue;
      } else if (this.at().type == TokenType.CloseBrace) {
        properties.push({ key, kind: 'Property' });
        continue;
      }
      this.expect(TokenType.Colon, 'Missing colon in object literal');
      const value = this.parse_expr();
      properties.push({ key, value, kind: 'Property' });
      if (this.at().type != TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          'Missing comma or closing brace in object literal'
        );
      }
    }
    this.expect(TokenType.CloseBrace, 'Object literal missing closing brace');
    return { kind: 'ObjectLiteral', properties } as ObjectLiteral;
  }

  private parse_additive_expr(): Expr {
    let left = this.parse_multiplicative_expr();

    while (this.at().value == '+' || this.at().value == '-') {
      const operator = this.eat().value;
      const right = this.parse_multiplicative_expr();
      left = { kind: 'BinaryExpr', left, right, operator } as BinaryExpr;
    }

    return left;
  }

  private parse_member_expr(): Expr {
    let object = this.parse_primary_expr();

    while (
      this.at().type == TokenType.Dot ||
      this.at().type == TokenType.OpenBracket
    ) {
      const operator = this.eat();
      let property: Expr;
      let computed: boolean;

      if (operator.type == TokenType.Dot) {
        property = this.parse_primary_expr();
        computed = false;
        if (property.kind != 'Identifier')
          error(
            ErrorType.InvalidSyntax,
            0,
            0,
            'Cannon use dot operator without right hand side being a identifier'
          );
      } else {
        property = this.parse_expr();
        computed = true;
        this.expect(TokenType.CloseBracket, 'Missing closing bracket');
      }
      object = { kind: 'MemberExpr', object, property, computed } as MemberExpr;
    }
    return object;
  }

  private parse_arguments_list(): Expr[] {
    const args = [this.parse_expr()];
    while (this.not_eof() && this.at().type == TokenType.Comma && this.eat()) {
      args.push(this.parse_assignment_expr());
    }
    return args;
  }

  private parse_args(): Expr[] {
    this.expect(TokenType.OpenParen, 'Expected open parenthesis');
    const args =
      this.at().type == TokenType.CloseParen ? [] : this.parse_arguments_list();
    this.expect(
      TokenType.CloseParen,
      'Missing closing parenthesis inside arguments list'
    );
    return args;
  }

  private parse_call_expr(callee: Expr): Expr {
    let call_expr: Expr = {
      kind: 'CallExpr',
      callee,
      args: this.parse_args(),
    } as CallExpr;
    if (this.at().type == TokenType.OpenParen)
      call_expr = this.parse_call_expr(call_expr);

    return call_expr;
  }

  private parse_call_member_expr(): Expr {
    const member = this.parse_member_expr();

    if (this.at().type == TokenType.OpenParen)
      return this.parse_call_expr(member);
    return member;
  }

  private parse_multiplicative_expr(): Expr {
    let left = this.parse_call_member_expr();

    while (
      this.at().value == '*' ||
      this.at().value == '/' ||
      this.at().value == '%'
    ) {
      const operator = this.eat().value;
      const right = this.parse_call_member_expr();
      left = { kind: 'BinaryExpr', left, right, operator } as BinaryExpr;
    }

    return left;
  }

  private parse_primary_expr(): Expr {
    const tk = this.at().type;

    switch (tk) {
      case TokenType.Identifier:
        return { kind: 'Identifier', symbol: this.eat().value } as Identifier;
      case TokenType.Number:
        return {
          kind: 'NumericLiteral',
          value: parseFloat(this.eat().value),
        } as NumericLiteral;
      case TokenType.OpenParen:
        this.eat(); // Eat the open paren
        const value = this.parse_expr();
        this.expect(
          TokenType.CloseParen,
          'Unexpected token found inside parenthesied expresion. Expected closing parenthesis.'
        ); // Eat the close paren
        return value;

      default:
        console.log(this.at());
        error(
          ErrorType.InvalidToken,
          0,
          0,
          `Unexpected token found during parsing!`
        );
    }
  }
}
