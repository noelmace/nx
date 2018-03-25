import {
  apply,
  branchAndMerge,
  chain,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import {
  getBootstrapComponent,
  readBootstrapInfo
} from '@nrwl/schematics/src/utils/ast/bootstrap';
import {
  addMethod,
  addParameterToConstructor
} from '@nrwl/schematics/src/utils/ast/class';
import {
  addDeclarationToModule,
  addEntryComponents,
  addImportToModule,
  addProviderToModule,
  removeFromNgModule
} from '@nrwl/schematics/src/utils/ast/module';

import {
  names,
  toClassName,
  toFileName,
  toPropertyName
} from '../../utils/name';
import * as path from 'path';
import * as ts from 'typescript';
import { insert } from '../../utils/ast/ast';
import { insertImport } from '@schematics/angular/utility/route-utils';
import { Schema } from './schema';
import { angularJsVersion } from '../../lib-versions';
import { addUpgradeToPackageJson } from '../../utils/common';
import { wrapIntoFormat } from '../../utils/tasks';

function addImportsToModule(options: Schema): Rule {
  return (host: Tree) => {
    const { moduleClassName, modulePath, moduleSource } = readBootstrapInfo(
      host,
      options.app
    );

    insert(host, modulePath, [
      insertImport(
        moduleSource,
        modulePath,
        `configure${toClassName(options.name)}, upgradedComponents`,
        `../${toFileName(options.name)}-setup`
      ),
      insertImport(
        moduleSource,
        modulePath,
        'UpgradeModule',
        '@angular/upgrade/static'
      ),
      ...addImportToModule(moduleSource, modulePath, 'UpgradeModule'),
      ...addDeclarationToModule(
        moduleSource,
        modulePath,
        '...upgradedComponents'
      ),
      ...addEntryComponents(
        moduleSource,
        modulePath,
        getBootstrapComponent(moduleSource, moduleClassName)
      )
    ]);

    return host;
  };
}

function addNgDoBootstrapToModule(options: Schema): Rule {
  return (host: Tree) => {
    const { moduleClassName, modulePath, moduleSource } = readBootstrapInfo(
      host,
      options.app
    );

    insert(host, modulePath, [
      ...addParameterToConstructor(moduleSource, modulePath, {
        className: moduleClassName,
        param: 'private upgrade: UpgradeModule'
      }),
      ...addMethod(moduleSource, modulePath, {
        className: moduleClassName,
        methodHeader: 'ngDoBootstrap(): void',
        body: `
configure${toClassName(options.name)}(this.upgrade.injector);
this.upgrade.bootstrap(document.body, ['downgraded', '${options.name}']);
        `
      }),
      ...removeFromNgModule(moduleSource, modulePath, 'bootstrap')
    ]);

    return host;
  };
}

function createFiles(angularJsImport: string, options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const {
      moduleClassName,
      mainPath,
      moduleSpec,
      bootstrapComponentClassName,
      bootstrapComponentFileName
    } = readBootstrapInfo(host, options.app);

    const dir = path.dirname(mainPath);
    const templateSource = apply(url('./files'), [
      template({
        ...options,
        tmpl: '',
        moduleFileName: moduleSpec,
        moduleClassName,
        angularJsImport,
        angularJsModule: options.name,
        bootstrapComponentClassName,
        bootstrapComponentFileName,
        ...names(options.name)
      }),
      move(dir)
    ]);
    const r = branchAndMerge(chain([mergeWith(templateSource)]));
    return r(host, context);
  };
}

export default function(options: Schema): Rule {
  return wrapIntoFormat(() => {
    const angularJsImport = options.angularJsImport
      ? options.angularJsImport
      : options.name;

    return chain([
      createFiles(angularJsImport, options),
      addImportsToModule(options),
      addNgDoBootstrapToModule(options),
      options.skipPackageJson ? noop() : addUpgradeToPackageJson()
    ]);
  });
}
