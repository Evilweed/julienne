const request = require('request');

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const algoliasearch = require('algoliasearch');
const jsonParser = bodyParser.json();
const CLOUD_FN_REGIONS = ['us-central1', 'europe-west1'];
const fn = functions.region(...CLOUD_FN_REGIONS);

admin.initializeApp();

// const CLUBHOUSE_API_TOKEN = fn.config().clubhouse.api_token;
const GITLAB_API_TOKEN = functions.config().gitlab.api_token;
const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key;
const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key;

const ALGOLIA_INDEX_NAME = 'testruns';

const algoliaClient = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

function getFirebaseUser(req, res, next) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
    );
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      req.user = decodedIdToken;
      next();
    })
    .catch(error => {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send('Unauthorized');
    });
}

const app = require('express')();
app.use(require('cors')({origin: true}));
exports.api = fn.https.onRequest(app);

exports.onUserCreated = fn.auth.user().onCreate(user => {
  return Promise.all([createUserProfile(user.uid, user)]);
});

function createUserProfile(userId, user) {
  const isPackhelpEmail = `${user.email}`.indexOf('@packhelp.com') !== -1;
  if (!user || !isPackhelpEmail) {
    return;
  }
  return admin.firestore().collection('users').doc(userId).set({
    uid: userId,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  });
}

const generateDailyStats = async () => {
  const oneDayInMilliseconds = 1000 * 60 * 60 * 24 * 1;
  const stats = await generateStatsInTimeframe('daily', oneDayInMilliseconds);
};

const generateWeeklyStats = async () => {
  const oneDayInMilliseconds = 1000 * 60 * 60 * 24 * 7;
  const stats = await generateStatsInTimeframe('weekly', oneDayInMilliseconds);
};

const generateStatsInTimeframe = async (statRangeName, timeRangeInMilliseconds) => {
  const todaysDate = new Date().getTime();
  const sinceDate = new Date().getTime() - timeRangeInMilliseconds;
  const timeRange = {
    from: sinceDate,
    to: todaysDate,
  };

  let testcasesCollectionInDateRange = admin
    .firestore()
    .collection('testcases')
    .where('createdAt', '>=', timeRange.from)
    .where('createdAt', '<=', timeRange.to);

  let retriedTestsCollection = testcasesCollectionInDateRange
    .where('status', '==', 'PASSED')
    .where('retryCount', '==', 2);

  let passedTestsCollection = testcasesCollectionInDateRange.where('status', '==', 'PASSED');
  let failedTestsCollection = testcasesCollectionInDateRange.where('status', '==', 'FAILED');

  const passedCountPromise = passedTestsCollection.get().then(snapshot => snapshot.size);
  const failedCountPromise = failedTestsCollection.get().then(snapshot => snapshot.size);
  const retriedCountPromise = retriedTestsCollection.get().then(snapshot => snapshot.size);

  const passedCount = await passedCountPromise;
  const failedCount = await failedCountPromise;
  const retriedCount = await retriedCountPromise;

  const stats = {
    from: timeRange.from,
    to: timeRange.to,
    passedCount: passedCount,
    failedCount: failedCount,
    retriedCount: retriedCount,
  };

  const today = new Date();
  const currentMonth =
    today.getMonth() + 1 < 10 ? `0${today.getMonth() + 1}` : today.getMonth() + 1;
  const currentDay = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
  const id = `${today.getFullYear()}-${currentMonth}-${currentDay}`;

  await admin
    .firestore()
    .collection(`${statRangeName}Stats`)
    .doc(id)
    .set(stats)
    .catch(error => {
      throw new Error(error);
    });

  console.log(stats);
  return stats;
};

const generateTotalStats = async () => {
  let testcasesCollection = admin.firestore().collection('testcases');

  let retriedTestsCollection = testcasesCollection
    .where('status', '==', 'PASSED')
    .where('retryCount', '==', 2);

  let passedTestsCollection = testcasesCollection.where('status', '==', 'PASSED');
  let failedTestsCollection = testcasesCollection.where('status', '==', 'FAILED');

  const passedCountPromise = passedTestsCollection.get().then(snapshot => snapshot.size);
  const failedCountPromise = failedTestsCollection.get().then(snapshot => snapshot.size);
  const retriedCountPromise = retriedTestsCollection.get().then(snapshot => snapshot.size);

  const passedCount = await passedCountPromise;
  const failedCount = await failedCountPromise;
  const retriedCount = await retriedCountPromise;

  const stats = {
    passedCount: passedCount,
    failedCount: failedCount,
    retriedCount: retriedCount,
  };

  await admin
    .firestore()
    .collection(`stats`)
    .doc('total')
    .set(stats)
    .catch(error => {
      throw new Error(error);
    });

  console.log(stats);
  return stats;
};

app.get('/stats', generateTotalStats);

