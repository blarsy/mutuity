import { initializeMonitoring, wrapMonitoredApp } from "./src/services/monitoring/sentry";

// Initialize before importing the application graph so JS boot errors are covered too.
initializeMonitoring();
const App = require("./src/App").default;
export default wrapMonitoredApp(App);
