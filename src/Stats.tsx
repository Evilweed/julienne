import * as React from 'react';
import {EvaluationModal} from './EvaluationModal';
import {Link, useRoute} from 'wouter';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme, CircularProgress, Button, Typography, Card, IconButton} from '@material-ui/core';
import {db} from './db';
import {useDocument, useCollection} from 'react-firebase-hooks/firestore';
import {firestore} from 'firebase';
import {
  CheckCircleOutlineOutlined,
  HighlightOff,
  ReportProblemOutlined,
  DateRange,
} from '@material-ui/icons';
import CloseIcon from '@material-ui/icons/Close';
import {useLocation} from 'wouter';

const useStyles = makeStyles((theme: Theme) => ({
  root: {padding: '10px'},
  closeModalButton: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 12312,
  },
}));

export interface StatsProps {
  path?: string;
  id?: string;
}

export const Stats: React.FunctionComponent<StatsProps> = props => {
  const classes = useStyles();
  const [testRunsCount, setTestRunsCount] = React.useState<number>(1);
  const [, setLocation] = useLocation();

  const {value: itemsCollection, loading, error} = useCollection(
    db.collection('weeklyStats').orderBy('from', 'desc'),
    // .orderBy('sortName', 'asc'),
  );

  const itemsData = (collection: firestore.QuerySnapshot) =>
    collection.docs.map(item => {
      const data = {
        id: item.id,
        ...item.data(),
      };
      return data as StatsData;
    });

  const onModalClose = () => setLocation('/main/');

  return !loading ? (
    <Card className={classes.root}>
      <IconButton onClick={onModalClose} className={classes.closeModalButton} size='small'>
        <CloseIcon fontSize='inherit' />
      </IconButton>
      <TotalStats />
      <Typography variant='h3'>Weekly stats</Typography>
      <Typography variant='subtitle1'>
        Firebase cron function generates weekly stats every Monday at 23:00
      </Typography>
      {itemsData(itemsCollection).map(statsItem => (
        <StatsElement key={statsItem.id} stats={statsItem} />
      ))}
    </Card>
  ) : (
    <CircularProgress size={16} thickness={4} />
  );
};

export const TotalStats: React.FunctionComponent = () => {
  const classes = useStyles();

  const {value: statsDoc, loading, error} = useDocument(db.collection('stats').doc('total'));

  if (loading) {
    return <CircularProgress size={16} thickness={4} />;
  }

  const stats = {
    id: statsDoc.id,
    ...statsDoc.data(),
  } as StatsData;

  return (
    <div>
      <Typography variant='h3'>Total stats</Typography>
      <Typography variant='subtitle1'>
        Those stats represent all tests added since the beginning of time and matter.
      </Typography>
      <StatsElement key='total' stats={stats} />
    </div>
  );
};

export interface StatsData {
  id: string;
  from?: number;
  to?: number;
  passedCount: number;
  failedCount: number;
  retriedCount: number;
}

export interface StatsElementProps {
  stats: StatsData;
}

export const StatsElement: React.FunctionComponent<StatsElementProps> = props => {
  const {id, passedCount, failedCount, retriedCount: unstableCount} = props.stats;
  const totalCount = passedCount + failedCount;
  const passedPercentage = parseFloat(`${passedCount / (totalCount / 100)}`).toFixed(2);
  const failedPercentage = parseFloat(`${failedCount / (totalCount / 100)}`).toFixed(2);
  const unstablePercentage = parseFloat(`${unstableCount / (totalCount / 100)}`).toFixed(2);
  return (
    <div>
      {/*{JSON.stringify(props.stats, null, 2)}*/}
      <Button variant='text' style={{color: 'gray'}} size='medium' startIcon={<DateRange />}>
        {`${id}`}
      </Button>
      <Button
        variant='outlined'
        style={{color: 'green', marginLeft: '5px'}}
        size='medium'
        startIcon={<CheckCircleOutlineOutlined />}
      >
        {`${passedCount} ( ${passedPercentage}% )`}
      </Button>
      <Button
        variant='outlined'
        style={{color: 'red', marginLeft: '5px'}}
        size='medium'
        startIcon={<HighlightOff />}
      >
        {`${failedCount} ( ${failedPercentage}% )`}
      </Button>
      <Button
        variant='outlined'
        style={{color: '#ff9800', marginLeft: '5px'}}
        size='medium'
        startIcon={<ReportProblemOutlined />}
      >
        {`${unstableCount} ( ${unstablePercentage}% )`}
      </Button>
    </div>
  );
};
