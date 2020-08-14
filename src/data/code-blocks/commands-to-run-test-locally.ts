export const commandsToRunTestLocally = (testcaseDoc: firebase.firestore.DocumentSnapshot) =>
  `cd e2e-tests

yarn install

yarn test \\
  --path "${testcaseDoc.get('path')}" \\
  --fixture "${testcaseDoc.get('fixture')}" \\
  --name "${testcaseDoc.get('name')}"
`;
