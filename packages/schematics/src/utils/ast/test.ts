/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import { findNodes } from '@schematics/angular/utility/ast-utils';
import { Change, InsertChange } from '@schematics/angular/utility/change';

export function addImportToTestBed(
  source: ts.SourceFile,
  specPath: string,
  symbolName: string
): Change[] {
  const allCalls: ts.CallExpression[] = <any>findNodes(
    source,
    ts.SyntaxKind.CallExpression
  );

  const configureTestingModuleObjectLiterals = allCalls
    .filter(c => c.expression.kind === ts.SyntaxKind.PropertyAccessExpression)
    .filter(
      (c: any) => c.expression.name.getText(source) === 'configureTestingModule'
    )
    .map(
      c =>
        c.arguments[0].kind === ts.SyntaxKind.ObjectLiteralExpression
          ? c.arguments[0]
          : null
    );

  if (configureTestingModuleObjectLiterals.length > 0) {
    const startPosition = configureTestingModuleObjectLiterals[0]
      .getFirstToken(source)
      .getEnd();
    return [
      new InsertChange(specPath, startPosition, `imports: [${symbolName}], `)
    ];
  } else {
    return [];
  }
}
