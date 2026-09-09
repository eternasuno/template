import { createFlightDataCollector } from '@solidjs/router/server';
import { configureServerFunctionsServer } from '@solidjs/web/server-functions/server';
import { Router } from './router';

// Runs in the server-function handler graph before the first dispatch, so
// single-flight mutations never race the app graph's registration.
configureServerFunctionsServer({
  collectFlightData: createFlightDataCollector(Router),
});
