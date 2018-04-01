import { getProjectNodes, readCliConfig, allFilesInDir } from './shared';
import { WorkspaceIntegrityChecks } from './workspace-integrity-checks';
import * as appRoot from 'app-root-path';
import * as path from 'path';
import * as fs from 'fs';
import { Command, Option } from './models';

export default class Lint extends Command {
  readAllFilesFromAppsAndLibs() {
    return [
      ...allFilesInDir(`${appRoot.path}/apps`),
      ...allFilesInDir(`${appRoot.path}/libs`)
    ].filter(f => !path.basename(f).startsWith('.'));
  }

  run(options: any) {
    const nodes = getProjectNodes(readCliConfig());
    const packageJson = JSON.parse(
      fs.readFileSync(`${appRoot.path}/package.json`, 'utf-8')
    );

    const errorGroups = new WorkspaceIntegrityChecks(
      nodes,
      this.readAllFilesFromAppsAndLibs(),
      packageJson
    ).run();
    if (errorGroups.length > 0) {
      errorGroups.forEach(g => {
        console.error(`${g.header}:`);
        g.errors.forEach(e => console.error(e));
        console.log('');
      });
      process.exit(1);
    }
  }

  name= 'lint';
  description = 'lint';
  arguments = [];
  options = [];
}
