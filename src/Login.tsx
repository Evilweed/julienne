import * as React from 'react';
// import {Redirect, Link} from 'router';
import {loginWithGoogle} from './auth/auth';
import Container from '@material-ui/core/Container/Container';
import Typography from '@material-ui/core/Typography/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Theme} from '@material-ui/core';
import Card from '@material-ui/core/Card/Card';
import Button from '@material-ui/core/Button/Button';
import CircularProgress from '@material-ui/core/CircularProgress/CircularProgress';
import {allowedUser} from './auth/allowed-user';
import * as firebase from 'firebase/app';
import {Route, Redirect, useRoute} from 'wouter';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(2),
      padding: theme.spacing(2),
    },
    textAlign: 'center',
    maxWidth: '600px',
  },
  logoContainer: {},
  loginContainer: {},
  loginButton: {
    margin: theme.spacing(2),
  },
  loginDescription: {
    marginTop: theme.spacing(2),
  },
  logo: {
    marginTop: theme.spacing(5),
    fontSize: theme.spacing(10),
  },
  appName: {
    marginTop: theme.spacing(1),
    fontSize: theme.spacing(5),
  },
}));

export interface LoginProps {
  path?: string;
}

export const Login: React.FunctionComponent<LoginProps> = () => {
  const user = firebase.auth().currentUser;
  const [match, params] = useRoute('/login');
  const classes = useStyles();

  const [loading, setLoading] = React.useState(false);
  const [redirectToHome] = React.useState(false);
  const [redirectToReferrer, setRedirectToReferrer] = React.useState(false);

  if (user && match) {
    console.log('redirect');
    return <Redirect to='/main/' />;
  }

  if (user) {
    return null;
  }

  const {from} = {from: {pathname: '/main/'}};

  const login = async (fn: Function): Promise<void> => {
    try {
      setLoading(true);
      await fn();
      setRedirectToReferrer(true);
    } catch (err) {
      setLoading(false);
      setRedirectToReferrer(false);
    }
  };

  if (redirectToReferrer) {
    return <Redirect from='' to={from.pathname} noThrow />;
  }

  if (redirectToHome) {
    return <Redirect from='' to={from.pathname} noThrow />;
  }

  const onClick = () => login(loginWithGoogle);

  return (
    <Container className={classes.root}>
      <Container maxWidth='sm' className={classes.logoContainer}>
        <Typography className={classes.logo}>👁</Typography>
        <Typography variant='h2'>Packhelp EYE</Typography>
      </Container>
      <Card className={classes.loginContainer} elevation={1}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Container>
            <Typography variant='h5'>Log in to your account</Typography>
            <Typography className={classes.loginDescription}>
              Seems that you are not logged it. Use your company Google account to log in.
            </Typography>
            <Button
              className={classes.loginButton}
              variant='contained'
              color='primary'
              onClick={onClick}
            >
              Sign in with Google
            </Button>
          </Container>
        )}
      </Card>
    </Container>
  );
};
