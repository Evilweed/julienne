import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import config from './firebase-config';
import debug from 'debug';
import omitBy from 'lodash.omitby';
import isNil from 'lodash.isnil';
import {Result} from './enums/Result';
import {TestcaseIssue} from './EvaluationModal';
import {TestCase} from './TestRun';

const log = debug('app:db');

firebase.initializeApp(config);

export const db: firebase.firestore.Firestore = firebase.firestore();

type UserType = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL: string;
};

// db.enablePersistence({}).catch(function (err) {
//   console.error(err);
// });

export function getUserFields(user: UserType) {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export const getTestRunIDs = async (amount): Promise<string[]> =>
  await db
    .collection('testruns')
    .where('excluded', '==', false)
    .get()
    .then(snapshot => {
      const testRunIDs = [];
      const lengthOfIDsArray = snapshot.docs.length;
      const splicedIDsArray = snapshot.docs.slice(lengthOfIDsArray - amount, lengthOfIDsArray);
      splicedIDsArray.forEach(relation => {
        testRunIDs.push(relation.id);
      });
      return testRunIDs;
    });

export const getTestCaseIssueSortNames = async (): Promise<string[]> =>
  await db
    .collection('testcaseIssues')
    .where('type', '==', 'bug-in-test')
    .get()
    .then(snapshot => {
      const sortNames = [];
      snapshot.docs.forEach(relation => {
        sortNames.push((relation.data() as TestcaseIssue).testcaseSortName);
      });
      return sortNames;
    });

export const getTestRunTestcases = async (id: string): Promise<TestCase[]> =>
  await db
    .collection('testcases')
    .where('ciPipelineID', '==', id)
    .orderBy('sortName', 'asc')
    .get()
    .then(snapshot => {
      const testcases: TestCase[] = [];
      snapshot.docs.forEach(relation => {
        testcases.push({
          id: relation.id,
          ...relation.data(),
        } as TestCase);
      });
      return testcases;
    });

export interface AddTestCaseOptions {
  sortName: string;
  name: string;
  fixture: string;
  path: string;
  retryCount: number;
  testRunID?: string;
  executionTimes: string[];
  miscTimes: string[];
  status: Result;
}

export const addTestCase = (options: AddTestCaseOptions) => {
  log('save testcase: %o', options);
  return db.collection('testcases').add({
    ...omitBy(options, isNil),
    updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
  });
};

export interface UpdateTestCaseOptions {
  sortName?: string;
  name?: string;
  fixture?: string;
  path?: string;
  retryCount?: number;
  testRunID?: string;
  issueType?: string | null;
  externalIssueId?: string | null;
  executionTimes?: string[];
  miscTimes?: string[];
  status?: Result;
}

export const updateTestCase = (id: string, options: UpdateTestCaseOptions) => {
  log('save testcase: %o', options);
  return db
    .collection('testcases')
    .doc(id)
    .update({
      ...options,
      updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
    });
};

interface TimeFrame {
  from?: number;
  to?: number;
}

interface GetTestCaseCountProps {
  result: Result;
  retried?: boolean;
  time?: TimeFrame;
}

export const getTestCaseCount = ({
  result,
  retried,
  time,
}: GetTestCaseCountProps): Promise<number> => {
  const upperCasedResult = result.toUpperCase();
  let collection = db.collection('testcases').where('status', '==', upperCasedResult);

  if (retried) collection = collection.where('retryCount', '==', 2);

  if (time) {
    if (time.from) {
      collection = collection.where('createdAt', '>=', time.from);
    }
    if (time.to) {
      collection = collection.where('createdAt', '<=', time.to);
    }
  }

  return collection.get().then(snapshot => {
    // console.log(snapshot.size);
    return snapshot.size;
  });
};

export interface updateTestRunOptions {
  excluded?: boolean;
  excludeType: string;
}

export const updateTestRun = (id: string, options: updateTestRunOptions) => {
  log('save testcase: %o', options);
  return db
    .collection('testruns')
    .doc(id)
    .update({
      ...options,
      updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
    });
};

export interface HandleChangeTestCaseIssueTypeOptions {
  type: string | null;
  testcaseId: string;
  testcaseExternalIssueId: string | null;
  testcaseSortName: string | null;
}
//
// export const handleChangeTestCaseIssueType = (
//   id: string,
//   options: HandleChangeTestCaseIssueTypeOptions,
// ) => {
//   log('change testcaseIssue: %o', options);
//   const shouldRemoveIssue = !options.type || options.type.length === 0;
//   const issueDoesNotExist = !id;
//
//   if (shouldRemoveIssue) {
//     return removeTestCaseIssue(id).then(() =>
//       updateTestCase(options.testcaseId, {
//         externalIssueId: null,
//         issueType: null,
//         testcaseIssueId: null,
//       }),
//     );
//   }
//
//   if (issueDoesNotExist) {
//     return db
//       .collection('testcaseIssues')
//       .add({
//         ...omitBy(options, isNil),
//         updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
//       })
//       .then(testcaseIssue =>
//         updateTestCase(options.testcaseId, {
//           testcaseIssueType: options.type,
//           testcaseIssueId: testcaseIssue.id,
//           testcaseExternalIssueId: options.testcaseExternalIssueId,
//         }),
//       );
//   }
//
//   return db
//     .collection('testcaseIssues')
//     .doc(id)
//     .update({
//       ...omitBy(options, isNil),
//       updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
//     })
//     .then(() =>
//       updateTestCase(options.testcaseId, {
//         testcaseIssueType: options.type,
//         testcaseIssueId: id,
//         testcaseExternalIssueId: options.testcaseExternalIssueId,
//       }),
//     );
// };
//
export const removeTestCase = (id: string) => {
  log('delete: %s', id);
  return db.collection('testcases').doc(id).delete();
};
export const removeTestCaseIssue = (id: string) => {
  log('delete: %s', id);
  return db.collection('testcaseIssues').doc(id).delete();
};
