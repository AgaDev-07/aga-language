export type BlockType =
  | 'FunctionDeclaration'
  | 'IfStatement'
  | 'ElseStatement'

export type NodeType =
  // Statements
  | 'Program'
  | 'VarDeclaration'
  | 'ReturnStatement'
  | BlockType

  // Expressions
  | 'AssignmentExpr'
  | 'MemberExpr'
  | 'CallExpr'

  // Literals
  | 'Property'
  | 'ObjectLiteral'
  | 'NumericLiteral'
  | 'StringLiteral'
  | 'Identifier'
  | 'PropertyIdentifier'
  | 'BinaryExpr';

// TODO:[ 'CallExpr', 'UnaryExpr', 'FunctionDeclaration' ]
export interface Stmt {
  kind: NodeType;
}

export interface Program extends Stmt {
  kind: 'Program';
  body: Stmt[];
}

export interface VarDeclaration extends Stmt {
  kind: 'VarDeclaration';
  constant: boolean;
  identifier: string;
  value?: Expr;
}

export interface BlockStatement extends Stmt {
  kind: BlockType;
  body: Stmt[];
}

export interface FunctionDeclaration extends BlockStatement {
  kind: 'FunctionDeclaration';
  identifier: string;
  params: string[];
}

export interface IfStatement extends BlockStatement {
  kind: 'IfStatement';
  condition: Expr;
  else?: ElseStatement;
}

export interface ElseStatement extends BlockStatement {
  kind: 'ElseStatement';
  if?: IfStatement;
}

export interface Expr extends Stmt {}

export interface AssignmentExpr extends Expr {
  kind: 'AssignmentExpr',
  assignee: Expr,
  value: Expr,
}

export interface BinaryExpr extends Expr {
  kind: 'BinaryExpr';
  left: Expr;
  right: Expr;
  operator: string;
}

export interface CallExpr extends Expr {
  kind: 'CallExpr';
  callee: Expr;
  args: Expr[];
}

export interface MemberExpr extends Expr {
  kind: 'MemberExpr';
  object: Expr;
  property: Expr;
  computed: boolean;
}

export interface Identifier extends Expr {
  kind: 'Identifier';
  symbol: string;
}

export interface PropertyIdentifier extends Expr {
  kind: 'PropertyIdentifier';
  symbol: string;
}

export interface NumericLiteral extends Expr {
  kind: 'NumericLiteral';
  value: number;
}

export interface StringLiteral extends Expr {
  kind: 'StringLiteral';
  value: string;
}

export interface Property extends Expr {
  kind: 'Property';
  key: string;
  value?: Expr;
}

export interface ObjectLiteral extends Expr {
  kind: 'ObjectLiteral';
  properties: Property[];
}

export interface ReturnStatement extends Stmt {
  kind: 'ReturnStatement';
  value?: Expr;
}