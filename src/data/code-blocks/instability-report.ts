import {commandsToRunTestLocally} from './commands-to-run-test-locally';

export const instabilityTestReportDescription = (
  testcaseDoc: firebase.firestore.DocumentSnapshot,
  ciJobURL: string,
) =>
  `
Unstable E2E test.

---
##### What is probable cause of failure:








---

### CI Job link:
${ciJobURL}

### Fixture & test:
\`\`\`
${testcaseDoc.get('fixture')}
${testcaseDoc.get('name')}
\`\`\`

### File:
\`\`\`
${testcaseDoc.get('path')}
\`\`\`

### Run test:
\`\`\`
${commandsToRunTestLocally(testcaseDoc)}
\`\`\`
`;
