import * as React from 'react';
import debug from 'debug';
import {Link, useRoute, useLocation} from 'wouter';
import {Result} from './enums/Result';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import {green, red, orange, grey} from '@material-ui/core/colors';
import {db} from './db';
import Typography from '@material-ui/core/Typography/Typography';
import Container from '@material-ui/core/Container/Container';
import List from '@material-ui/core/List/List';
import CircularProgress from '@material-ui/core/CircularProgress/CircularProgress';
import Button from '@material-ui/core/Button/Button';
import Tooltip from '@material-ui/core/Tooltip/Tooltip';
import {useEffect} from 'react';
import {useCollection} from 'react-firebase-hooks/firestore';
import {proxy} from 'comlink';

const log = debug('app:TestRun');

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '18px',
    margin: '0px',
    padding: '0px',
  },
  skipped: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    backgroundColor: grey[300],
  },
  passed: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    backgroundColor: green[200],
  },
  issueReported: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    backgroundColor: green[100],
  },
  failed: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    backgroundColor: red[500],
    borderRadius: '50%',
  },
  retried: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    backgroundColor: orange[500],
    borderRadius: '50%',
  },
  wrapper: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    padding: '1px',
    margin: '2px',
  },
  active: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    backgroundColor: 'black',
    borderRadius: '50%',
  },
  tooltip: {
    maxWidth: 'none',
    opacity: '100%',
    backgroundColor: grey[600],
    color: 'white',
    top: '-7px',
    left: '-18px',
  },
  tooltipFailed: {
    maxWidth: 'none',
    opacity: '100%',
    backgroundColor: red[500],
    top: '-7px',
    left: '-18px',
  },
  tooltipRetried: {
    maxWidth: 'none',
    opacity: '100%',
    backgroundColor: orange[500],
    top: '-7px',
    left: '-18px',
  },
}));

export interface TestRunProps {
  id: string;
}

export interface TestCase {
  id: string;
  createdAt: number;
  sortName: string;
  ciPipelineID: string;
  ciNodeTotal: string;
  ciNodeIndex: string;
  ciJobID: string;
  path: string;
  name: string;
  issueType: string | null;
  externalIssueId: string | null;
  executionTimes: string[];
  miscTimes: string[];
  fixture: string;
  status: Result;
  retryCount: number;
}

export const TestRun: React.FunctionComponent<TestRunProps> = ({id}) => {
  const classes = useStyles();
  const [hovered, setHovered] = React.useState(false);

  const {value: items, loading, error} = useCollection(
    db.collection('testcases').where('ciPipelineID', '==', id),
    // .orderBy('ciPipelineID', 'desc')
    // .orderBy('sortName', 'asc'),
  );

  if (loading || !items || items.size === 0) {
    return <CircularProgress size={16} thickness={4} />;
  }

  const itemsData = items.docs.map(item => {
    const testCase = item.data() as TestCase;
    testCase.id = item.id;
    return testCase;
  });

  return (
    <Container className={classes.root}>
      <Container>
        {!itemsData && itemsData.length === 0 && <Typography>There are no testcases.</Typography>}

        <List>
          {!itemsData && <CircularProgress size={16} thickness={4} />}
          {itemsData.map(testCase => (
            <TestCaseGridItem
              key={testCase.id}
              id={testCase.id}
              testCase={testCase}
              hovered={hovered}
              setHovered={setHovered}
            />
          ))}
        </List>
      </Container>
    </Container>
  );
};

interface TestCaseGridItemProps {
  id: string;
  testCase: TestCase;
  hovered: boolean;
  setHovered;
}

export function TestCaseGridItem({id, testCase, hovered, setHovered}: TestCaseGridItemProps) {
  const classes = useStyles();

  if (!testCase || !testCase.id) {
    return <CircularProgress size={16} thickness={4} />;
  }

  const href = `/main/${id}`;
  const [isActive] = useRoute(href);
  const [, setLocation] = useLocation();
  const retried = testCase.executionTimes.length > 1; // TODO(m) remove true after demo
  //console.log(`${id} = ${testCase.issueReported}`);
  const resultClass = isActive
    ? classes.active
    : testCase.issueType && testCase.issueType.length > 0
    ? classes.issueReported
    : //: // : testCase.status === Result.Skipped
    // ? classes.skipped
    testCase.status === Result.Failed
    ? classes.failed
    : retried
    ? classes.retried
    : classes.passed;
  const tooltipClass =
    testCase.status === Result.Failed
      ? classes.tooltipFailed
      : retried
      ? classes.tooltipRetried
      : classes.tooltip;
  if (testCase.status === Result.Skipped) {
    return null;
  }

  const onClick = async e => {
    e.preventDefault();
    setLocation(href);
  };

  return (
    <Container className={classes.wrapper}>
      <Tooltip
        id={id}
        arrow
        title={`📝 ${testCase.fixture} 📍 ${testCase.name}`}
        placement='right'
        open={hovered}
        onOpen={() => setHovered(true)}
        onClose={() => setHovered(false)}
        classes={{tooltip: tooltipClass}}
      >
        <a style={{cursor: 'pointer'}} onClick={onClick}>
          <div className={resultClass}></div>
        </a>
      </Tooltip>
    </Container>
  );
}

// const {
//   loading,
//   loadingError,
//   loadingMore,
//   loadingMoreError,
//   hasMore,
//   items,
//   loadMore,
// } = usePaginateQuery(
//   db
//     .collection('testcases')
//     .where('ciPipelineID', '==', id)
//     .orderBy('sortName', 'asc'),
//   {limit: 300},
//   // .orderBy('sortName', 'asc'),
// );

// useEffect(() => {
//   const unsubscribe = db
//     .collection('testcases')
//     .where('ciPipelineID', '==', id)
//     .orderBy('sortName', 'asc')
//     .onSnapshot(snapshot => {
//       let list = [];
//       snapshot.forEach(doc => {
//         const testCase = {
//           id: doc.id,
//           ...doc.data(),
//         };
//         list.push(testCase);
//       });
//       setItemsData(list);
//     });
//   return () => unsubscribe();
// }, [id, issueSortNames]);

//TODO(m) prev
// const [itemsData, setItemsData] = React.useState([]);
//
// useEffect(() => {
//   if (itemsData.length === 0) {
//     console.log('Try');
//     getTestRunTestcases(id).then(testcaseList => setItemsData(testcaseList));
//   }
//
//   const interval = setInterval(async () => {
//     getTestRunTestcases(id).then(testcaseList => setItemsData(testcaseList));
//   }, 30000);
//   return () => clearInterval(interval);
// }, []);
//
// if (itemsData.length === 0) {
//   return <CircularProgress size={16} thickness={4} />;
// }

// await removeTestCase(id);

// await addTestCase({
//   sortName: 'asd/dsfg/afasd__spec.ts|Sign Up Form|can be destroyed',
//   testRunID: '3b642786b4cbcg',
//   fixtureName: 'Sign Up Form ',
//   testName: 'can be destroyed passed',
//   filePath: 'asd/dsfg/afasd__spec.ts',
//   executionTimes: [126553, 213654],
//   retryCount: 0,
//   result: Result.Passed,
// });
