import { Effect } from 'effect';
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from 'effect/unstable/http';
import { Auth } from '../runtime/auth';

export const authRoutes = HttpRouter.add(
  '*',
  '/api/auth/*',
  (request: HttpServerRequest.HttpServerRequest) =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const webRequest = yield* HttpServerRequest.toWeb(request);
      const response = yield* Effect.promise(() => auth.handler(webRequest));

      return HttpServerResponse.fromWeb(response);
    })
);
