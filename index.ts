import express from "express";
import { createClient } from "redis";

interface Server {
  id: string;
  url: string;
}

const app = express();
const port = 3000;

app.use(express.json());

const key = "servers";
const client = createClient();
await client.connect();

/**
 * TODO - publish an event to all wss on reset of server list,
 * allowing them all to re-register. this way the load balancer
 * can be restarted without needing to reboot all wss instances.
 */
await client.del(key);

const addServer = async (name: string) => {
  const servers = JSON.parse((await client.get(key)) ?? "[]") || [];
  servers.push(name);
  await client.set(key, JSON.stringify([...new Set(servers)]));
};

const removeServer = async (name: string) => {
  const servers = JSON.parse((await client.get(key)) ?? "[]") || [];
  const newServers = servers.filter((x: string) => x !== name);
  await client.set(key, JSON.stringify(newServers));
};

const getServers = async (): Promise<Array<Server>> =>
  JSON.parse((await client.get(key)) ?? "[]") || [];

app.get("/servers/provision", async (req, res) => {
  res.send(JSON.stringify(await getServers()));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const shutdown = async () => {
  try {
    await client.quit();
  } catch {
    client.destroy();
  } finally {
    process.exit(0);
  }
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
