import * as React from 'react';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme, CircularProgress} from '@material-ui/core';
import Paper from '@material-ui/core/Paper/Paper';
import ReactAnsi from 'react-ansi';
import axios, {AxiosStatic} from 'axios';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    background: '#282a36',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontSize: '12px',
    '& a': {
      color: '#6bbaff',
    },
  },
  copyIcon: {
    color: 'white',
    position: 'absolute',
    right: '20px',
    marginTop: '3px',
  },
}));

export interface CodeBlockProps {
  url: string;
}

export const TerminalOutput: React.FunctionComponent<CodeBlockProps> = ({url}) => {
  const [terminalOutput, setTerminalOutput] = React.useState<string>(null);
  const classes = useStyles();
  const proxyUrl = `https://us-central1-packhelp-eye.cloudfunctions.net/api/getUrlThroughProxy`;

  React.useEffect(() => {
    axios
      .get(proxyUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {url: url},
      })
      .then(response => {
        setTerminalOutput(response.data);
      })
      .catch(err => console.log(err));
  }, [url]);

  return (
    <Paper className={classes.container} variant='outlined'>
      {terminalOutput ? (
        <ReactAnsi log={terminalOutput} />
      ) : (
        <CircularProgress size={20} thickness={4} />
      )}
    </Paper>
  );
};
