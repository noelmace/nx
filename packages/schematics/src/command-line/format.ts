import { execSync } from 'child_process';
import * as path from 'path';
import * as resolve from 'resolve';
import { getProjectRoots, getTouchedProjects, parseFiles } from './shared';
import { Command, Option, RootCommand } from '@nrwl/schematics/src/command-line/models';

export class FormatWrite extends Command {

  name = 'format write';
  description = 'format write';
  arguments = [];
  options = [];

  run(patterns: string[]) {
    if (patterns.length > 0) {
      execSync(`node "${prettierPath()}" --write ${patterns.join(' ')}`, {
        stdio: [0, 1, 2]
      });
    }
  }
}

export class FormatCheck extends Command {
  name: string;
  description: string;
  subCommands = {};
  arguments = [];
  options = [];

  run(patterns: string[]) {
    if (patterns.length > 0) {
      try {
        execSync(
          `node "${prettierPath()}" --list-different ${patterns.join(' ')}`,
          {
            stdio: [0, 1, 2]
          }
        );
      } catch (e) {
        process.exit(1);
      }
    }
  }
}

export default class Format extends RootCommand {

  subCommands = {
    'write': new FormatWrite(),
    'check': new FormatCheck(),
  };

  name = 'format';
  description = 'format';
  arguments: string[];
  options: Option[];

  run(args: any) {
    const subCommand = args[0];
    let patterns: string[];

    try {
      patterns = this.getPatterns(args);
    } catch (e) {
      // FIXME : unreachable code
      this.printError(subCommand, e);
      process.exit(1);
    }

    if(!this.subCommands[subCommand]) {
      // TODO : error handling
      this.printError(subCommand, new Error(`Unrecognized 'format' subcommand '${subCommand}'`));
      process.exit
    }

    this.subCommands[subCommand].run(patterns);
  }

  private getPatterns(args: string[]) {
    try {
      const p = parseFiles(args.slice(1));
      let patterns = p.files.filter(f => path.extname(f) === '.ts');
      let rest = p.rest;

      const libsAndApp = rest.filter(a => a.startsWith('--libs-and-apps'))[0];
      return libsAndApp ? this.getPatternsFromApps(patterns) : patterns;
    } catch (e) {
      return ['"{apps,libs}/**/*.ts"'];
    }
  }

  private printError(command: string, e: any) {
    console.error(
      `Pass the SHA range, as follows: npm run format:${command} -- SHA1 SHA2.`
    );
    console.error(
      `Or pass the list of files, as follows: npm run format:${command} -- --files="libs/mylib/index.ts,libs/mylib2/index.ts".`
    );
    console.error(e.message);
  }

  private getPatternsFromApps(affectedFiles: string[]): string[] {
    const roots = getProjectRoots(getTouchedProjects(affectedFiles));
    if (roots.length === 0) {
      return [];
    } else if (roots.length === 1) {
      return [`\"${roots[0]}/**/*.ts\"`];
    } else {
      return [`\"{${roots.join(',')}}/**/*.ts\"`];
    }
  }

}

function prettierPath() {
  const basePath = path.dirname(
    resolve.sync('prettier', { basedir: __dirname })
  );
  return path.join(basePath, 'bin-prettier.js');
}
