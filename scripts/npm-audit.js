'use strict';

const { exec } = require('child_process');

const auditArguments = process.argv
  .slice(2)
  .filter((arg) => arg !== '--parseable') // we ignore parseable output
  .filter((arg) => arg !== '--json'); // we use ignore json output

const execShellCommand = (cmd) => {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve(stdout || stderr);
    });
  });
};

const parseAuditWhitelist = (ignoredList) => {
  try {
    return JSON.parse(ignoredList.trim()).map(Number);
  } catch (error) {
    return [];
  }
};

const auditLevelFromArguments = (auditArgs) => {
  const concatenatedArguments = auditArgs.join(' ');
  const match = concatenatedArguments.match(/--audit-level=(low|moderate|high|critical)/);

  return Array.isArray(match) ? match[1] : 'low';
};

const lteLevel = (level) => (advisory) => {
  const levelMapping = {
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
  };
  const { severity } = advisory;
  const severityMapped = levelMapping[severity] || levelMapping.low;

  return severityMapped >= levelMapping[level];
};

const isAdvisoryNotWhitelisted = (whitelist) => (advisoryId) =>
  !whitelist.includes(Number(advisoryId));

(async () => {
  const auditLevel = auditLevelFromArguments(auditArguments);

  const jsonReport = JSON.parse(
    await execShellCommand(`npm audit --json ${auditArguments.join(' ')}`)
  );
  const whitelist = parseAuditWhitelist(await execShellCommand('npm config get audit-whitelist'));
  const advisoriesIds = Object.keys(jsonReport.advisories)
    .filter(isAdvisoryNotWhitelisted(whitelist))
    .filter(lteLevel(auditLevel));

  const textReport = await execShellCommand(`npm audit ${auditArguments.join(' ')}`);

  console.log(textReport);

  if (whitelist.length > 0) {
    console.info(
      `Ignoring following security advisories:\n\n ----------------------------------${whitelist
        .map(
          (advisoryId) =>
            `\n https://npmjs.com/advisories/${advisoryId} \n ----------------------------------`
        )
        .join('')}`
    );
  }

  if (advisoriesIds.length > 0) {
    process.exit(1);
  }
})();
