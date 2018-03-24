/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as path from 'path';
import * as ts from 'typescript';
import { Tree } from '@angular-devkit/schematics';
import { getMatchingProperty } from '@nrwl/schematics/src/utils/ast/ast';
import { getImport } from '@nrwl/schematics/src/utils/ast/class';
import { getAppConfig } from '@nrwl/schematics/src/utils/ast/config';
import { toFileName } from '../name';

export function getBootstrapComponent(
  source: ts.SourceFile,
  moduleClassName: string
): string {
  const bootstrap = getMatchingProperty(source, 'bootstrap');
  if (!bootstrap) {
    throw new Error(`Cannot find bootstrap components in '${moduleClassName}'`);
  }
  const c = bootstrap.getChildren();
  const nodes = c[c.length - 1].getChildren();

  const bootstrapComponent = nodes.slice(1, nodes.length - 1)[0];
  if (!bootstrapComponent) {
    throw new Error(`Cannot find bootstrap components in '${moduleClassName}'`);
  }

  return bootstrapComponent.getText();
}

export function readBootstrapInfo(
  host: Tree,
  app: string
): {
  moduleSpec: string;
  modulePath: string;
  mainPath: string;
  moduleClassName: string;
  moduleSource: ts.SourceFile;
  bootstrapComponentClassName: string;
  bootstrapComponentFileName: string;
} {
  const config = getAppConfig(host, app);
  const mainPath = path.join(config.root, config.main);
  if (!host.exists(mainPath)) {
    throw new Error('Main file cannot be located');
  }

  const mainSource = host.read(mainPath)!.toString('utf-8');
  const main = ts.createSourceFile(
    mainPath,
    mainSource,
    ts.ScriptTarget.Latest,
    true
  );
  const moduleImports = getImport(
    main,
    (s: string) => s.indexOf('.module') > -1
  );
  if (moduleImports.length !== 1) {
    throw new Error(`main.ts can only import a single module`);
  }
  const moduleImport = moduleImports[0];
  const moduleClassName = moduleImport.bindings.filter(b =>
    b.endsWith('Module')
  )[0];

  const modulePath = `${path.join(
    path.dirname(mainPath),
    moduleImport.moduleSpec
  )}.ts`;
  if (!host.exists(modulePath)) {
    throw new Error(`Cannot find '${modulePath}'`);
  }

  const moduleSourceText = host.read(modulePath)!.toString('utf-8');
  const moduleSource = ts.createSourceFile(
    modulePath,
    moduleSourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const bootstrapComponentClassName = getBootstrapComponent(
    moduleSource,
    moduleClassName
  );
  const bootstrapComponentFileName = `./${path.join(
    path.dirname(moduleImport.moduleSpec),
    `${toFileName(
      bootstrapComponentClassName.substring(
        0,
        bootstrapComponentClassName.length - 9
      )
    )}.component`
  )}`;

  return {
    moduleSpec: moduleImport.moduleSpec,
    mainPath,
    modulePath,
    moduleSource,
    moduleClassName,
    bootstrapComponentClassName,
    bootstrapComponentFileName
  };
}
