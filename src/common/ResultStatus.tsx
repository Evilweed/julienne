import * as React from 'react';
import {Result} from '../enums/Result';
import Chip from '@material-ui/core/Chip/Chip';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {green, red} from '@material-ui/core/colors';

const useStyles = makeStyles((theme: Theme) => ({
  resultStatusPassed: {
    backgroundColor: green[500],
    color: 'white',
  },
  resultStatusFailed: {
    backgroundColor: red[500],
    color: 'white',
  },
}));

export interface ResultStatusProps {
  result: string;
}

export const ResultStatus: React.FunctionComponent<ResultStatusProps> = ({result}) => {
  const classes = useStyles();

  const statusClass =
    result === Result.Passed ? classes.resultStatusPassed : classes.resultStatusFailed;

  return <Chip className={statusClass} size='small' label={result} />;
};
