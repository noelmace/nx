/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import { Change, InsertChange } from '@schematics/angular/utility/change';
import { getMatchingProperty } from './ast';

export function addRoute(
  ngModulePath: string,
  source: ts.SourceFile,
  route: string
): Change[] {
  const routes = getListOfRoutes(source);
  if (!routes) return [];

  if (routes.hasTrailingComma || routes.length === 0) {
    return [new InsertChange(ngModulePath, routes.end, route)];
  } else {
    return [new InsertChange(ngModulePath, routes.end, `, ${route}`)];
  }
}

function getListOfRoutes(source: ts.SourceFile): ts.NodeArray<ts.Expression> {
  const imports: any = getMatchingProperty(source, 'imports');

  if (imports.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression) {
    const a = imports.initializer as ts.ArrayLiteralExpression;

    for (let e of a.elements) {
      if (e.kind === 181) {
        const ee = e as ts.CallExpression;
        const text = ee.expression.getText(source);
        if (
          (text === 'RouterModule.forRoot' ||
            text === 'RouterModule.forChild') &&
          ee.arguments.length > 0
        ) {
          const routes = ee.arguments[0];
          if (routes.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            return (routes as ts.ArrayLiteralExpression).elements;
          }
        }
      }
    }
  }
  return null;
}
