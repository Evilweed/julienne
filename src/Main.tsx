import * as React from 'react';
import {useSession, signOut} from './auth/auth';
import {EvaluationModal} from './EvaluationModal';
import {Link, useRoute} from 'wouter';
import {allowedUser} from './auth/allowed-user';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {TestRuns} from './TestRuns';
import {TopBar} from './TopBar';

const useStyles = makeStyles((theme: Theme) => ({
  root: {},
}));

export interface MainProps {
  path?: string;
  id?: string;
}

export const Main: React.FunctionComponent<MainProps> = () => {
  const classes = useStyles();
  const [testRunsCount, setTestRunsCount] = React.useState<number>(1);
  const [searchedTestRuns, setSearchedTestRuns] = React.useState(null);

  const user = useSession();
  const [, params] = useRoute('/main/:testcase*');
  const testcaseIdInUrl = params.testcase;

  if (!allowedUser(user)) {
    return <div></div>;
  }

  return (
    <div>
      <TopBar setSearchedTestRuns={setSearchedTestRuns} testRunsCount={testRunsCount} setTestRunsCount={setTestRunsCount} />
      {testcaseIdInUrl && <Overlay id={testcaseIdInUrl} />}
      <TestRuns testRunsCount={testRunsCount} searchedTestRuns={searchedTestRuns} key='test-runs' />
    </div>
  );
};

interface OverlayProps {
  id?: string;
}

function Overlay({id}: OverlayProps) {
  if (!id) {
    return null;
  }

  return <EvaluationModal key='evaluation-modal' id={id} />;
}
