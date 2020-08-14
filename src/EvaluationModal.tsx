import * as React from 'react';
import firebase from 'firebase/app';
import {useDocument, useCollection} from 'react-firebase-hooks/firestore';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Card from '@material-ui/core/Card/Card';
import CardContent from '@material-ui/core/CardContent/CardContent';
import Typography from '@material-ui/core/Typography/Typography';
import {
  ListItemAvatar,
  Theme,
  FormControl,
  MenuItem,
  Select,
  OutlinedInput,
  InputLabel,
  InputAdornment,
  Button,
} from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem/ListItem';
import TableContainer from '@material-ui/core/TableContainer/TableContainer';
import Paper from '@material-ui/core/Paper/Paper';
import Table from '@material-ui/core/Table/Table';
import TableBody from '@material-ui/core/TableBody/TableBody';
import TableRow from '@material-ui/core/TableRow/TableRow';
import TableCell from '@material-ui/core/TableCell/TableCell';
import {Result} from './enums/Result';
import {ResultIcon} from './common/ResultIcon';
import {ResultStatus} from './common/ResultStatus';
import {RetryCount} from './common/RetryCount';
import {CodeBlock} from './common/CodeBlock';
import IconButton from '@material-ui/core/IconButton/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import {useLocation, useRoute} from 'wouter';
import {db, updateTestCase, updateTestRun} from './db';
import {Link, Search} from '@material-ui/icons';
import {useState, useEffect} from 'react';
import copy from 'copy-to-clipboard';
import {instabilityTestReportDescription} from './data/code-blocks/instability-report';
import {commandsToRunTestLocally} from './data/code-blocks/commands-to-run-test-locally';
import {Url} from './data/Url';
import {NotificationPop} from './common/NotificationPop';
import ReactPlayer from 'react-player';
import {debugEnabled} from './debug';
import {TerminalOutput} from './common/TerminalOutput';

const oneDay = 1000 * 60 * 60 * 24;

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: '275px',
    maxWidth: '1100px',
    position: 'absolute',
    top: theme.spacing(10),
    right: theme.spacing(1),
    zIndex: 9999999,
  },
  closeModalButton: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 12312,
  },
  testName: {
    fontSize: '20px',
    marginBottom: theme.spacing(1),
  },
  fixtureName: {
    marginTop: '10px',
    fontSize: '15px',
  },
  filePath: {
    fontSize: '12px',
    marginTop: theme.spacing(1),
  },
  table: {
    minWidth: 300,
  },
}));

const renderRow = (label: string, firebaseKey: JSX.Element) => (
  <TableRow key={label}>
    <TableCell component='th' scope='row'>
      {label}
    </TableCell>
    <TableCell align='left'>{firebaseKey}</TableCell>
  </TableRow>
);

export interface EvaluationModalProps {
  id: string;
}

