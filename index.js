import express from "express";
import {createClient} from "redis";

const app = express()
const port = 3000

app.use(express.json())

const client = await createClient();
await client.connect();

const addServer = async (name) => {
  const servers = JSON.parse(await client.get(key)) || [];
  servers.push(name);
  await client.set(key, JSON.stringify([...new Set(servers)]));
}

const removeServer = async (name) => {
  const servers = JSON.parse(await client.get(key)) || [];
  const newServers = servers.filter((x) => x !== name);
  await client.set(key, JSON.stringify(newServers));
}

const getServers = async () => JSON.parse(await client.get(key)) || []

const key = "servers";
app.get('/get-server', async (req, res) => {
  res.send(JSON.stringify(await getServers()))
})

app.post('/create-server', async (req, res) => {
  if (!req.body) {
    res.status(400).send("body is required");
  }

  const name = req.body.name;

  if (!name) {
    res.status(400).send("name is required");
  }

  await addServer(name);

  res.send("added")
});

app.delete('/delete-server', async (req, res) => {
  if (!req.body) {
    res.status(400).send("body is required");
  }

  const name = req.body.name;

  if (!name) {
    res.status(400).send("name is required");
  }

  await removeServer(name);

  res.send("removed")
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

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