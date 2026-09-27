import serverless from 'serverless-http';
import { app, ready } from '../../server/src/index.js';

const handler = serverless(app);

export default async (event, context) => {
  await ready;
  return handler(event, context);
};
