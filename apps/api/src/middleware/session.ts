import { Context, Effect } from 'effect';
import {
  Cookies,
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from 'effect/unstable/http';
import { Auth } from '../runtime/auth';

export class CurrentUser extends Context.Service<
  CurrentUser,
  { id: string; name: string; email: string }
>()('CurrentUser') {}

export const currentUserMiddleware = HttpRouter.middleware<{
  provides: CurrentUser;
}>()(
  Effect.gen(function* () {
    const auth = yield* Auth;

    return (handler) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const webRequest = yield* HttpServerRequest.toWeb(request);
        const session = yield* Effect.promise(() =>
          auth.api.getSession({
            headers: webRequest.headers,
            returnHeaders: true,
          })
        );
        const response = session.response
          ? yield* Effect.provideService(handler, CurrentUser, {
              id: session.response.user.id,
              name: session.response.user.name,
              email: session.response.user.email,
            })
          : yield* HttpServerResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
        const headers = new Headers(session.headers);
        const cookies = Cookies.fromSetCookie(headers.getSetCookie());
        headers.delete('set-cookie');

        return response.pipe(
          HttpServerResponse.setHeaders(headers),
          HttpServerResponse.mergeCookies(cookies)
        );
      });
  })
);
