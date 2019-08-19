const express = require("express");
const app = express();
const port = process.env.PORT || 7778;
const cors = require('cors');
const { fetchSingleWord, fetchWords } = require("./fetch");

app.use(cors());
app.get("/word/:word", fetchSingleWord);
app.get("/words/:text", fetchWords);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
