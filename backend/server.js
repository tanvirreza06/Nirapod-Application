const app = require('./app');
const { startTimerChecker } = require('./timerChecker');
const { startHeartbeatChecker } = require('./heartbeatChecker');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startTimerChecker();
  startHeartbeatChecker();
});