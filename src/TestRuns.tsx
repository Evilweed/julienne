import * as React from 'react';
import {TestRun} from './TestRun';
import {useSession, signOut} from './auth/auth';
import {EvaluationModal} from './EvaluationModal';
import {Link, useRoute} from 'wouter';
import {allowedUser} from './auth/allowed-user';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {useCollection} from 'react-firebase-hooks/firestore';
import firebase from 'firebase';
import {db} from './db';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    maxWidth: '600px',
    display: 'flex',
  },
}));

export interface TestRunsProps {
  id?: string;
  testRunsCount: number;
  searchedTestRuns: Array<any>;
}

export const TestRuns: React.FunctionComponent<TestRunsProps> = ({
  testRunsCount,
  searchedTestRuns,
}) => {
  const classes = useStyles();
  const user = useSession();

  if (!allowedUser(user)) {
    return <div></div>;
  }

  React.useEffect(() => {
    const unsubscribe = () => {
      console.log('searchedTestRuns');
      console.log(searchedTestRuns);
      if (searchedTestRuns)
        searchedTestRuns
          .slice(0, testRunsCount - 1)
          .map(searchedTestRun => console.log(searchedTestRun));
    };
    unsubscribe();
    return () => unsubscribe();
  }, [searchedTestRuns]);

  const {error, loading, value: testrunsDoc} = useCollection(
    db
      .collection('testruns')
      // .where('excluded', '==', false)
      .orderBy('ciPipelineID', 'desc')
      .limit(testRunsCount),
  );

  if (loading || !testrunsDoc) {
    return null;
  }

  const reversedTestruns = () => {
    let testRunIds = [];
    testrunsDoc.docs.forEach(asd => testRunIds.push(asd.id));
    testRunIds = testRunIds.reverse();
    return testRunIds;
  };

  return (
    <div className={classes.root}>
      {searchedTestRuns
        ? searchedTestRuns
            .slice(0, testRunsCount)
            .map(searchedTestRun => (
              <TestRun key={searchedTestRun.ciPipelineID} id={searchedTestRun.ciPipelineID} />
            ))
        : reversedTestruns().map(id => <TestRun key={id} id={id} />)}
    </div>
  );
};

// import {useEffect, useState} from 'react';
// import {getTestCaseIssueSortNames, getTestRunIDs} from './db';
// const [testRunIDs, setTestRunIDs] = useState([]);
// useEffect(() => {
//   if (testRunIDs.length === 0) getTestRunIDs().then(ids => setTestRunIDs(ids));
// });

// useEffect(() => {
//   const testRunsAmount = 10;
//   if (testRunIDs.length === 0) {
//     getTestRunIDs(testRunsAmount).then(ids => setTestRunIDs(ids));
//   }
//   const interval = setInterval(async () => {
//     console.log('Main:interval');
//     getTestRunIDs(testRunsAmount).then(ids => setTestRunIDs(ids));
//   }, 920000);
//   return () => clearInterval(interval);
// }, []);
