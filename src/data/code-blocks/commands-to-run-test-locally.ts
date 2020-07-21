export const commandsToRunTestLocally = (testcaseDoc: firebase.firestore.DocumentSnapshot) =>
  `cd e2e-tests

yarn install

yarn test \\
  --file "${testcaseDoc.get('path')}" \\
  --fixture "${testcaseDoc.get('fixture')}" \\
  --test "${testcaseDoc.get('name')}"
`;
