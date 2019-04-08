const express = require("express");
const app = express();
const port = 3000;
const { fetchSingleWord, fetchWords } = require("./fetch");

app.get("/word/:word", fetchSingleWord);
app.get("/words/:text", fetchWords);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
