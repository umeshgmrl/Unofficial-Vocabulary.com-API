const express = require("express");
const app = express();
const port = process.env.PORT || 80;
const cors = require('cors');
const { fetchSingleWord, fetchWords } = require("./fetch");

app.use(cors());
app.get("/", (req, res) => {
  res.json({
    name: "unofficial vocabulary.com api - test",
    status: "working"
  })
});
app.get("/word/:word", fetchSingleWord);
app.get("/words/:text", fetchWords);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
