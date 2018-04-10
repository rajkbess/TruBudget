import * as express from "express";
import * as bodyParser from "body-parser";
import * as expressJwt from "express-jwt";

import { authorize, authorized } from "./authz";
import { SimpleIntent } from "./authz/intents";
import { RpcMultichainClient } from "./multichain";
import { randomString } from "./multichain/hash";
import ProjectModel from "./project";
import UserModel from "./user";

const multichainClient = new RpcMultichainClient({
  protocol: "http",
  host: process.env.RPC_HOST || "localhost",
  port: parseInt(process.env.RPC_PORT || "8000", 10),
  username: process.env.RPC_USER || "multichainrpc",
  password: process.env.RPC_PASS || "s750SiJnj50yIrmwxPnEdSzpfGlTAHzhaUwgqKeb0G1j"
});

const app = express();
app.use(bodyParser.json());

const jwtSecret = process.env.JWT_SECRET || randomString(32);
if (jwtSecret.length < 32) {
  console.log("Warning: the JWT secret key should be at least 32 characters long.");
}
app.use(
  expressJwt({ secret: jwtSecret }).unless({
    path: ["/health", "/user.authenticate"]
  })
);
app.use(function customAuthTokenErrorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send("A valid JWT auth bearer token is required for this route.");
  }
});

const projectModel = new ProjectModel(multichainClient);
const userModel = new UserModel(multichainClient, jwtSecret);

const router = express.Router();

router.get("/health", (req, res) => res.status(200).send("OK"));

router.post("/user.create", async (req, res) => {
  const intent = req.path.substring(1);
  const body = req.body;
  console.log(`body: ${JSON.stringify(body)}`);
  if (body.apiVersion !== "1.0") {
    res.status(412).send(`API version ${body.apiVersion} not implemented.`);
    return;
  }
  if (!body.data) {
    res.status(400).send(`Expected "data" in body.`);
    return;
  }

  try {
    const createdUser = await userModel.create(body.data, authorized(req.user, intent));
    res.status(201).json(createdUser);
  } catch (err) {
    switch (err.kind) {
      case "NotAuthorized":
        console.log(err);
        res.status(403).send(`User ${req.user} is not authorized to execute ${intent}`);
        break;
      case "UserAlreadyExists":
        console.log(err);
        res.status(409).send(`The user already exists.`);
        break;
      case "MissingKeys":
        console.log(err);
        res.status(400).send(`Missing keys: ${err.missingKeys.join(", ")}`);
        break;
      default:
        console.log(err);
        res.status(500).send("INTERNAL SERVER ERROR");
    }
  }
});

router.post("/user.authenticate", async (req, res) => {
  const intent = req.path.substring(1);
  const body = req.body;
  console.log(`body: ${JSON.stringify(body)}`);
  if (body.apiVersion !== "1.0") {
    res.status(412).send(`API version ${body.apiVersion} not implemented.`);
    return;
  }
  if (!body.data) {
    res.status(400).send(`Expected "data" in body.`);
    return;
  }

  try {
    const jwt = await userModel.authenticate(body.data);
    res.status(200).send(jwt);
  } catch (err) {
    switch (err.kind) {
      case "MissingKeys":
        console.log(err);
        res.status(400).send(`Missing keys: ${err.missingKeys.join(", ")}`);
        break;
      case "AuthenticationError":
        console.log(err);
        res.status(401).send(`Authentication failed.`);
        break;
      default:
        console.log(err);
        res.status(500).send("INTERNAL SERVER ERROR");
    }
  }
});

router.get("/project.list", async (req, res) => {
  // Returns all projects the user is allowed to see
  const intent = req.path.substring(1);
  const user = req.params.user || "alice";
  try {
    const projects = await projectModel.list(authorized(user, intent));
    res.json(projects);
  } catch (err) {
    console.log(err);
    res.status(500).send("INTERNAL SERVER ERROR");
  }
});

router.post("/project.create", async (req, res) => {
  const intent = req.path.substring(1);
  const user = req.params.user || "alice";
  try {
    const id = await projectModel.createProject(req.body, authorized(user, intent));
    res.status(201).send(id);
  } catch (err) {
    if (err.kind === "NotAuthorized") {
      console.log(err);
      res.status(403).send(`User ${user} is not authorized to execute ${intent}`);
    } else {
      console.log(err);
      res.status(500).send("INTERNAL SERVER ERROR");
    }
  }
});

app.use("/", router);

export default app;
