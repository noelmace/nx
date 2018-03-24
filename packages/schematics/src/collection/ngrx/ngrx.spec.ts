import * as path from 'path';
import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

import {
  createApp,
  createEmptyWorkspace,
  getAppConfig
} from '../../utils/testing';
import { findModuleParent } from '../../utils/name';

describe('ngrx', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nrwl/schematics',
    path.join(__dirname, '../../collection.json')
  );

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
    appTree = createApp(appTree, 'myapp');
  });

  it('should create the ngrx files', () => {
    const appConfig = getAppConfig();
    const hasFile = file => expect(tree.exists(file)).toBeTruthy();
    const tree = schematicRunner.runSchematic(
      'ngrx',
      {
        name: 'user',
        module: appConfig.appModule
      },
      appTree
    );
    // tree.visit((path) => console.log(path));

    const statePath = `${findModuleParent(appConfig.appModule)}/+state`;

    hasFile(`${statePath}/user.actions.ts`);
    hasFile(`${statePath}/user.effects.ts`);
    hasFile(`${statePath}/user.effects.spec.ts`);
    hasFile(`${statePath}/user.reducer.ts`);
    hasFile(`${statePath}/user.reducer.spec.ts`);
    hasFile(`${statePath}/user.init.ts`);
    hasFile(`${statePath}/user.interfaces.ts`);
  });

  it('should create ngrx action enums', () => {
    const appConfig = getAppConfig();
    const tree = schematicRunner.runSchematic(
      'ngrx',
      {
        name: 'user',
        module: appConfig.appModule
      },
      appTree
    );

    const statePath = `${findModuleParent(appConfig.appModule)}/+state`;
    const content = getFileContent(tree, `${statePath}/user.actions.ts`);

    expect(content).toContain('UserActionTypes');
    expect(content).toContain("LoadData = '[User] Load Data'");
    expect(content).toContain("DataLoaded = '[User] Data Loaded'");
  });
});
