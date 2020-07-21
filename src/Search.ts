import * as firebase from 'firebase/app';
import algoliasearch from 'algoliasearch';
import config from './firebase-config';
import debug from 'debug';

const {algolia} = config;
const log = debug('app:Search');

class Search {
  client?;
  index?;
  path: string;

  constructor(path = 'testruns') {
    this.path = path;
  }

  getIndex = async () => {
    try {
      this.client = algoliasearch(algolia.appId, algolia.apiKey);

      this.index = this.client!.initIndex('testruns');
      return this.index;
    } catch (err) {
      throw err;
    }
  };

  search = async (query: string) => {
    if (!this.index) {
      // ideally, we can fetch the index only if
      // the user is going to search something.
      // But this causes a weird (and delayed) UI experience
      // for now, so we need to call getIndex beforehand.
      await this.getIndex();
    }

    if (!this.index) {
      throw new Error('Index not defined');
    }

    log('query: %s', query);
    return this.index.search(query, {
      facets: ['branch'],
      highlightPreTag: '<b style="color: black;">',
      highlightPostTag: '</b>',
    });
  };

  searchInAttribute = async (attribute: string, query: string) => {
    if (!this.index) {
      // ideally, we can fetch the index only if
      // the user is going to search something.
      // But this causes a weird (and delayed) UI experience
      // for now, so we need to call getIndex beforehand.
      await this.getIndex();
    }

    if (!this.index) {
      throw new Error('Index not defined');
    }

    log('query: %s', query);

    return this.index.search(query, {
      facets: ['branch'],
      restrictSearchableAttributes: [attribute],
      highlightPreTag: '<b style="color: black;">',
      highlightPostTag: '</b>',
    });
  };
}

export default new Search();

export const testrunsSearch = new Search('testruns');
