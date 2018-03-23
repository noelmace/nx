import {
  apply,
  branchAndMerge,
  chain,
  externalSchematic,
  SchematicContext,
  mergeWith,
  move,
  noop,
  Rule,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';

import {
  findModuleParent,
  names,
  toClassName,
  toFileName,
  toPropertyName
} from '../../utils/name-utils';
import * as path from 'path';
import * as ts from 'typescript';
import {
  addImportToModule,
  addProviderToModule,
  insert
} from '../../utils/ast-utils';
import { insertImport } from '@schematics/angular/utility/route-utils';
import { NgrxOptions } from './schema';
import {
  ngrxVersion,
  routerStoreVersion,
  ngrxStoreFreezeVersion
} from '../../lib-versions';
import { serializeJson } from '../../utils/fileutils';
import { wrapIntoFormat } from '../../utils/tasks';

function addImportsToModule(name: string, options: NgrxOptions): Rule {
  return (host: Tree) => {
    if (options.onlyAddFiles) {
      return host;
    }

    if (!host.exists(options.module)) {
      throw new Error('Specified module does not exist');
    }

    const modulePath = options.module;

    const sourceText = host.read(modulePath)!.toString('utf-8');
    const source = ts.createSourceFile(
      modulePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    if (options.onlyEmptyRoot) {
      insert(host, modulePath, [
        insertImport(source, modulePath, 'StoreModule', '@ngrx/store'),
        insertImport(source, modulePath, 'EffectsModule', '@ngrx/effects'),
        insertImport(
          source,
          modulePath,
          'StoreDevtoolsModule',
          '@ngrx/store-devtools'
        ),
        insertImport(
          source,
          modulePath,
          'environment',
          '../environments/environment'
        ),
        insertImport(
          source,
          modulePath,
          'StoreRouterConnectingModule',
          '@ngrx/router-store'
        ),
        insertImport(source, modulePath, 'storeFreeze', 'ngrx-store-freeze'),
        ...addImportToModule(
          source,
          modulePath,
          `StoreModule.forRoot({},{metaReducers: !environment.production ? [storeFreeze] : []})`
        ),
        ...addImportToModule(source, modulePath, `EffectsModule.forRoot([])`),
        ...addImportToModule(
          source,
          modulePath,
          `!environment.production ? StoreDevtoolsModule.instrument() : []`
        ),
        ...addImportToModule(source, modulePath, `StoreRouterConnectingModule`)
      ]);
      return host;
    } else {
      const reducerPath = `./${toFileName(options.directory)}/${toFileName(
        name
      )}.reducer`;
      const effectsPath = `./${toFileName(options.directory)}/${toFileName(
        name
      )}.effects`;
      const initPath = `./${toFileName(options.directory)}/${toFileName(
        name
      )}.init`;

      const reducerName = `${toPropertyName(name)}Reducer`;
      const effectsName = `${toClassName(name)}Effects`;
      const initName = `${toPropertyName(name)}InitialState`;

      const common = [
        insertImport(source, modulePath, 'StoreModule', '@ngrx/store'),
        insertImport(source, modulePath, 'EffectsModule', '@ngrx/effects'),
        insertImport(source, modulePath, reducerName, reducerPath),
        insertImport(source, modulePath, initName, initPath),
        insertImport(source, modulePath, effectsName, effectsPath),
        ...addProviderToModule(source, modulePath, effectsName)
      ];

      if (options.root) {
        insert(host, modulePath, [
          ...common,
          insertImport(
            source,
            modulePath,
            'StoreDevtoolsModule',
            '@ngrx/store-devtools'
          ),
          insertImport(
            source,
            modulePath,
            'environment',
            '../environments/environment'
          ),
          insertImport(
            source,
            modulePath,
            'StoreRouterConnectingModule',
            '@ngrx/router-store'
          ),
          insertImport(source, modulePath, 'storeFreeze', 'ngrx-store-freeze'),
          ...addImportToModule(
            source,
            modulePath,
            `StoreModule.forRoot({${toPropertyName(name)}: ${reducerName}}, {
              initialState: {${toPropertyName(name)}: ${initName}},
              metaReducers: !environment.production ? [storeFreeze] : []
            })`
          ),
          ...addImportToModule(
            source,
            modulePath,
            `EffectsModule.forRoot([${effectsName}])`
          ),
          ...addImportToModule(
            source,
            modulePath,
            `!environment.production ? StoreDevtoolsModule.instrument() : []`
          ),
          ...addImportToModule(
            source,
            modulePath,
            `StoreRouterConnectingModule`
          )
        ]);
      } else {
        insert(host, modulePath, [
          ...common,
          ...addImportToModule(
            source,
            modulePath,
            `StoreModule.forFeature('${toPropertyName(
              name
            )}', ${reducerName}, {initialState: ${initName}})`
          ),
          ...addImportToModule(
            source,
            modulePath,
            `EffectsModule.forFeature([${effectsName}])`
          )
        ]);
      }

      return host;
    }
  };
}

function addNgRxToPackageJson() {
  return (host: Tree) => {
    if (!host.exists('package.json')) return host;

    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json['dependencies']) {
      json['dependencies'] = {};
    }

    if (!json['dependencies']['@ngrx/store']) {
      json['dependencies']['@ngrx/store'] = ngrxVersion;
    }
    if (!json['dependencies']['@ngrx/effects']) {
      json['dependencies']['@ngrx/effects'] = ngrxVersion;
    }
    if (!json['dependencies']['@ngrx/entity']) {
      json['dependencies']['@ngrx/entity'] = ngrxVersion;
    }
    if (!json['dependencies']['@ngrx/store-devtools']) {
      json['dependencies']['@ngrx/store-devtools'] = ngrxVersion;
    }
    if (!json['dependencies']['@ngrx/router-store']) {
      json['dependencies']['@ngrx/router-store'] = routerStoreVersion;
    }
    if (!json['dependencies']['ngrx-store-freeze']) {
      json['dependencies']['ngrx-store-freeze'] = ngrxStoreFreezeVersion;
    }

    host.overwrite('package.json', serializeJson(json));
    return host;
  };
}

export default function(_options: NgrxOptions): Rule {
  return wrapIntoFormat((context: SchematicContext) => {
    const options = normalizeOptions(_options);
    const sourceDir = findModuleParent(options.module);

    return chain([
      externalSchematic('@ngrx/schematics', 'feature', {
        name: options.name,
        sourceDir: './',
        flat: false
      }),
      move(`app/${options.name}`, path.join(sourceDir, '+state'))
    ]);
  });
}

/**
 * Extract the parent 'directory' for the specified
 */
function normalizeOptions(options: NgrxOptions): NgrxOptions {
  return { ...options, directory: toFileName(options.directory) };
}
