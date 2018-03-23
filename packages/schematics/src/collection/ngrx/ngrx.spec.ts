import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Tree, VirtualTree } from '@angular-devkit/schematics';
import {
  createApp,
  createEmptyWorkspace,
  getAppConfig
} from '../../utils/testing-utils';
import { findModuleParent } from '../../utils/name-utils';

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
    const tree = schematicRunner.runSchematic(
      'ngrx',
      {
        name: 'user',
        module: appConfig.appModule
      },
      appTree
    );
    const hasFile = file => {
      expect(tree.exists(file)).toBeTruthy();
    };

    // tree.visit((path) => {
    //   console.log(path);
    // });

    const statePath = `${findModuleParent(appConfig.appModule)}/+state`;

    hasFile(`${statePath}/user.actions.ts`);
    hasFile(`${statePath}/user.effects.ts`);
    hasFile(`${statePath}/user.effects.spec.ts`);
    // hasFile(`${statePath}/user.init.ts`);
    // hasFile(`${statePath}/user.interfaces.ts`);
    hasFile(`${statePath}/user.reducer.ts`);
    hasFile(`${statePath}/user.reducer.spec.ts`);
  });
});
