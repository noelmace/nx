#!/usr/bin/env node
import * as yargsParser from 'yargs-parser';
import { affected } from './affected';
import { format } from './format';
import { update } from './update';
import { patchNg } from './patch-ng';
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
const command = processedArgs._[2];
const args = process.argv.slice(3);

const commands = {
  'affected': affected,
  'dep-graph': (args) => generateGraph(yargsParser(args)),
  'format': format,
  'migrate': update, // TODO: delete this after 1.0
  'lint': new Lint().run,
  'update': update,
  'postinstall': postinstall,
  'workspace-schematic': workspaceSchematic
};

if (!commands[command]) {
  throw new Error(`Unrecognized command '${command}'`);
}

commands[command](args);
