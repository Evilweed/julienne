import * as React from 'react';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import Paper from '@material-ui/core/Paper/Paper';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import SyntaxHighlighter from 'react-syntax-highlighter';
import copy from 'copy-to-clipboard';
import IconButton from '@material-ui/core/IconButton/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Tooltip from '@material-ui/core/Tooltip/Tooltip';

dracula.hljs.background = `#222`;

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    backgroundColor: '#222',
    marginTop: theme.spacing(1),
  },
  copyIcon: {
    color: 'white',
    position: 'absolute',
    right: '20px',
    marginTop: '3px',
  },
}));

export interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock: React.FunctionComponent<CodeBlockProps> = ({code, language}) => {
  const classes = useStyles();

  const onCopyIconClicked = () => copy(code);

  return (
    <Paper className={classes.container} variant='outlined'>
      <Tooltip arrow title='Copy' placement='top'>
        <IconButton onClick={onCopyIconClicked} className={classes.copyIcon} size='small'>
          <FileCopyIcon fontSize='inherit' />
        </IconButton>
      </Tooltip>
      <SyntaxHighlighter language={language} style={dracula}>
        {code}
      </SyntaxHighlighter>
    </Paper>
  );
};
