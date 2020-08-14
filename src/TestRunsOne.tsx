import * as React from 'react';
import {TestRun} from './TestRun';
import {useSession, signOut} from './auth/auth';
import {EvaluationModal} from './EvaluationModal';
import {Link, useRoute} from 'wouter';
import {allowedUser} from './auth/allowed-user';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {useDocument} from 'react-firebase-hooks/firestore';
import firebase from 'firebase';
import {db} from './db';
import {TestRunsProps} from './TestRuns';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    maxWidth: '600px',
    display: 'flex',
  },
}));

export const TestRunsOne: React.FunctionComponent<TestRunsProps> = ({
  testRunsCount,
  searchedTestRuns,
}) => {
  const classes = useStyles();
  const user = useSession();

  const pipelinesHref = `/main/pipelines/:ciPipelineID/:testCaseID?`;
  const [isPipelineTestRunPath, pipelinesUrlParams] = useRoute(pipelinesHref);

  console.log(`${isPipelineTestRunPath}`);
  console.log(`${JSON.stringify(pipelinesUrlParams, null, 2)}`);

  let query = db.collection('testruns').doc(pipelinesUrlParams.ciPipelineID);

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

  const {error, loading, value: testrunsDoc} = useDocument(query);

  if (loading || !testrunsDoc) {
    console.log('asdasdasadasd');
    return null;
  }

  return (
    <div className={classes.root}>
      <TestRun key={testrunsDoc.id} id={testrunsDoc.id} />
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
