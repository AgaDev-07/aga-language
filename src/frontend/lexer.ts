import { error, ErrorType } from './error.js';

export const enum TokenType {
  // Types
  Number,
  String,
  Identifier,

  // Operators
  Equals, // =
  Negate, // !
  And, // &
  Or, // |

  OpenParen, // (
  CloseParen, // )
  BinaryOperator, // + - * / %
  Semicolon, // ;
  Comma, // ,
  Dot, // .
  Colon, // :
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  OpenAngle, // <
  CloseAngle, // >
  Backslash, // \
  EOF, // End of file

  // Keywords
  Def,
  Const,
  Funcion,
  Si,
  Entonces,
  Retorna,
  Mientras,
  Romper,
  Continuar,
  Clase,
  Estatico,
}

// reserved keywords
const KEYWORDS: Record<string, TokenType> = {
  def: TokenType.Def,
  const: TokenType.Const,
  funcion: TokenType.Funcion,
  si: TokenType.Si,
  entonces: TokenType.Entonces,
  retorna: TokenType.Retorna,
  mientras: TokenType.Mientras,
  romper: TokenType.Romper,
  continuar: TokenType.Continuar,
  clase: TokenType.Clase,
  estatico: TokenType.Estatico,
};

export interface Token {
  type: TokenType;
  value: string;
}

function token(value = '', type: TokenType): Token {
  return { value, type };
}

// Validate that the character is a letter
function isAlpha(src: string) {
  return src.match(/[a-z_$0-9]/i) != null;
}

// Validate that the character is a number
function isInt(str: string, bool: boolean = true) {
  const c = str.charCodeAt(0);
  const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

  const isNumber = c >= bounds[0] && c <= bounds[1];
  const isDot = bool && str == '.'

  return isNumber || isDot;
}

// Validate that the character is a skippable character
function isSkippable(src: string) {
  return src == ' ' || src == '\n' || src == '\t' || src == '\r';
}

function getString(src: string[], quote: string = '"') {
  let str = '';
  src.shift();
  while (src.length > 0 && src[0] != quote) {
    if (src[0] == '\\'){
      src.shift();
      let next = src.shift();
      if (next == 'n') str += '\n';
      else if (next == 't') str += '\t';
      else if (next == 'r') str += '\r';
      else if (next == 'b') str += '\b';
      else if (next == 'f') str += '\f';
      else if (next == 'v') str += '\v';
      else if (next == '0') str += '\0';
      else if (next == 'x') {
        src.shift();
        let hex = src.shift() + src.shift();
        str += String.fromCharCode(parseInt(hex, 16));
      }
      else if (next == 'u') {
        src.shift();
        let hex = src.shift() + src.shift() + src.shift() + src.shift();
        str += String.fromCharCode(parseInt(hex, 16));
      }
      else if (next == 'U') {
        src.shift();
        let hex = src.shift() + src.shift() + src.shift() + src.shift() + src.shift() + src.shift() + src.shift() + src.shift();
        str += String.fromCharCode(parseInt(hex, 16));
      }
      else if(next == '\\') str += '\\';
      else if(next == '"') str += '"';
      else if(next == "'") str += "'";
    }
    else str += src.shift();
  }
  src.shift();
  return token(str, TokenType.String);
}

// Tokenize the source code
export function tokenize(sourceCode: string): Token[] {
  const tokens: Token[] = [];
  const src = sourceCode.split('');

  while (src.length > 0) {
    if (src[0] == '(') tokens.push(token(src.shift(), TokenType.OpenParen));
    else if (src[0] == ')')
      tokens.push(token(src.shift(), TokenType.CloseParen));
    else if (src[0] == '{')
      tokens.push(token(src.shift(), TokenType.OpenBrace));
    else if (src[0] == '}')
      tokens.push(token(src.shift(), TokenType.CloseBrace));
    else if (src[0] == '[')
      tokens.push(token(src.shift(), TokenType.OpenBracket));
    else if (src[0] == ']')
      tokens.push(token(src.shift(), TokenType.CloseBracket));
    else if (src[0] == '<')
      tokens.push(token(src.shift(), TokenType.OpenAngle));
    else if (src[0] == '>')
      tokens.push(token(src.shift(), TokenType.CloseAngle));
    else if (
      src[0] == '+' ||
      src[0] == '-' ||
      src[0] == '*' ||
      src[0] == '/' ||
      src[0] == '%' ||
      src[0] == '^'
    )
      tokens.push(token(src.shift(), TokenType.BinaryOperator));
    else if (src[0] == '=') tokens.push(token(src.shift(), TokenType.Equals));
    else if (src[0] == '!') tokens.push(token(src.shift(), TokenType.Negate));
    else if (src[0] == '&') tokens.push(token(src.shift(), TokenType.And));
    else if (src[0] == '|') tokens.push(token(src.shift(), TokenType.Or));
    else if (src[0] == ';')
      tokens.push(token(src.shift(), TokenType.Semicolon));
    else if (src[0] == ':') tokens.push(token(src.shift(), TokenType.Colon));
    else if (src[0] == ',') tokens.push(token(src.shift(), TokenType.Comma));
    else if (src[0] == '.') tokens.push(token(src.shift(), TokenType.Dot));
    else if (src[0] == '"') tokens.push(getString(src));
    else if (src[0] == "'") tokens.push(getString(src, "'"))
    else if (src[0] == '\\') tokens.push(token(src.shift(), TokenType.Backslash));
    else {
      if (isInt(src[0], false)) {
        let num = '';
        while (src.length > 0 && isInt(src[0])) {
          if(src[0] == '.' && num.includes('.')) error(ErrorType.InvalidSyntax, 0, 0, `Un numero no puede tener mas de dos puntos decimales`);
          num += src.shift();
        }

        tokens.push(token(num, TokenType.Number));
      } else if (isAlpha(src[0])) {
        let id = '';
        while (src.length > 0 && isAlpha(src[0])) {
          id += src.shift();
        }

        const reserved = KEYWORDS[id];

        if (typeof reserved == 'number') tokens.push(token(id, reserved));
        else tokens.push(token(id, TokenType.Identifier));
      } else if (isSkippable(src[0])) src.shift();
      else{
        error(
          ErrorType.InvalidSyntax,
          0,
          0,
          `Caracter "${src[0]}" no funciono en el analizador lexico`
        );
      }
    }
  }

  tokens.push(token('EndOfFile', TokenType.EOF));

  return tokens;
}
