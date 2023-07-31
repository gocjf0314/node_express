import express from "express";

// Create express app
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello world!");
});

// Starting server listening port
app.listen(port, () => {
  console.log(`Example app listening port on ${port}`);
});
