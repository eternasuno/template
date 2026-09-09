import { pageRoutes } from 'virtual:file-routes';
import { createRouter } from '@solidjs/router';
import { fileRoutes } from '@solidjs/router/fs';

// One shared instance serves every mount and request: the client renders it,
// and on the server it reads its location from the request event.
export const Router = createRouter({ routes: fileRoutes(pageRoutes) });

export const { paths } = Router;
