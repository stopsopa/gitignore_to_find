import { Router } from "express";
import { z } from "zod";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formSchema, defaultFormValues } from "../schema/formSchema.ts";
import type { FormType } from "../schema/formSchema.ts";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../data");

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

const router = Router();

// Endpoint to get default values
router.get("/create", (_req, res) => {
  res.json(defaultFormValues);
});

// Endpoint to list all entities (raw HTML)
router.get("/list", async (_req, res) => {
  await ensureDataDir();
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    let html = "<h1>Form Entities</h1><ul>";
    for (const file of jsonFiles) {
      const id = file.replace(".json", "");
      html += `<li><a href="/form-ui/index.html?id=${id}">${id}</a></li>`;
    }
    html += "</ul>";
    html += '<p><a href="/form-ui/index.html">Create New</a></p>';

    res.send(html);
  } catch (error) {
    res.status(500).send("Error reading data directory");
  }
});

// Endpoint to get a specific entity
router.get("/entity/:id", async (req, res) => {
  const { id } = req.params;
  const filePath = path.join(DATA_DIR, `${id}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(404).json({ error: "Entity not found" });
  }
});

// Endpoint to save (create or update)
router.post("/save", async (req, res) => {
  const result = formSchema.safeParse(req.body);

  if (!result.success) {
    // Extract Zod errors in a structured manner
    const errors = z.treeifyError(result.error);
    return res.status(400).json({ errors });
  }

  const data: FormType = result.data;
  const id = data.id || randomUUID();
  data.id = id;

  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${id}.json`);

  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: "Failed to save data" });
  }
});

export default router;
