import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import fetchRoadsignsData from '../utils/fetchData';

export default class RoadsignRegulationCard extends Component {
  @tracked typeOptions = [];
  @tracked typeSelected = '';

  @tracked categoryOptions = [];
  @tracked categorySelected = '';

  @tracked tableData = [];

  constructor() {
    super(...arguments);
    this.fetchData.perform();
  }

  @action
  select() {
    console.log('select');
  }

  @task
  *fetchData() {
    this.tableData = yield fetchRoadsignsData();
    // this.tableData = [
    //   {
    //     id: 1,
    //     code: 'B1',
    //     image: 'photo',
    //     description: 'blah blah',
    //     category: 'abc',
    //   },
    //   {
    //     id: 2,
    //     code: 'B1 + M1',
    //     image: 'photo',
    //     description: 'blah blah',
    //     category: 'abc',
    //   },
    //   {
    //     id: 3,
    //     code: 'E9a-rolstoel',
    //     image: 'photo',
    //     description: 'blah blah',
    //     category: 'abc',
    //   },
    //   {
    //     id: 4,
    //     code: 'E9a',
    //     image: 'photo',
    //     description: 'blah blah',
    //     category: 'abc',
    //   },
    // ];
    // yield;
  }
}
