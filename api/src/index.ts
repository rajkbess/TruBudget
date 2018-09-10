import * as express from "express";
import * as fastify from 'fastify'

import { createBasicApp } from "./httpd/server";
import { registerRoutes } from "./httpd/fastifyServer";
import logger from "./lib/logger";
import { isReady } from "./lib/readiness";
import timeout from "./lib/timeout";
import { RpcMultichainClient } from "./multichain";
import { randomString } from "./multichain/hash";
import { ConnectionSettings } from "./multichain/RpcClient.h";
import { registerNode } from "./network/controller/registerNode";
import { ensureOrganizationStreams } from "./organization/organization";



/*
 * Deal with the environment:
 */

const port: number = (process.env.PORT && parseInt(process.env.PORT, 10)) || 8080;

const jwtSecret: string = process.env.JWT_SECRET || randomString(32);
if (jwtSecret.length < 32) {
  console.log("Warning: the JWT secret key should be at least 32 characters long.");
}
const rootSecret: string = process.env.ROOT_SECRET || randomString(32);
if (!process.env.ROOT_SECRET) {
  console.log(`Warning: root password not set; autogenerated to ${rootSecret}`);
}
const organization: string | undefined = process.env.ORGANIZATION;
if (!organization) {
  process.exit(1);
}
const organizationVaultSecret: string | undefined = process.env.ORGANIZATION_VAULT_SECRET;
if (!organizationVaultSecret) {
  process.exit(1);
}

/*
 * Initialize the components:
 */

const rpcSettings: ConnectionSettings = {
  protocol: "http",
  host: process.env.RPC_HOST || "localhost",
  port: parseInt(process.env.RPC_PORT || "8000", 10),
  username: process.env.RPC_USER || "multichainrpc",
  password: process.env.RPC_PASSWORD || "this-is-insecure-change-it",
};
logger.info(rpcSettings, "Connecting to MultiChain node");
const multichainClient = new RpcMultichainClient(rpcSettings);

const server = createBasicApp(jwtSecret);

// app.use(
//   "/api",
//   createRouter(multichainClient, jwtSecret, rootSecret, organization!, organizationVaultSecret!),
// );

/*
 * Run the app:
 */
// server.register(require('./'), { prefix: '/api' })

// Enable useful traces of unhandled-promise warnings:
process.on("unhandledRejection", err => {
  logger.fatal({ err }, "UNHANDLED PROMISE REJECTION");
  process.exit(1);
});

function registerSelf(): Promise<boolean> {
  return multichainClient
    .getRpcClient()
    .invoke("listaddresses", "*", false, 1, 0)
    .then(addressInfos =>
      addressInfos
        .filter(info => info.ismine)
        .map(info => info.address)
        .find(_ => true),
    )
    .then(address => {
      const req = {
        body: {
          data: {
            address,
            organization,
          },
        },
      };
      registerNode(multichainClient, req as express.Request);
    })
    .then(() => true)
    .catch(() => false);
}

registerRoutes(server, multichainClient, jwtSecret, rootSecret, organization!, organizationVaultSecret!)

console.log('Register fastify endpoint')

server.listen(port, async err => {
  if (err) {
    logger.fatal(err);
    process.exit(1);
  }
  logger.info(`server is listening on ${port}`);

  const retryIntervalMs = 5000;

  while (!(await isReady(multichainClient))) {
    logger.error("MultiChain connection/permissions not ready yet");
    await timeout(retryIntervalMs);
  }
  logger.info("MultiChain connection established");

  while (
    !(await ensureOrganizationStreams(multichainClient, organization!, organizationVaultSecret!)
      .then(() => true)
      .catch(() => false))
  ) {
    logger.error("failed to create organization stream");
    await timeout(retryIntervalMs);
  }
  logger.info("organization stream present");

  while (!(await registerSelf())) {
    logger.error("failed to register node");
    await timeout(retryIntervalMs);
  }
  logger.info("node registered in nodes stream");
});
