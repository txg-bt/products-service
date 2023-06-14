const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.set("port", process.env.PORT || 3003);
//app.set("trust proxy", true);

app.use("/api/v1/reviews", require("./src/routes/reviews"));
app.use("/api/v1/products", require("./src/routes/products"));

app.get("*", async (req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(app.get("port"), function () {
  console.log(`Starting server on port ${app.get("port")}`);
});
