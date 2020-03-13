const express = require("express");
const app = express();
const { Liquid } = require("liquidjs");
const engine = new Liquid({
  root: "./pages"
});

app.engine("liquid", engine.express());
app.set("views", "./pages");
app.set("view engine", "liquid");
app.use(express.static("./pages"));

app.get("/", (req, res, next) => {
  res.render("index", { refreshScript: process.env.BROWSER_REFRESH_URL });
});

app.listen(3000, () => {
  console.log(process.env.BROWSER_REFRESH_URL);
  console.log("Server listening on port 3000");
  if (process.send) {
    process.send("online");
  }
});
