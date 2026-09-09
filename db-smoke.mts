import {
  closeDb,
  createSurreal,
  getDb,
} from './apps/web/src/server/db/index.ts';

const mem = await createSurreal({
  endpoint: 'mem://',
  namespace: 'app',
  database: 'app',
});
console.log('version:', JSON.stringify(await mem.version()));
console.log('mem query:', JSON.stringify(await mem.query('RETURN 1+1;')));
console.log(
  'mem create:',
  JSON.stringify(await mem.query('CREATE smoke:1 SET ok = true;'))
);
await mem.close();

const a = await getDb();
const b = await getDb();
console.log('singleton reused:', a === b);
console.log(
  'kv create:',
  JSON.stringify(await a.query('CREATE smoke:1 SET ok = true;'))
);
console.log(
  'kv select:',
  JSON.stringify(await a.query('SELECT * FROM smoke:1;'))
);
await closeDb();
const c = await getDb();
console.log('reopened fresh:', c !== a, c.isConnected);
await closeDb();
console.log('DONE');
process.exit(0);
