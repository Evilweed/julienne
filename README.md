## Running locally

This project is built using `create-react-app`, typescript, and firebase. To get it running properly, you need `src/firebase-config.ts`. The config should look something like this:

```js
// src/firebase-config.ts
const config = {
  apiKey: "myapikey",
  authDomain: "my-auth-domain.firebaseapp.com",
  databaseURL: "my-db-url.com",
  projectId: "my-pid",
  storageBucket: "my-storage-bucket",
  messagingSenderId: "my-sender-id",
};

export default config;
```

Install dependencies

```
yarn
```

Deploy or emulate firebase functions.<br>

Start server:

```
yarn start
```

This runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Deploying

Use firebase-cli to initalize a project in the root directory. Then build your project and deploy.

```
yarn run build
firebase deploy
```
