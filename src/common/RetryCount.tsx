import * as React from 'react';
import Chip from '@material-ui/core/Chip/Chip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {orange} from '@material-ui/core/colors';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ReportIcon from '@material-ui/icons/Report';

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
  count: string;
}

export const RetryCount: React.FunctionComponent<RetryCountProps> = ({count}) => {
  const classes = useStyles();

  const statusClass = `${count}` === '0' ? classes.zeroRetries : classes.retriesDetected;
  const icon =
    `${count}` === '0' ? (
      <CheckCircleIcon htmlColor='white' />
    ) : (
      <ReportIcon className={classes.white} />
    );

  return <Chip className={statusClass} icon={icon} size='small' label={count} />;
};
