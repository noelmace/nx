import { asap } from 'rxjs/scheduler/asap';

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import {
  findNodes,
  getSourceNodes
} from '@schematics/angular/utility/ast-utils';
import {
  NoopChange,
  Change,
  InsertChange
} from '@schematics/angular/utility/change';
import { insertAfterLastOccurrence } from '@ngrx/schematics/src/utility/ast-utils';

import { offset } from './ast';

export function addParameterToConstructor(
  source: ts.SourceFile,
  modulePath: string,
  opts: { className: string; param: string }
): Change[] {
  const clazz = findClass(source, opts.className);
  const constructor = clazz.members.filter(
    m => m.kind === ts.SyntaxKind.Constructor
  )[0];
  if (constructor) {
    throw new Error('Should be tested');
  } else {
    const methodHeader = `constructor(${opts.param})`;
    return addMethod(source, modulePath, {
      className: opts.className,
      methodHeader,
      body: null
    });
  }
}

export function addMethod(
  source: ts.SourceFile,
  modulePath: string,
  opts: { className: string; methodHeader: string; body: string }
): Change[] {
  const clazz = findClass(source, opts.className);
  const body = opts.body
    ? `
${opts.methodHeader} {
${offset(opts.body, 1, false)}
}
`
    : `
${opts.methodHeader} {}
`;

  const pos = clazz.members.length > 0 ? clazz.members.end : clazz.end - 1;
  return [new InsertChange(modulePath, clazz.end - 1, offset(body, 1, true))];
}

function findClass(
  source: ts.SourceFile,
  className: string,
  silent: boolean = false
): ts.ClassDeclaration {
  const nodes = getSourceNodes(source);

  const clazz = <any>nodes.filter(
    n =>
      n.kind === ts.SyntaxKind.ClassDeclaration &&
      (<any>n).name.text === className
  )[0];

  if (!clazz && !silent) {
    throw new Error(`Cannot find class '${className}'`);
  }

  return clazz;
}

export function addClass(
  source: ts.SourceFile,
  modulePath: string,
  clazzName: string,
  clazzSrc: string
): Change {
  if (!findClass(source, clazzName, true)) {
    const nodes = findNodes(source, ts.SyntaxKind.ClassDeclaration);
    return insertAfterLastOccurrence(
      nodes,
      offset(clazzSrc, 1, true),
      modulePath,
      0,
      ts.SyntaxKind.ClassDeclaration
    );
  }
  return new NoopChange();
}

/**
 * Find Enum declaration in source based on name
 * e.g.
 *    export enum ProductsActionTypes {
 *       ProductsAction = '[Products] Action'
 *    }
 */
function getEnum(
  source: ts.SourceFile,
  predicate: (a: any) => boolean
): ts.EnumDeclaration {
  const allEnums = findNodes(source, ts.SyntaxKind.EnumDeclaration);
  const matching = allEnums.filter((i: ts.EnumDeclaration) =>
    predicate(i.name.getText())
  );
  return matching.length ? (matching[0] as ts.EnumDeclaration) : undefined;
}

export interface NameValue {
  name: string;
  value?: string;
}

/**
 * Add 1..n enumerators using name + (optional) value pairs
 */
export function addEnumeratorValues(
  source: ts.SourceFile,
  modulePath: string,
  enumName: string,
  pairs: NameValue[] = []
): Change[] {
  const target = getEnum(source, name => name === enumName);
  const list = target ? target.members : undefined;

  if (!target) {
    throw new Error(`Cannot find enum '${enumName}'`);
  }

  return pairs.reduce((buffer, it) => {
    const addComma = !(list.hasTrailingComma || list.length === 0);
    const member = it.value ? `${it.name} = '${it.value}'` : it.name;
    const memberExists = () => {
      return list.filter(m => m.name.getText() === it.name).length;
    };

    if (memberExists()) {
      throw new Error(`Enum '${enumName}.${it.name}' already exists`);
    }

    return [
      ...buffer,
      new InsertChange(modulePath, list.end, (addComma ? ', ' : '') + member)
    ];
  }, []);
}

/**
 * Find the `import ...` that matches the predicate conditions
 */
export function getImport(
  source: ts.SourceFile,
  predicate: (a: any) => boolean
): { moduleSpec: string; bindings: string[] }[] {
  const allImports = findNodes(source, ts.SyntaxKind.ImportDeclaration);
  const matching = allImports.filter((i: ts.ImportDeclaration) =>
    predicate(i.moduleSpecifier.getText())
  );

  return matching.map((i: ts.ImportDeclaration) => {
    const moduleSpec = i.moduleSpecifier
      .getText()
      .substring(1, i.moduleSpecifier.getText().length - 1);
    const t = i.importClause.namedBindings.getText();
    const bindings = t
      .replace('{', '')
      .replace('}', '')
      .split(',')
      .map(q => q.trim());
    return { moduleSpec, bindings };
  });
}

export function addGlobal(
  source: ts.SourceFile,
  modulePath: string,
  statement: string
): Change[] {
  const allImports = findNodes(source, ts.SyntaxKind.ImportDeclaration);
  if (allImports.length > 0) {
    const lastImport = allImports[allImports.length - 1];
    return [
      new InsertChange(modulePath, lastImport.end + 1, `\n${statement}\n`)
    ];
  } else {
    return [new InsertChange(modulePath, 0, `${statement}\n`)];
  }
}
