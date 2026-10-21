'use strict';

import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import { fileURLToPath, pathToFileURL } from "url";
import process from "process";
import configs from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = configs[env];

const databaseUrl = process.env[config.use_env_variable];
if (!databaseUrl) {
  throw new Error(`Missing ${config.use_env_variable} in backend/.env (see backend/.env.example).`);
}

const db = {};

const sequelize = new Sequelize(databaseUrl, config);

const files = fs.readdirSync(__dirname).filter(file =>
  file.indexOf(".") !== 0 &&
  file !== basename &&
  file.slice(-3) === ".js" &&
  file.indexOf(".test.js") === -1
);

for (const file of files) {
  const modelModule = await import(pathToFileURL(path.join(__dirname, file)).href);
  const model = modelModule.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Run associations
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
