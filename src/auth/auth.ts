import * as firebase from 'firebase/app';
import 'firebase/auth';
import {useContext} from 'react';
import {userContext} from './user-context';
import {allowedUser} from './allowed-user';

const provider = new firebase.auth.GoogleAuthProvider();

export const useSession = () => {
  const {user} = useContext(userContext);
  return user;
};

export const loginWithGoogle = async () => {
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    if (!allowedUser) {
      throw Error('Restricted access to Employees!');
    }
    console.log(result);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const signOut = () => firebase.auth().signOut();
