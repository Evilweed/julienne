import * as React from 'react';
import {Result} from '../enums/Result';
import Avatar from '@material-ui/core/Avatar/Avatar';
import {Cancel, Check} from '@material-ui/icons';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {green, red} from '@material-ui/core/colors';

const useStyles = makeStyles((theme: Theme) => ({
  resultIconPassed: {
    backgroundColor: green[500],
    width: theme.spacing(5),
    height: theme.spacing(5),
  },
  resultIconFailed: {
    backgroundColor: red[500],
    width: theme.spacing(5),
    height: theme.spacing(5),
  },
}));

export interface ResultIconProps {
  result: string;
}

export const ResultIcon: React.FunctionComponent<ResultIconProps> = ({result}) => {
  const classes = useStyles();

  return result === Result.Passed ? (
    <Avatar className={classes.resultIconPassed}>
      <Check />
    </Avatar>
  ) : (
    <Avatar className={classes.resultIconFailed}>
      <Cancel />
    </Avatar>
  );
};
