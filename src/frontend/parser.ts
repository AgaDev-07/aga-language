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
  StringLiteral,
  ArrayLiteral,
} from './ast.js';
import { tokenize, Token, TokenType } from './lexer.js';
import { error, ErrorType } from './error.js';

const zero = {
  kind: 'NumericLiteral',
  value: 0,
};
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
    if (!prev || prev.type != type) {
      error(ErrorType.InvalidSyntax, 0, 0, err);
    }
    return prev;
  }

  public produceAST(sourceCode: string, isFunction = false): Program {
    this.tokens = tokenize(sourceCode);
    const program: Program = {
      kind: 'Program',
      body: [],
    };

    // Parse until the end of the file
    while (this.not_eof()) {
      program.body.push(this.parse_stmt(isFunction));
    }

    return program;
  }

  private parse_stmt(
    isFunction = false,
    isLoop = false,
    isClassDecl = false
  ): Stmt {
    switch (this.at().type) {
      case TokenType.Def:
      case TokenType.Const:
        return this.parse_var_decl();
      case TokenType.Funcion:
        return this.parse_func_decl();
      case TokenType.Si:
        return this.parse_if_stmt(isFunction, isLoop);
      case TokenType.Entonces:
        error(
          ErrorType.InvalidSyntax,
          0,
          0,
          'No puedes usar "entonces" sin un "si"'
        );
      case TokenType.Retorna:
        if (!isFunction)
          error(
            ErrorType.InvalidSyntax,
            0,
            0,
            'No puedes usar "retorna" fuera de una función'
          );
        return this.parse_return_stmt();
      case TokenType.Mientras:
        return this.parse_while_stmt();
      case TokenType.Romper:
        if (!isLoop)
          error(
            ErrorType.InvalidSyntax,
            0,
            0,
            'No puedes usar "romper" fuera de un ciclo'
          );
        this.eat();
        return {
          kind: 'BreakStatement',
        };
      case TokenType.Continuar:
        if (!isLoop)
          error(
            ErrorType.InvalidSyntax,
            0,
            0,
            'No puedes usar "continuar" fuera de un ciclo'
          );
        this.eat();
        return {
          kind: 'ContinueStatement',
        };
      case TokenType.Clase:
        if (isClassDecl)
          error(
            ErrorType.InvalidSyntax,
            0,
            0,
            'No puedes declarar una clase dentro de otra'
          );
        return this.parse_class_decl();
      case TokenType.Identifier:
      case TokenType.Estatico:
        if (isClassDecl) return this.parse_class_prop();
      default:
        return this.parse_expr();
    }
  }

  private parse_if_stmt(isFunction = false, isLoop = false): Stmt {
    this.expect(TokenType.Si, 'No se encontró "si"');
    this.expect(TokenType.OpenParen, 'No se encontró "("');
    const condition = this.parse_expr();
    this.expect(TokenType.CloseParen, 'No se encontró ")"');
    this.expect(TokenType.OpenBrace, 'No se encontró "{"');
    const body: Stmt[] = [];
    while (this.at().type != TokenType.CloseBrace) {
      body.push(this.parse_stmt(isFunction, isLoop));
    }
    this.expect(TokenType.CloseBrace, 'No se encontró "}"');
    let elseStmt: ElseStatement | undefined;
    if (this.at().type == TokenType.Entonces) {
      this.eat();
      // else if
      if (this.at().type == TokenType.Si) {
        elseStmt = {
          kind: 'ElseStatement',
          body: [this.parse_if_stmt(isFunction, isLoop)],
        };
      } else {
        this.expect(TokenType.OpenBrace, 'No se encontró "{"');
        const elseBody: Stmt[] = [];
        while (this.at().type != TokenType.CloseBrace) {
          elseBody.push(this.parse_stmt(isFunction, isLoop));
        }
        this.expect(TokenType.CloseBrace, 'No se encontró "}"');
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

  private parse_return_stmt(): Stmt {
    this.expect(TokenType.Retorna, 'No se encontró la palabra clave "retorna"');
    const value = this.parse_expr();
    this.expect(TokenType.Semicolon, 'No se encontró ";"');
    return {
      kind: 'ReturnStatement',
      value,
    } as Stmt;
  }

  private parse_func_decl(): Stmt {
    this.expect(TokenType.Funcion, 'No se encontró la palabra clave "funcion"');
    const name = this.expect(
      TokenType.Identifier,
      'No se encontro el identificador'
    ).value;
    this.expect(TokenType.OpenParen, 'No se encontró "("');
    const args: string[] = [];
    while (this.at().type != TokenType.CloseParen) {
      args.push(
        this.expect(TokenType.Identifier, 'No se encontro el identificador')
          .value
      );
      if (this.at().type == TokenType.Comma) this.eat();
    }
    this.expect(TokenType.CloseParen, 'No se encontró ")"');
    this.expect(TokenType.OpenBrace, 'No se encontró "{"');
    const body: Stmt[] = [];
    while (this.at().type != TokenType.CloseBrace) {
      body.push(this.parse_stmt(true));
    }
    this.expect(TokenType.CloseBrace, 'No se encontró "}"');
    return {
      kind: 'FunctionDeclaration',
      identifier: name,
      params: args,
      body,
    } as Stmt;
  }

  private parse_class_decl(): Stmt {
    this.expect(TokenType.Clase, 'No se encontró la palabra clave "clase"');
    const name = this.expect(
      TokenType.Identifier,
      'No se encontro el identificador'
    ).value;
    this.expect(TokenType.OpenBrace, 'No se encontró "{"');
    const body: Stmt[] = [];
    while (this.at().type != TokenType.CloseBrace) {
      body.push(this.parse_stmt(false, false, true));
    }
    this.expect(TokenType.CloseBrace, 'No se encontró "}"');
    return {
      kind: 'ClassDeclaration',
      identifier: name,
      body,
    } as Stmt;
  }

  private parse_class_prop(especial?: TokenType): Stmt {
    const isStatic = this.at().type == TokenType.Estatico;
    let extra = (isStatic && !especial) ? this.eat() : especial;
    const name = this.expect(
      TokenType.Identifier,
      'No se encontro el identificador'
    ).value;
    const prev = this.eat();
    if (prev.type === TokenType.OpenParen) {
      const args: string[] = [];
      while (this.at().type != TokenType.CloseParen) {
        args.push(
          this.expect(TokenType.Identifier, 'No se encontro el identificador')
            .value
        );
        if (this.at().type == TokenType.Comma) this.eat();
      }
      this.expect(TokenType.CloseParen, 'No se encontró ")"');
      this.expect(TokenType.OpenBrace, 'No se encontró "{"');
      const body: Stmt[] = [];
      while (this.at().type != TokenType.CloseBrace) {
        body.push(this.parse_stmt(true));
      }
      this.expect(TokenType.CloseBrace, 'No se encontró "}"');
      return {
        kind: 'ClassProperty',
        identifier: name,
        value: {
          kind: 'FunctionDeclaration',
          identifier: name,
          params: args,
          body,
        },
        extra,
      } as Stmt;
    }
    if (prev.type === TokenType.Equals) {
      const value = this.parse_expr();
      return {
        kind: 'ClassProperty',
        identifier: name,
        value,
        extra
      } as Stmt;
    }
    return this.parse_class_prop(prev.type);
  }

  private parse_while_stmt(): Stmt {
    this.expect(
      TokenType.Mientras,
      'No se encontró la palabra clave "mientras"'
    );
    this.expect(TokenType.OpenParen, 'No se encontró "("');
    const condition = this.parse_expr();
    this.expect(TokenType.CloseParen, 'No se encontró ")"');
    this.expect(TokenType.OpenBrace, 'No se encontró "{"');
    const body: Stmt[] = [];
    while (this.at().type != TokenType.CloseBrace) {
      body.push(this.parse_stmt(false, true));
    }
    this.expect(TokenType.CloseBrace, 'No se encontró "}"');
    return {
      kind: 'WhileStatement',
      condition,
      body,
    } as Stmt;
  }

  private parse_var_decl(): Stmt {
    const isConstant = this.eat().type == TokenType.Const;
    const name = this.expect(
      TokenType.Identifier,
      'No se encontro el identificador'
    ).value;
    if (this.at().type == TokenType.Semicolon) {
      if (isConstant)
        error(ErrorType.InvalidSyntax, 0, 0, 'Constantes deben tener un valor');
      return {
        kind: 'VarDeclaration',
        constant: isConstant,
        identifier: name,
        value: undefined,
      } as VarDeclaration;
    }
    this.expect(
      TokenType.Equals,
      'Las constantes deben tener un valor inicial'
    );
    const declaration = {
      kind: 'VarDeclaration',
      value: this.parse_expr(),
      constant: isConstant,
      identifier: name,
    } as VarDeclaration;
    return declaration;
  }

  private parse_expr(): Expr {
    let value = this.parse_assignment_expr();
    return value;
  }

  private parse_assignment_expr(
    operator = '',
    left = this.parse_object_expr()
  ): Expr {
    if (this.at().type == TokenType.Equals) {
      this.eat(); // Advance the equals token
      operator += '=';
      if (this.at().type == TokenType.Equals) {
        this.eat(); // Advance the equals token
        operator += '=';
      }
      if (operator.length >= 2) {
        const right = this.parse_assignment_expr(operator) as BinaryExpr;
        return {
          kind: 'BinaryExpr',
          left,
          operator,
          right,
        } as BinaryExpr;
      }
      return {
        kind: 'AssignmentExpr',
        assignee: left,
        value: this.parse_assignment_expr(operator),
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
    if (this.at().type != TokenType.OpenBrace) return this.parse_array_expr();

    this.eat(); // Advance the open brace token
    const properties: Property[] = [];

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const key = this.expect(
        TokenType.Identifier,
        'No se puede usar un valor que no sea un identificador como clave de objeto'
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
      this.expect(
        TokenType.Colon,
        'No se encontró dos puntos en la propiedad del objeto'
      );
      const value = this.parse_expr();
      properties.push({ key, value, kind: 'Property' });
      if (this.at().type != TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          'No se encontró coma en la propiedad del objeto'
        );
      }
    }
    this.expect(TokenType.CloseBrace, 'No se encontró llave de cierre');
    return { kind: 'ObjectLiteral', properties } as ObjectLiteral;
  }

  private parse_array_expr(): Expr {
    if (this.at().type != TokenType.OpenBracket)
      return this.parse_additive_expr();

    this.eat(); // Advance the open brace token
    const properties: Property[] = [];

    while (this.not_eof() && this.at().type != TokenType.CloseBracket) {
      let key = properties.length.toString();
      const value = this.parse_expr();
      properties.push({ key, value, kind: 'Property' });
      if (this.at().type != TokenType.CloseBracket) {
        this.expect(TokenType.Comma, 'No se encontró coma en la lista');
      }
    }

    this.expect(TokenType.CloseBracket, 'No se encontró llave de cierre');
    return { kind: 'ArrayLiteral', properties } as ArrayLiteral;
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
            'No se puede acceder a una propiedad que no sea un identificador'
          );
        property.kind = 'PropertyIdentifier';
      } else {
        property = this.parse_expr();
        computed = true;
        this.expect(
          TokenType.CloseBracket,
          'No se encontró corchete de cierre'
        );
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
    this.expect(TokenType.OpenParen, 'No se encontró paréntesis de apertura');
    const args =
      this.at().type == TokenType.CloseParen ? [] : this.parse_arguments_list();
    this.expect(TokenType.CloseParen, 'No se encontró paréntesis de cierre');
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
    let left = this.parse_sqrt_expr();

    while (
      this.at().value == '*' ||
      this.at().value == '/' ||
      this.at().value == '%'
    ) {
      const operator = this.eat().value;
      const right = this.parse_sqrt_expr();
      left = { kind: 'BinaryExpr', left, right, operator } as BinaryExpr;
    }

    return left;
  }

  private parse_sqrt_expr(): Expr {
    let left = this.parse_call_member_expr();

    while (this.at().value == '^') {
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
      case TokenType.String:
        return {
          kind: 'StringLiteral',
          value: this.eat().value,
        } as StringLiteral;

      case TokenType.OpenParen:
        this.eat(); // Eat the open paren
        const value = this.parse_expr();
        this.expect(
          TokenType.CloseParen,
          'No se encontró el paréntesis de cierre'
        ); // Eat the close paren
        return value;
      case TokenType.Funcion:
        return this.parse_func_decl();
      case TokenType.BinaryOperator:
        if (this.at().value == '-' || this.at().value == '+') {
          this.eat();
          return {
            kind: 'BinaryExpr',
            left: zero,
            right: this.parse_expr(),
            operator: '-',
          } as BinaryExpr;
        }
      case TokenType.Mientras:
        return this.parse_while_stmt();

      default:
        error(
          ErrorType.InvalidToken,
          0,
          0,
          `Un token inesperado "${this.at().value}"`
        );
    }
  }
}
