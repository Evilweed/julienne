import * as React from 'react';
import {useSession} from '../auth/auth';
import {useCollection} from 'react-firebase-hooks/firestore';
import * as firebase from 'firebase/app';
import debug from 'debug';
import {db} from '../db';
const log = debug('app:with-follow-requests');

export function useTest() {
  const user = useSession();
  const {error, loading, value} = useCollection(
    db
      .collection('relations')
      .where('toUserId', '==', user.uid)
      .where('confirmed', '==', false)
      .limit(50),
  );

  return {
    error,
    loading,
    value,
  };
}

export function useTest2(toUser = true) {
  const user = useSession();

  const [loading, setLoading] = React.useState(true);
  const [userList, setUserList] = React.useState([]);

  const key = toUser ? 'toUserId' : 'fromUserId';

  React.useEffect(() => {
    setLoading(true);

    const unsubscribe = db
      .collection('relations')
      .where(key, '==', user.uid)
      .orderBy('confirmed')
      .limit(100)
      .onSnapshot(value => {
        const userList = [];

        value.docs.forEach(doc => {
          const data = doc.data();

          if (!data.fromUser) {
            return;
          }

          userList.push({
            id: doc.id,
            ...data,
          });
        });

        log('setting user list: %o', userList);

        setUserList(userList);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  return {loading, userList};
}
