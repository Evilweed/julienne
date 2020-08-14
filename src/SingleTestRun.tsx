import * as React from 'react';
import {useSession, signOut} from './auth/auth';
import {EvaluationModal} from './EvaluationModal';
import {Link, useRoute} from 'wouter';
import {allowedUser} from './auth/allowed-user';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme, Button} from '@material-ui/core';
import {TestRuns} from './TestRuns';
import {MainProps} from './Main';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {useLocation} from 'wouter';

const useStyles = makeStyles((theme: Theme) => ({
  root: {},
}));

export const SingleTestRun: React.FunctionComponent<MainProps> = () => {
  const classes = useStyles();

  const user = useSession();
  const [, params] = useRoute('/pipeline/:ciPipelineID/:testCaseID?');
  const [, setLocation] = useLocation();

  if (!allowedUser(user)) {
    return <div></div>;
  }

  const onClickBackToMain = e => {
    e.preventDefault();
    setLocation('/main/');
  };

  return (
    <div>
      <div style={{height: '140px'}}>
        <Button
          onClick={onClickBackToMain}
          variant='contained'
          color='secondary'
          startIcon={<ArrowBackIcon />}
        >
          Back to main view
        </Button>
      </div>
      {params.testCaseID && <Overlay id={params.testCaseID} />}
      <TestRuns testRunsCount={1} searchedTestRuns={null} key='test-runs' />
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
