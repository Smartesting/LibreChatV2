const cron = require('node-cron');
const {
  runRemoveExpiredTraineeAccountsJob,
} = require('~/server/utils/tasks/removeExpiredTraineeAccounts');

const startCrons = () => {
  console.log('Starting crons...');
  cron.schedule('0 0 * * *', runRemoveExpiredTraineeAccountsJob); //every day at midnight
};

module.exports = { startCrons };
