#!/usr/bin/env node
import * as yargsParser from 'yargs-parser';
import { affected } from './affected';
import Format from './format';
import { update } from './update';
import { workspaceSchematic } from './workspace-schematic';
import { generateGraph } from './dep-graph';
import { postinstall } from './postinstall';
import Lint from './lint';

const processedArgs = yargsParser(process.argv, {
  alias: {
    app: ['a']
  },
  string: ['app']
});
const commandStr = processedArgs._[2];
const args = process.argv.slice(3);

const commands = {
  'affected': affected,
  'dep-graph': (args) => generateGraph(yargsParser(args)),
  'format': new Format(),
  'migrate': update, // TODO: delete this after 1.0
  'lint': new Lint(),
  'update': update,
  'postinstall': postinstall,
  'workspace-schematic': workspaceSchematic
};

const commandToRun = commands[commandStr];

if (!commandToRun) {
  throw new Error(`Unrecognized command '${commandStr}'`);
}

if (typeof commandToRun === 'function') {
  commandToRun(args)
} else {
  commandToRun.run(args)
}
