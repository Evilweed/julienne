import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './db';
import 'focus-visible';
ReactDOM.render(<App />, document.getElementById('root'));

// import {db} from './db';

// const algoliasearch = require('algoliasearch');
// const dotenv = require('dotenv');

// load values from the .env file in this directory into process.env

// configure algolia
// const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
// const index = algolia.initIndex(ALGOLIA_INDEX_NAME);

// serviceWorker.register();
// // "129379591", "129220527", "129215828"
// db
//       .collection('testcases')
//       .where('ciPipelineID', '==', '129220527').get().then((asd) => console.log(asd));

// db
//       .collection('testcases')
//       .where('ciPipelineID', '==', '129215828').get().then((asd) => console.log(asd));

// db
//       .collection('testcases')
//       .where('ciPipelineID', '==', '129379591').get().then((asd) => console.log('aaa',asd));

// console.log(
//   process.env.ALGOLIA_APP_ID,
//   process.env.ALGOLIA_API_KEY,
//   process.env.ALGOLIA_INDEX_NAME,
// );
//
// db.collection('testruns')
//   .get()
//   .then(docs => {
//     const arr = [];
//     docs.forEach(doc => {
//       const data = doc.data();
//       data.objectID = doc.id;
//       arr.push(data);
//     });
//
//     const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
//     const index = client.initIndex(ALGOLIA_INDEX_NAME);
//
//     index.saveObjects(arr, (err, content) => {
//       if (err) console.log(err);
//
//       console.log('ok');
//     });
//   });
