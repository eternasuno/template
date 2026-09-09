import { auth } from '../../../server/auth/auth.ts';

interface AuthRequestEvent {
  request: Request;
}

const handleAuthRequest = ({ request }: AuthRequestEvent): Promise<Response> =>
  auth.handler(request);

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
