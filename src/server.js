import app from "./app.js";
import config from "./config/index.js";
import connectDb from "./db/index.js";

const port = config.port;

const startServer = async () => {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`Server is running on: ${port}`);
    });
  } catch (error) {
    console.error("Database error: ", error);
  }
};

startServer();
