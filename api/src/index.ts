import * as fastify from "fastify";

import { registerRoutes } from "./httpd/router";
import { createBasicApp } from "./httpd/server";
import logger from "./lib/logger";
import { isReady } from "./lib/readiness";
import timeout from "./lib/timeout";
import { RpcMultichainClient } from "./multichain";
import { randomString } from "./multichain/hash";
import { ConnectionSettings } from "./multichain/RpcClient.h";
import { registerNode } from "./network/controller/registerNode";
import { ensureOrganizationStreams } from "./organization/organization";

const URL_PREFIX = "/api";

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
  console.log(`Please set ORGANIZATION to the organization this node belongs to.`);
  process.exit(1);
}
const organizationVaultSecret: string | undefined = process.env.ORGANIZATION_VAULT_SECRET;
if (!organizationVaultSecret) {
  console.log(
    `Please set ORGANIZATION_VAULT_SECRET to the secret key used to encrypt the organization's vault.`,
  );
  process.exit(1);
}

/*
 * Initialize the components:
 */

const multichainHost = process.env.RPC_HOST || "localhost";
const backupApiPort = process.env.BACKUP_API_PORT || "8085";

const rpcSettings: ConnectionSettings = {
  protocol: "http",
  host: multichainHost,
  port: parseInt(process.env.RPC_PORT || "8000", 10),
  username: process.env.RPC_USER || "multichainrpc",
  password: process.env.RPC_PASSWORD || "s750SiJnj50yIrmwxPnEdSzpfGlTAHzhaUwgqKeb0G1j",
};
logger.info({ rpcSettings }, "Connecting to MultiChain node");
const multichainClient = new RpcMultichainClient(rpcSettings);

const server = createBasicApp(jwtSecret, URL_PREFIX, port);

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
      registerNode(multichainClient, req);
    })
    .then(() => true)
    .catch(() => false);
}

registerRoutes(
  server,
  multichainClient,
  jwtSecret,
  rootSecret,
  organization!,
  organizationVaultSecret!,
  URL_PREFIX,
  multichainHost,
  backupApiPort,
);

console.log("Register fastify endpoint");

server.listen(port, "0.0.0.0", async err => {
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
