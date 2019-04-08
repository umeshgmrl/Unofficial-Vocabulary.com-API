const fetch = require("node-fetch");
const { parse } = require("node-html-parser");

exports.fetchWord = (req, res) => {
  fetch(
    `https://www.vocabulary.com/dictionary/definition.ajax?search=assess&lang=en`
  )
    .then(res => res.text())
    .then(data => {
      const root = parse(data);
      const rawText = root.querySelector("p.short").rawText;
      res.json({
        success: true,
        data: rawText
      });
    });
};

exports.fetchWords = (req, res) => {
  fetch(`https://www.vocabulary.com/dictionary/autocomplete?search=w`)
    .then(res => res.text())
    .then(data => {
      const root = parse(data);
      const rawText = root.rawText;
      const words = rawText
        .split("\r\n")
        .filter(Boolean)
        .map(wordData => {
          let wordArray = wordData.split(" ");
          return {
            name: wordArray.shift(),
            description: wordArray.join(" ")
          };
        });
      res.json({
        success: true,
        data: words
      });
    });
};
