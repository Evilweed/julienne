import * as React from 'react';
import * as firebase from 'firebase/app';
import {Route, Redirect, useRoute} from 'wouter';
import {Login} from './Login';
import {Main} from './Main';
import {Stats} from './Stats';
import {useAuthState} from 'react-firebase-hooks/auth';
import {userContext} from './auth/user-context';
import Helmet from 'react-helmet';
import {allowedUser} from './auth/allowed-user';
import CircularProgress from '@material-ui/core/CircularProgress/CircularProgress';
import ReactNotification from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';
import {TestSuiteManagement} from './TestSuiteManagement';

if (process.env.NODE_ENV !== 'production' && false) {
  const {whyDidYouUpdate} = require('why-did-you-update');
  whyDidYouUpdate(React);
}

interface PrivateRouteProps {
  component: any;
  path?: string;
}

const PrivateRoute = ({component: Component, path, ...other}: PrivateRouteProps) => {
  const user = firebase.auth().currentUser;
  const [match, params] = useRoute(path);

  if (!match) {
    return null;
  }

  if (!user || !allowedUser(user)) {
    return <Redirect to='/login' />;
  }

  return <Component />;
};

function App() {
  const {initialising, user} = useAuthState(firebase.auth());
  const [rootPath, rootPathParams] = useRoute('/');

  if (initialising) {
    return (
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '3rem',
          justifyContent: 'center',
          display: 'flex',
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <userContext.Provider
      value={{
        user: user,
        initialising,
      }}
    >
      <div className='App'>
        <ReactNotification />
        <Helmet titleTemplate='%s | Packhelp Eye' defaultTitle='Packhelp Eye' />
        <Route path='/login' component={Login} />
        <PrivateRoute path='/main/:rest*' component={Main} />
        <PrivateRoute path='/stats/:rest*' component={Stats} />
        <PrivateRoute path='/testSuiteManagement/:rest*' component={TestSuiteManagement} />
        {rootPath && !user && <Redirect to='/login' />}
        {rootPath && user && <Redirect to='/main/' />}
      </div>
    </userContext.Provider>
  );
}

export default App;
