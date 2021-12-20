const express = require("express");
const app = express();
app.set('json spaces', 2)
const port = process.env.PORT || 80;
const cors = require('cors');
const { fetchSingleWord, fetchWords, fetchWordsFull, fetchWordsAll } = require("./fetch");

app.use(cors());
app.get("/", (req, res) => {
  res.json({
    name: "unofficial vocabulary.com api - test",
    status: "working"
  })
});
app.get("/word/:word", fetchSingleWord);
app.get("/words/:text", fetchWords);
app.get("/words-full/:text", fetchWordsFull);
app.get("/words-all/:text", fetchWordsAll);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
