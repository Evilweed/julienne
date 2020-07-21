import React, {useEffect} from 'react';
import {fade, makeStyles, Theme, createStyles} from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import Clear from '@material-ui/icons/Clear';
import {
  Chip,
  Button,
  Card,
  FormControl,
  Select,
  InputLabel,
  InputAdornment,
} from '@material-ui/core';
import {More} from '@material-ui/icons';
import {NotificationPop} from './common/NotificationPop';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {DateRangePicker} from 'react-date-range';
import {addDays} from 'date-fns';
import {useState} from 'react';
import {useLocation} from 'wouter';
import {debounce} from 'lodash';
import BarChartIcon from '@material-ui/icons/BarChart';
import ReportOffIcon from '@material-ui/icons/ReportOff';

import algoliasearch from 'algoliasearch';
import algolia from './Search';

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function getKeyByFullMatchLevel(object) {
  return Object.keys(object).find(key => object[key].matchLevel === 'full');
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    grow: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
      },
      marginRight: theme.spacing(4),
    },
    search: {
      marginLeft: theme.spacing(2),
      borderRadius: '4px',
      backgroundColor: '#e8e8e8',
      paddingLeft: '8px',
      height: '40px',
      width: '460px',
    },
    searchResult: {
      '> em': {
        color: 'red',
      },
    },
    searchIcon: {
      padding: theme.spacing(0, 2),
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputRoot: {
      color: 'inherit',
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: '20ch',
      },
    },
    sectionDesktop: {
      display: 'none',
      [theme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },
    sectionMobile: {
      display: 'flex',
      [theme.breakpoints.up('md')]: {
        display: 'none',
      },
    },
  }),
);

interface TopBarProps {
  setTestRunsCount: Function;
  setSearchedTestRuns: Function;
  testRunsCount: number;
}
export const TopBar: React.FunctionComponent<TopBarProps> = ({
  setSearchedTestRuns,
  setTestRunsCount,
  testRunsCount,
}) => {
  const [location, setLocation] = useLocation();

  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchedItem, setReferenceItem] = React.useState(null);

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const changeTestRunsAmount = async event => {
    const count: number = event.target.value;

    try {
      if (count === testRunsCount) {
        return;
      }
      setTestRunsCount(count);
    } catch (error) {
      NotificationPop.showError(error);
    }
  };

  const onExcludedTestsClick = () => setLocation('/testSuiteManagement');
  const onStatsClick = () => setLocation('/stats');

  return (
    <div className={classes.grow}>
      <Card style={{overflow: 'initial'}}>
        <Toolbar>
          <FormControl variant='outlined' size='small'>
            <InputLabel htmlFor='outlined-type-native-simple'>TestRuns</InputLabel>
            <Select
              value={testRunsCount}
              onChange={changeTestRunsAmount}
              label='TestRuns'
              style={{minWidth: '80px'}}
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={8}>8</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={40}>40</MenuItem>
            </Select>
          </FormControl>
          <SearchBar setSearchedTestRuns={setSearchedTestRuns} />
          <div className={classes.grow} />
          <div className={classes.sectionDesktop}>
            <Button
              variant='outlined'
              style={{color: '#a6a7a5', marginLeft: '5px'}}
              size='medium'
              startIcon={<ReportOffIcon />}
              onClick={onExcludedTestsClick}
            >
              Test suite management
            </Button>
            <Button
              variant='outlined'
              style={{color: '#a6a7a5', marginLeft: '5px'}}
              size='medium'
              startIcon={<BarChartIcon />}
              onClick={onStatsClick}
            >
              Stats
            </Button>
          </div>
        </Toolbar>
      </Card>
    </div>
  );
};

interface SearchBarProps {
  setSearchedTestRuns: Function;
}
export const SearchBar: React.FunctionComponent<SearchBarProps> = ({setSearchedTestRuns}) => {
  const classes = useStyles();

  const [searchInputValue, setSearchInputValue] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState(null);
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchedItem, setReferenceItem] = React.useState(null);
  const [searchListVisible, setSearchListVisible] = React.useState(null);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(event.currentTarget.value);
    setSearchListVisible(true);
  };

  useEffect(() => {
    let debouncedFetchHits = debounce(() => setSearchQuery(searchInputValue), 1000);
    debouncedFetchHits();
    return () => debouncedFetchHits.cancel();
  }, [searchInputValue]);

  React.useEffect(() => {
    if (searchQuery && searchQuery.length > 2) {
      console.log('query: %s', searchQuery);
      algolia.search(searchQuery).then(results => {
        results.hits.forEach(item => {
          const fullMatchKey = getKeyByFullMatchLevel(item._highlightResult);
          item.type = fullMatchKey;
          item.highligh = item._highlightResult[fullMatchKey].value;
        });
        console.log('results: %o', results);
        setSearchResults(results.hits);
      });
    }
  }, [searchQuery]);

  React.useEffect(() => {
    if (searchedItem) {
      console.log(searchedItem);
      algolia.searchInAttribute(searchedItem.type, searchQuery).then(results => {
        results.hits.forEach(item => {
          const fullMatchKey = getKeyByFullMatchLevel(item._highlightResult);
          item.type = fullMatchKey;
          item.highligh = item._highlightResult[fullMatchKey].value;
        });
        console.log('results refined: %o', results);
        setSearchedTestRuns(results.hits);
      });
    }
  }, [searchedItem]);

  const onClickSearchItem = (searchedItem, e) => {
    setReferenceItem(searchedItem);
    setSearchInputValue(searchedItem[searchedItem.type]);
    setSearchListVisible(false);
  };

  const onCancelSearch = () => {
    setSearchInputValue('');
    setSearchedTestRuns(null);
    setSearchListVisible(false);
  };

  const shouldDisplaySearchList =
    searchInputValue && searchInputValue.length > 2 && searchListVisible;

  return (
    <FormControl variant='filled' size='medium'>
      <InputBase
        placeholder='Search…'
        className={classes.search}
        value={searchInputValue}
        onChange={handleSearchInputChange}
        endAdornment={
          <InputAdornment position='end'>
            {searchInputValue && searchInputValue.length > 0 ? (
              <IconButton onClick={onCancelSearch}>
                <Clear onClick={onCancelSearch} />
              </IconButton>
            ) : null}
          </InputAdornment>
        }
      />
      {shouldDisplaySearchList ? (
        <Card
          style={{
            position: 'absolute',
            left: '16px',
            top: '55px',
            maxHeight: '720px',
            overflow: 'scroll',
            zIndex: 999,
          }}
        >
          {searchResults.map(result => (
            <MenuItem
              className={classes.searchResult}
              onClick={onClickSearchItem.bind(this, result)}
            >
              <Button variant='outlined' style={{color: 'gray', marginRight: '10px'}} size='small'>
                {result.type}
              </Button>
              <span
                style={{color: 'gray'}}
                dangerouslySetInnerHTML={{__html: result.highligh}}
              ></span>
            </MenuItem>
          ))}
        </Card>
      ) : null}
    </FormControl>
  );
};
