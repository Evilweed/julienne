import * as React from 'react';
import {useSession, signOut} from './auth/auth';
import {EvaluationModal} from './EvaluationModal';
import {useRoute} from 'wouter';
import {allowedUser} from './auth/allowed-user';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme, Button} from '@material-ui/core';
import {MainProps} from './Main';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {useLocation} from 'wouter';
import {TestRun} from './TestRun';
import {DebugLinks} from './common/DebugLinks';

const useStyles = makeStyles((theme: Theme) => ({
  root: {},
}));

export const SingleTestRun: React.FunctionComponent<MainProps> = () => {
  const classes = useStyles();

  const user = useSession();
  const [isPipelineTestRunPath, pipelinesUrlParams] = useRoute(
    '/pipeline/:ciPipelineID/:testCaseID?',
  );
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
      <div style={{height: '180px'}}>
        <Button
          onClick={onClickBackToMain}
          variant='contained'
          color='secondary'
          startIcon={<ArrowBackIcon />}
          style={{marginBottom: '10px'}}
        >
          Back to main view
        </Button>
        <DebugLinks pipelineRunID={pipelinesUrlParams.ciPipelineID} />
      </div>

      {pipelinesUrlParams.testCaseID && <Overlay id={pipelinesUrlParams.testCaseID} />}
      <TestRun key={pipelinesUrlParams.ciPipelineID} id={pipelinesUrlParams.ciPipelineID} />
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