export const EvaluationModal: React.FunctionComponent<EvaluationModalProps> = ({id}) => {
  const classes = useStyles();
  const [, setLocation] = useLocation();
  let gitlabVideoPath;
  let gitlabScreenshotPath;
  let gitlabTerminalOutputPath;
  const [isPipelineRoute, params] = useRoute('/pipeline/:ciPipelineID/:testCaseID?');

  const {value: testcaseDoc, loading, error} = useDocument(
    firebase.firestore().collection('testcases').doc(id),
  );

  if (loading) {
    return null;
  }

  if (!loading && !testcaseDoc.exists) {
    return null;
  }

  if (error) {
    NotificationPop.showError(error);
    return null;
  }

  const ciJobURL = Url.ci.job(testcaseDoc.get('ciJobID'));

  const retriesCount = testcaseDoc.get('executionTimes').length - 1;

  const executionTimes = () => {
    const times = testcaseDoc.get('executionTimes');
    return times.map((time, index) => <span key={index}>({parseInt(time)}s) </span>);
  };

  const miscTimes = () => {
    const times = testcaseDoc.get('miscTimes');
    return times.map((time, index) => <span key={index}>({parseInt(time)}s) </span>);
  };

  const setExcludeTestRun = async (isExcluded: boolean) => {
    const ciPipelineID = testcaseDoc.get('ciPipelineID');

    await db.collection('testruns').doc(ciPipelineID).update({excluded: isExcluded});
  };

  const displayIssueRow: boolean = retriesCount > 0;

  const onClickClose = e => {
    e.preventDefault();
    if (isPipelineRoute) {
      return setLocation(`/pipeline/${params.ciPipelineID}/`);
    }
    setLocation('/main/');
  };

  const createdAt = testcaseDoc.get('createdAt');
  const s3ArtifactUrls = testcaseDoc.get('artifactsUrls');
  const shouldUseGitlabArtifacts = createdAt + oneDay < Date.now() || !s3ArtifactUrls;

  const videoUrl = (): string => {
    if (shouldUseGitlabArtifacts) {
      const gitlabVideoPath = testcaseDoc.get('videoPath');
      return gitlabVideoPath
        ? `https://gitlab.com/packhelp-devs/packhelp/-/jobs/${testcaseDoc.get(
            'ciJobID',
          )}/artifacts/raw${gitlabVideoPath}`
        : null;
    } else {
      return s3ArtifactUrls.video;
    }
  };

  const terminalOutputUrl = (): string => {
    if (shouldUseGitlabArtifacts) {
      const gitlabTerminalOutputPath = testcaseDoc.get('terminalOutputPath');

      return gitlabTerminalOutputPath
        ? `https://gitlab.com/api/v4/projects/13955129/jobs/${testcaseDoc.get(
            'ciJobID',
          )}/artifacts/${gitlabTerminalOutputPath}`
        : null;
    } else {
      return s3ArtifactUrls.log;
    }
  };

  const renderCreatedAt = () => {
    const date = new Date(createdAt).toLocaleString();
    return <>{`${date}`}</>;
  };

  if (testcaseDoc) {
    return (
      <div>
        <Card className={classes.root}>
          <CardContent>
            <IconButton onClick={onClickClose} className={classes.closeModalButton} size='small'>
              <CloseIcon fontSize='inherit' />
            </IconButton>
            <ListItem>
              <ListItemAvatar>
                <ResultIcon result={testcaseDoc.get('status')} />
              </ListItemAvatar>
              <div>
                <Typography className={classes.fixtureName} color='textSecondary'>
                  {testcaseDoc.get('fixture')}
                </Typography>
                <Typography variant='h5' component='h2' className={classes.testName}>
                  {testcaseDoc.get('name')}
                </Typography>
              </div>
            </ListItem>
            <div style={{display: 'flex'}}>
              <TableContainer component={Paper}>
                <Table className={classes.table} size='small' aria-label='a dense table'>
                  <TableBody>
                    {renderRow('Result', <ResultStatus result={testcaseDoc.get('status')} />)}
                    {/*{renderRow('Retries', <RetryCount count={testcaseDoc.get('retryCount')} />)}*/}
                    {renderRow('Retries', <RetryCount count={`${retriesCount}`} />)}
                    {renderRow('File path', testcaseDoc.get('path'))}
                    {renderRow('Created at', renderCreatedAt())}
                    {renderRow('Execution times', executionTimes())}
                    {renderRow('Misc times', miscTimes())}
                    {displayIssueRow &&
                      renderRow('Instability type', <IssueSection testcaseDoc={testcaseDoc} />)}
                    {renderRow(
                      'CI job link',
                      <a href={ciJobURL} target='_blank'>
                        {testcaseDoc.get('ciJobID')}
                      </a>,
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {videoUrl() ? (
                <Paper>
                  <ReactPlayer
                    url={videoUrl()}
                    playing
                    controls={true}
                    width={'400px'}
                    height={'300px'}
                  />
                </Paper>
              ) : null}
            </div>
            <TestRunTable testcaseDoc={testcaseDoc} />
            {terminalOutputUrl() ? <TerminalOutput url={terminalOutputUrl()} /> : null}
            <CodeBlock code={commandsToRunTestLocally(testcaseDoc)} language='bash' />
            {debugEnabled ? (
              <CodeBlock code={JSON.stringify(testcaseDoc.data(), null, 2)} language='json' />
            ) : null}

            {/*<Button*/}
            {/*size='small'*/}
            {/*variant='contained'*/}
            {/*color='primary'*/}
            {/*style={{marginTop: '8px'}}*/}
            {/*onClick={() => setExcludeTestRun(true)}*/}
            {/*>*/}
            {/*⛔️ Exclude TestRun*/}
            {/*</Button>*/}
            {/*<Button*/}
            {/*size='small'*/}
            {/*variant='contained'*/}
            {/*color='primary'*/}
            {/*style={{marginTop: '8px'}}*/}
            {/*onClick={() => setExcludeTestRun(false)}*/}
            {/*>*/}
            {/*✅ Include TestRun*/}
            {/*</Button>*/}
            {/*<Button*/}
            {/*size='small'*/}
            {/*variant='contained'*/}
            {/*color='primary'*/}
            {/*style={{marginTop: '8px', marginLeft: '8px'}}*/}
            {/*>*/}
            {/*Issue in test*/}
            {/*</Button>*/}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export interface IssueSectionProps {
  testcaseDoc: firebase.firestore.DocumentSnapshot;
}

export interface TestcaseIssue {
  type: string | null;
  testcaseId: string;
  testcaseExternalIssueId: string | null;
  testcaseSortName: string | null;
}

export const IssueSection: React.FunctionComponent<IssueSectionProps> = ({testcaseDoc}) => {
  const [issueExternalIdInputValue, setIssueExternalIdInputValue] = useState<string>('');

  const testcaseId = testcaseDoc.id;
  const testcaseRef = testcaseDoc.ref;
  const issueTypeInFirebase = testcaseDoc.get('issueType');
  const externalIssueId = testcaseDoc.get('externalIssueId');
  const issueType = issueTypeInFirebase ? issueTypeInFirebase : '';

  const shouldDisplayExternalIssueInput = issueType && issueType !== '';
  const shouldDisplayExternalIssueLink =
    issueExternalIdInputValue && issueExternalIdInputValue !== '';

  useEffect(() => {
    setIssueExternalIdInputValue(externalIssueId);
  }, [testcaseId, externalIssueId]);

  const changeIssueType = async event => {
    const type: string = event.target.value;
    const removedType = type === '';

    try {
      await updateTestCase(testcaseId, {issueType: type});
      if (removedType) {
        await updateTestCase(testcaseId, {externalIssueId: null});
      }
    } catch (error) {
      NotificationPop.showError(error);
      console.log(error);
    }
  };

  const changeExternalIssueId = async event => {
    const value: string = event.target.value;
    let processedExternalIssueId = '';

    if (value.indexOf('/story/') > 0) {
      const numberAndTitle = value.split('/story/')[1];
      processedExternalIssueId = numberAndTitle.split('/')[0];
    } else {
      processedExternalIssueId = value.replace('ch', '');
    }

    try {
      await updateTestCase(testcaseId, {externalIssueId: processedExternalIssueId});
      setIssueExternalIdInputValue(processedExternalIssueId);
    } catch (error) {
      NotificationPop.showError(error);
    }
  };

  const copyInstabilityTestReportToClipboard = () => {
    const ciJobURL = Url.ci.job(testcaseDoc.get('ciJobID'));

    copy(instabilityTestReportDescription(testcaseDoc, ciJobURL));
  };

  const onLinkClick = () => {
    window.open(Url.clubhouse.story(issueExternalIdInputValue), '_blank');
  };

  const onSearchClick = () => {
    copyInstabilityTestReportToClipboard();
    window.open(Url.clubhouse.search(testcaseDoc.get('path')), '_blank');
  };

  return (
    <div>
      <FormControl variant='outlined' size='small'>
        <InputLabel htmlFor='outlined-type-native-simple'>Type</InputLabel>
        <Select
          value={issueType}
          onChange={changeIssueType}
          label='Type'
          style={{minWidth: '100px'}}
        >
          <MenuItem value=''>
            <em>Nothing selected</em>
          </MenuItem>
          <MenuItem value={'bug-in-tool'}>🐞 in TOOLS</MenuItem>
          <MenuItem value={'bug-in-app'}>🐞 in APP</MenuItem>
          <MenuItem value={'bug-in-test'}>🐞 in TEST</MenuItem>
        </Select>
      </FormControl>
      {shouldDisplayExternalIssueInput ? (
        <FormControl variant='outlined' size='small' style={{marginLeft: '5px'}}>
          <InputLabel htmlFor='outlined-adornment-password'>External issue ID</InputLabel>
          <OutlinedInput
            label='External issue ID'
            type='text'
            value={issueExternalIdInputValue}
            onBlur={changeExternalIssueId}
            onChange={event => setIssueExternalIdInputValue(event.target.value)}
            endAdornment={
              <InputAdornment position='end'>
                <IconButton onClick={onSearchClick} edge='end'>
                  <Search />
                </IconButton>
                {shouldDisplayExternalIssueLink ? (
                  <IconButton onClick={onLinkClick} edge='end'>
                    <Link />
                  </IconButton>
                ) : null}
              </InputAdornment>
            }
          />
        </FormControl>
      ) : null}
    </div>
  );
};

export const TestRunTable: React.FunctionComponent<IssueSectionProps> = ({testcaseDoc}) => {
  const classes = useStyles();

  const testrunId = testcaseDoc.get('ciPipelineID');

  const {value: testRunDoc, loading, error} = useDocument(
    firebase.firestore().collection('testruns').doc(testrunId),
  );

  if (loading) {
    return null;
  }

  const excludeTypeInFirebase = testRunDoc.get('excludeType');

  const excludeType = excludeTypeInFirebase ? excludeTypeInFirebase : '';

  const changeExcludeType = async event => {
    const type: string = event.target.value;
    const noType = type === '';

    try {
      if (noType) {
        await updateTestRun(testrunId, {
          excludeType: null,
          excluded: false,
        });
      } else {
        await updateTestRun(testrunId, {
          excludeType: type,
          excluded: true,
        });
      }
    } catch (error) {
      NotificationPop.showError(error);
    }
  };

  return (
    <TableContainer component={Paper} style={{marginTop: '5px'}}>
      <Table size='small'>
        <TableBody>
          {renderRow('Commit', testRunDoc.get('commitTitle'))}
          {renderRow('Branch', testRunDoc.get('branch'))}
          {renderRow('Sha', testRunDoc.get('commitSha'))}
          {renderRow('Triggered by', testRunDoc.get('triggeredBy'))}
          <TableRow key='exclude-type'>
            <TableCell component='th' scope='row'>
              Exclude type
            </TableCell>
            <TableCell align='left'>
              <FormControl variant='outlined' size='small'>
                <InputLabel htmlFor='outlined-type-native-simple'>Exclude type</InputLabel>
                <Select
                  value={excludeType}
                  onChange={changeExcludeType}
                  label='Type'
                  style={{minWidth: '200px'}}
                >
                  <MenuItem value=''>
                    <em>Nothing selected</em>
                  </MenuItem>
                  <MenuItem value={'debug'}>🚧 Debug run</MenuItem>
                  <MenuItem value={'bug-in-setup'}>
                    🐞 in SETUP / PREP / CONFIG / HUMAN ERR
                  </MenuItem>
                  {/*<MenuItem value={'bug-in-app'}>🐞 in APP</MenuItem>*/}
                </Select>
              </FormControl>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
