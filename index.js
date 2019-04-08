const express = require("express");
const app = express();
const port = 3000;
const { fetchWord, fetchWords } = require("./fetch");

app.get("/fetchWord", fetchWord);
app.get("/fetchWords", fetchWords);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
