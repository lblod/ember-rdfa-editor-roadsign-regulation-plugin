import Component from '@glimmer/component';

export default class RoadsignsPagination extends Component {
  get pageStart() {
    return this.args.pageStart + 1;
  }

  get pageEnd() {
    return this.args.pageEnd + 1;
  }

  get count() {
    return this.args.count;
  }
}
