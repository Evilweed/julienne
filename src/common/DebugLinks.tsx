import * as React from 'react';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme, Link, Button, Typography} from '@material-ui/core';
import {orange} from '@material-ui/core/colors';
import moment from 'moment';
import {db} from '../db';
import {useDocument} from 'react-firebase-hooks/firestore';

const useStyles = makeStyles((theme: Theme) => ({
  zeroRetries: {},
  retriesDetected: {
    backgroundColor: orange[500],
    color: 'white',
  },
  white: {
    color: 'white',
  },
}));

export interface RetryCountProps {
  pipelineRunID: string;
}

export const DebugLinks: React.FunctionComponent<RetryCountProps> = ({pipelineRunID}) => {
  const classes = useStyles();
  const editorJsProjectID = '5256985';
  const creatorJsProjectID = '1421172';
  const creatorRailsProjectID = '1421162';
  const landingJsProjectID = '1421097';
  const landingPhpProjectID = '1420171';

  const {value: testRunDoc, loading, error} = useDocument(
    db.collection('testruns').doc(pipelineRunID),
  );

  if (loading || error) {
    return null;
  }
  const createdAt = testRunDoc.get('createdAt');
  const updatedAt = testRunDoc.get('updatedAt');
  const serverName = testRunDoc.get('serverName');

  if (!createdAt || !updatedAt || !serverName) {
    return null;
  }

  const sentryEnv = `dev-${serverName}`;
  const herokuAppName =
    testRunDoc.get('serverName') === 'staging' ? 'ph-staging-app' : `${serverName}-ph-dev-app`;

  const startTimeForSentry = moment(new Date(createdAt), 'YYYY-MM-DDTHH:mm')
    .subtract('10', 'minutes')
    .toISOString();
  const endTimeForSentry = moment(new Date(updatedAt), 'YYYY-MM-DDTHH:mm').toISOString();
  const startTimeForDataDog = new Date(createdAt).setMinutes(new Date(createdAt).getMinutes() - 10);
  const endTimeForDataDog = new Date(updatedAt).valueOf();

  const sentryProjectsUrlPart = `&project=${editorJsProjectID}&project=${creatorJsProjectID}&project=${creatorRailsProjectID}&project=${landingJsProjectID}&project=${landingPhpProjectID}`;
  const sentryIssuesDebugLink = () =>
    `https://sentry.io/organizations/zapakuj-to/issues/?environment=${sentryEnv}${sentryProjectsUrlPart}&query=is%3Aunresolved+event.timestamp%3A%3E%3D${startTimeForSentry}+event.timestamp%3A%3C${endTimeForSentry}`;

  const renderSentryDebugLink = () => {
    return (
      <Button
        style={{marginRight: '5px'}}
        variant='contained'
        color='primary'
        href={`${sentryIssuesDebugLink()}`}
        target='_blank'
      >
        Sentry
      </Button>
    );
  };

  let dataDogServerDebugLink = `https://app.datadoghq.com/logs?cols=&from_ts=${startTimeForDataDog}&index=main&live=true&messageDisplay=expanded-lg&stream_sort=desc&to_ts=${endTimeForDataDog}&query=host%3A${herokuAppName}%20status%3Aerror`;

  return (
    <div>
      <div>
        <Typography variant='subtitle2'>Sentry & DataDog debug links</Typography>
        {renderSentryDebugLink()}
        <Button variant='contained' color='primary' href={dataDogServerDebugLink} target='_blank'>
          DataDog
        </Button>
      </div>
    </div>
  );
};
