/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import { Tree } from '@angular-devkit/schematics';
import { Change, InsertChange } from '@schematics/angular/utility/change';

export function addIncludeToTsConfig(
  tsConfigPath: string,
  source: ts.SourceFile,
  include: string
): Change[] {
  const includeKeywordPos = source.text.indexOf('"include":');
  if (includeKeywordPos > -1) {
    const includeArrayEndPos = source.text.indexOf(']', includeKeywordPos);
    return [new InsertChange(tsConfigPath, includeArrayEndPos, include)];
  } else {
    return [];
  }
}

export function getAppConfig(host: Tree, name: string): any {
  if (!host.exists('.angular-cli.json')) {
    throw new Error('Missing .angular-cli.json');
  }
  const angularCliJson = JSON.parse(
    host.read('.angular-cli.json')!.toString('utf-8')
  );
  const apps = angularCliJson.apps;
  if (!apps || apps.length === 0) {
    throw new Error(`Cannot find app '${name}'`);
  }
  if (name) {
    const appConfig = apps.filter(a => a.name === name)[0];
    if (!appConfig) {
      throw new Error(`Cannot find app '${name}'`);
    } else {
      return appConfig;
    }
  }
  return apps[0];
}
