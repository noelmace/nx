import { updateJsonFile } from '../src/utils/file';
import {
  devKitCoreVersion,
  devKitSchematicsVersion,
  schematicsAngularVersion
} from '../src/lib-versions';

export default {
  description: 'Add @angular-devkit/schematics as a dev dependency',
  run: () => {
    updateJsonFile('package.json', json => {
      json.devDependencies = {
        ...json.devDependencies,
        ['@angular-devkit/schematics']: devKitSchematicsVersion,
        ['@schematics/angular']: schematicsAngularVersion
      };
    });
  }
};
