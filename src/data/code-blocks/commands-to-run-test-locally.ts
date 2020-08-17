export const commandsToRunTestLocally = (testcaseDoc: firebase.firestore.DocumentSnapshot) => {
  const path = `${testcaseDoc.get('path')}`.replace('.js', '.ts');
  return `cd e2e-tests

yarn install

yarn test \\
  --path "${path}" \\
  --fixture "${testcaseDoc.get('fixture')}" \\
  --name "${testcaseDoc.get('name')}"
`;
};
