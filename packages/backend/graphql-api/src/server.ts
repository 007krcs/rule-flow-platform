/**
 * GraphQL API Server
 * Apollo Server 4 with WebSocket subscriptions
 */

import express, { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import DataLoader from 'dataloader';
import resolvers, { pubsub } from './resolvers';

const app: Express = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3005;

// Load schema
const typeDefs = fs.readFileSync(
  path.join(__dirname, 'schema.graphql'),
  'utf-8'
);

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

const serverCleanup = useServer({ schema }, wsServer);

// Apollo Server 4 setup
async function startServer() {
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ],
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path
      };
    }
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: req.headers['x-user-id'] || 'anonymous',
        loaders: {
          ruleset: new DataLoader(async (keys) => {
            return keys.map(() => null);
          })
        }
      })
    })
  );

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'graphql-api' });
  });

  // Emit system metrics periodically
  setInterval(() => {
    pubsub.publish('SYSTEM_METRICS', {
      systemMetrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 100),
        requestsPerSecond: Math.random() * 200,
        timestamp: new Date().toISOString()
      }
    });
  }, 5000);

  httpServer.listen(port, () => {
    console.log(`✓ GraphQL API listening on port ${port}`);
    console.log(`  GraphQL endpoint: http://localhost:${port}/graphql`);
    console.log(`  Subscriptions: ws://localhost:${port}/graphql`);
  });
}

startServer().catch(console.error);

export default app;
