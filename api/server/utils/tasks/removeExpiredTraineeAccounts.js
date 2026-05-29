const { removeExpiredTraineeAccounts } = require('~/models');

const runRemoveExpiredTraineeAccountsJob = async () => {
  try {
    logCron('Starting removing expired trainee accounts...');
    await removeExpiredTraineeAccounts();
    logCron('Finished removing expired trainee accounts.');
  } catch (error) {
    logCron(`Error removing expired trainee accounts: ${error}`);
  }
};

function logCron(message) {
  console.log(`${new Date().toISOString()} info: [CRON] ${message}`);
}

module.exports = { runRemoveExpiredTraineeAccountsJob };
