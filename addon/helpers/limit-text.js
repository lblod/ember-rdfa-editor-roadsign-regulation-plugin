import { helper } from '@ember/component/helper';

export default helper(function limitText([string]) {
  if (string.length > 140) {
    return string.slice(0, 140) + '...';
  } else {
    return string;
  }
});
