import { patchNg } from './patch-ng';
import { update } from './update';

export function postinstall() {
  patchNg();
  update(['check']);
}