exports.triggerTotalStatsGeneration = fn.pubsub.schedule('00 * * * *').onRun(generateTotalStats);
exports.triggerDailyStatsGeneration = fn.pubsub.schedule('00 23 * * *').onRun(generateDailyStats);
exports.triggerWeeklyStatsGeneration = fn.pubsub.schedule('00 23 * * 0').onRun(generateWeeklyStats);

app.post('/testCase', jsonParser, async (req, res) => {
  try {
    console.log('📬: ' + JSON.stringify(req.body));
    const data = req.body;
    const testRun = data.testRun;
    testRun.excluded = false;
    testRun.createdAt = Date.now();
    let tests = data.tests;
    tests = tests.map(test => {
      test.sortName = `${test.path}${test.fixture}${test.name}`;
      test.ciPipelineID = `${testRun.ciPipelineID}`;
      test.ciJobID = `${testRun.ciJobID}`;
      test.ciNodeIndex = testRun.ciNodeIndex;
      test.ciNodeTotal = testRun.ciNodeTotal;
      test.executionTimes = test.executionTimes.map(time => `${time}`);
      test.miscTimes = test.miscTimes.map(time => `${time}`);
      test.retries = test.retryCount === 0 ? 1 : 0;
      test.createdAt = Date.now();

      if (!test.status) {
        test.status = 'SKIPPED';
      }
      return test;
    });

    await admin
      .firestore()
      .collection('testruns')
      .doc(testRun.ciPipelineID)
      .set(testRun)
      .catch(error => {
        throw new Error(error);
      });

    const addTestsToFirebase = tests.map(async test => {
      return await admin
        .firestore()
        .collection('testcases')
        .add(test)
        .catch(error => {
          throw new Error(error);
        });
    });
    return await Promise.all(addTestsToFirebase).then(() => {
      return res.status(200).send('ok');
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.get('/getUrlThroughProxy', jsonParser, async (req, res) => {
  const url = req.query['url'];

  res.header('Access-Control-Allow-Origin', '*');
  const gitlabRequest = {
    url: `${url}`,
    headers: {
      'PRIVATE-TOKEN': `${GITLAB_API_TOKEN}`,
    },
  };

  console.log(`url: ${url}`);
  return request(gitlabRequest).pipe(res);
});

app.get('/excludedTests', async (req, res) => {
  try {
    const disabledTestcases = await admin
      .firestore()
      .collection('uniqueTestcases')
      .where('disabled', '==', true)
      .get()
      .then(snapshot => {
        if (snapshot.size > 0) {
          return snapshot.docs.map(item => {
            const data = item.data();
            return {
              fixture: data.fixture,
              name: data.name,
              path: data.path,
            };
          });
        } else {
          return [];
        }
      })
      .catch(error => {
        console.log(data);
        throw new Error(error);
      });

    return res.status(200).send(disabledTestcases);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

// read query parameters

app.get('/clubhouseIssues', jsonParser, async (req, res) => {
  // https://clubhouse.io/api/rest/v3/#Body-Parameters-31248
  // curl -X GET \
  // -H "Content-Type: application/json" \
  // -d '{ "page_size": 123, "query": "foo" }' \
  // -L "https://api.clubhouse.io/api/v3/search/stories?token=$CLUBHOUSE_API_TOKEN"
});

function indexEntry(entry) {
  const entryData = entry.data();
  entryData.objectID = entry.id;
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);

  return index.saveObject(entryData).then(
    p => {
      console.log('saved testrun', p);
    },
    err => {
      console.error(err);
    },
  );
}

exports.onTestcaseCreatedStoreUnique = functions.firestore
  .document('testcases/{testcaseId}')
  .onCreate(async snap => {
    const data = snap.data();
    const newUniqueTestThatShouldBeStored = await admin
      .firestore()
      .collection('uniqueTestcases')
      .where('name', '==', data.name)
      .where('fixture', '==', data.fixture)
      .where('path', '==', data.path)
      .get()
      .then(snapshot => snapshot.size === 0)
      .catch(error => {
        console.log(data);
        throw new Error(error);
      });

    if (newUniqueTestThatShouldBeStored) {
      const dataClone = Object.assign({}, data);
      return await admin
        .firestore()
        .collection('uniqueTestcases')
        .add(dataClone)
        .catch(error => {
          console.log(dataClone);
          throw new Error(error);
        });
    }
  });

exports.onTestrunCreated = functions.firestore.document('testruns/{testrunId}').onCreate(snap => {
  return indexEntry(snap);
});

exports.onTestrunUpdated = functions.firestore.document('testruns/{testrunId}').onUpdate(snap => {
  return indexEntry(snap.after);
});

exports.onTestrunDeleted = functions.firestore.document('testruns/{testrunId}').onDelete(snap => {
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
  return index.deleteObject(snap.id);
});
