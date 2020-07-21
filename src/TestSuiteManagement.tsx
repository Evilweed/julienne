import * as React from 'react';
import {Link, useRoute} from 'wouter';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {
  Theme,
  CircularProgress,
  Button,
  Typography,
  Card,
  IconButton,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableHead,
  FormControlLabel,
  Switch,
} from '@material-ui/core';
import {db} from './db';
import {useDocument, useCollection} from 'react-firebase-hooks/firestore';
import {firestore} from 'firebase';
import {CheckCircleOutlineOutlined, DateRange, HighlightOff} from '@material-ui/icons';
import CloseIcon from '@material-ui/icons/Close';
import {useLocation} from 'wouter';
import {TestCase} from './TestRun';

const useStyles = makeStyles((theme: Theme) => ({
  root: {padding: '10px'},
  closeModalButton: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 12312,
  },
  disabled: {
    color: '#bbbbbb',
  },
}));

export interface TestSuiteManagementProps {
  path?: string;
  id?: string;
}

export const TestSuiteManagement: React.FunctionComponent<TestSuiteManagementProps> = props => {
  const classes = useStyles();
  const [, setLocation] = useLocation();

  const {value: testcasesCollection, loading, error} = useCollection(
    db.collection('uniqueTestcases').orderBy('sortName', 'asc'),
  );

  if (loading) {
    return null;
  }

  const processTestCaseData = (collection: firestore.QuerySnapshot): UniqueTestCase[] => {
    const testcases: UniqueTestCase[] = [];
    collection.docs.map(item => {
      const data = {
        id: item.id,
        ...item.data(),
      };
      testcases.push(data as UniqueTestCase);
    });
    return testcases;
  };

  const processedTestCasesData = processTestCaseData(testcasesCollection);

  const allTestCount = processedTestCasesData.length;
  const disabledTestCount = processedTestCasesData.filter(testCase => testCase.disabled).length;

  const onModalClose = () => setLocation('/main/');

  return !loading ? (
    <Card className={classes.root}>
      <IconButton onClick={onModalClose} className={classes.closeModalButton} size='small'>
        <CloseIcon fontSize='inherit' />
      </IconButton>
      <Typography variant='h3'>Test suite management</Typography>
      <Typography variant='subtitle1'>
        If some tests will become too flaky (sometimes fail, sometimes pass), then here is the place
        where test can be disabled without commiting any code.
      </Typography>

      <TestSuiteStats allTestCount={allTestCount} disabledTestCount={disabledTestCount} />
      <TableContainer component={Paper}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Created at</TableCell>
              <TableCell>Fixture</TableCell>
              <TableCell>Test</TableCell>
              <TableCell>State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedTestCasesData.map(testcase => (
              <ManagedTestCase key={testcase.id} testcase={testcase} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  ) : (
    <CircularProgress size={16} thickness={4} />
  );
};

interface TestSuiteStats {
  allTestCount: number;
  disabledTestCount: number;
}

export const TestSuiteStats: React.FunctionComponent<TestSuiteStats> = props => {
  const classes = useStyles();

  const {disabledTestCount, allTestCount} = props;

  const disabledTestsPercentage = parseFloat(`${disabledTestCount / (allTestCount / 100)}`).toFixed(
    0,
  );

  const color = disabledTestCount > 0 ? 'red' : 'green';

  return (
    <div>
      <Button
        variant='outlined'
        style={{color: color, marginLeft: '5px'}}
        size='medium'
        startIcon={<HighlightOff />}
      >
        Disabled tests: {`${props.disabledTestCount} ( ${disabledTestsPercentage}% )`}
      </Button>
    </div>
  );
};

export interface UniqueTestCase extends TestCase {
  disabled: boolean;
}

export interface ManagedTestCaseProps {
  testcase: UniqueTestCase;
}

export const ManagedTestCase: React.FunctionComponent<ManagedTestCaseProps> = props => {
  const classes = useStyles();

  const [testEnabled, setTestEnabled] = React.useState(true);

  const {testcase} = props;

  React.useEffect(() => {
    setTestEnabled(!testcase.disabled);
  }, [testcase]);

  const createdAt = new Date(testcase.createdAt);
  const currentMonth =
    createdAt.getMonth() + 1 < 10 ? `0${createdAt.getMonth() + 1}` : createdAt.getMonth() + 1;
  const currentDay = createdAt.getDate() < 10 ? `0${createdAt.getDate()}` : createdAt.getDate();
  const displayDate = `${createdAt.getFullYear()}-${currentMonth}-${currentDay}`;

  const state = testcase.disabled ? 'disabled' : 'enabled';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    db.collection('uniqueTestcases').doc(testcase.id).update({disabled: !event.target.checked});
  };

  return (
    <TableRow key={testcase.id}>
      {/*{JSON.stringify(testcase, null, 2)}*/}

      <TableCell className={classes[state]}>{displayDate}</TableCell>
      <TableCell className={classes[state]}>{testcase.path}</TableCell>
      <TableCell className={classes[state]}>{testcase.fixture}</TableCell>
      <TableCell className={classes[state]}>{testcase.name}</TableCell>
      <TableCell className={classes[state]}>{testcase.disabled}</TableCell>
      <TableCell className={classes[state]}>
        <FormControlLabel
          control={
            <Switch checked={testEnabled} onChange={handleChange} color='primary' name='asd' />
          }
          label={state}
        />
      </TableCell>
    </TableRow>
  );
};
