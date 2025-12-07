import { MongoClient } from "mongodb";
import config from "../config/index.js";

let client;
let db;

const connectDb = async () => {
  try {
    if (!client) {
      client = new MongoClient(config.mongodb_uri);

      await client.connect();
      db = client.db(config.db_name);

      console.log("MongoDB connected successfully");
    }

    return db;
  } catch (error) {
    console.error("Mongodb connection error: ", error);
    process.exit(1);
  }
};

export default connectDb;
