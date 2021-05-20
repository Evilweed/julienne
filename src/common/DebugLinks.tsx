import * as React from 'react';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme, Typography, createStyles, List, ListItem, ListItemText, ListItemAvatar, Avatar} from '@material-ui/core';
import moment from 'moment';
import {db} from '../db';
import {useDocument} from 'react-firebase-hooks/firestore';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import Divider from '@material-ui/core/Divider';
import CheckIcon from '@material-ui/icons/Check';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  }),
);
const useStyles2 = makeStyles((theme: Theme) =>
  createStyles({
    notVisited: {
      backgroundColor: '#ff9800',
    },
    visited: {
      backgroundColor: '#28a745',
    },
  }),
);

function UltraListItem(props) {
  const classes = useStyles2();

  const [urlVisited, setUrlVisited] = React.useState(false);

  const setVisited = () => setUrlVisited(true);

  return (
    <div>
      <ListItem button href={`${props.href}`} component='a' target='_blank' onClick={setVisited} {...props}>
        <ListItemAvatar>
          {urlVisited ? (
            <Avatar className={classes.visited}>
              <CheckIcon />
            </Avatar>
          ) : (
            <Avatar className={classes.notVisited}>{props.number}</Avatar>
          )}
        </ListItemAvatar>
        <ListItemText primary={props.title} secondary={props.description} />
      </ListItem>
    </div>
  );
}

export interface RetryCountProps {
  pipelineRunID: string;
}

export const DebugLinks: React.FunctionComponent<RetryCountProps> = ({pipelineRunID}) => {
  const classes = useStyles();

  const {value: testRunDoc, loading, error} = useDocument(db.collection('testruns').doc(pipelineRunID));

  if (loading || error) {
    return null;
  }
  const createdAt = testRunDoc.get('createdAt');
  const updatedAt = testRunDoc.get('updatedAt');
  const serverName = testRunDoc.get('serverName');

  if (!createdAt || !updatedAt || !serverName) {
    return null;
  }

  const sentryEnv = serverName === 'ph-staging-app' ? 'staging' : `dev-${serverName.replace('-ph-dev-app')}`;
  const herokuAppName = serverName;

  const startTimeForSentry = moment(new Date(createdAt), 'YYYY-MM-DDTHH:mm').subtract('10', 'minutes').toISOString();
  const endTimeForSentry = moment(new Date(updatedAt), 'YYYY-MM-DDTHH:mm').toISOString();
  const startTimeForDataDog = new Date(createdAt).setMinutes(new Date(createdAt).getMinutes() - 10);
  const endTimeForDataDog = new Date(updatedAt).valueOf();

  const sentryIssuesDebugLink = `https://sentry.io/organizations/zapakuj-to/issues/?environment=${sentryEnv}&query=is%3Aunresolved+event.timestamp%3A%3E%3D${startTimeForSentry}+event.timestamp%3A%3C${endTimeForSentry}`;
  const dataDogServerDebugLink = `https://app.datadoghq.com/logs?cols=&from_ts=${startTimeForDataDog}&index=main&live=false&messageDisplay=expanded-lg&query=host%3A${herokuAppName}+status%3Aerror&stream_sort=desc&to_ts=${endTimeForDataDog}`;

  return (
    <div className={classes.root}>
      <Typography variant='h5'>CHECKLIST</Typography>
      <Typography>Please click on following steps and check all places that can contain information about issues during this E2E run.</Typography>
      <div className={classes.root}>
        <List component='nav' aria-label='main mailbox folders'>
          <UltraListItem
            number='1'
            title='Sentry errors'
            description='Check if there were any errors reported to Sentry during this E2E run'
            href={`${sentryIssuesDebugLink}`}
          />
          <UltraListItem number='2' title='Server logs' description='Check server logs for errors.' href={`${dataDogServerDebugLink}`} />
        </List>
        <Divider />
        <ListItem>
          <Avatar style={{marginRight: '15px'}}>
            <ArrowDownwardIcon />
          </Avatar>
          <ListItemText
            primary='Test results'
            secondary={<React.Fragment>{"Check test's terminal output and videos in tests reported below"}</React.Fragment>}
          />
        </ListItem>
      </div>
    </div>
  );
};
