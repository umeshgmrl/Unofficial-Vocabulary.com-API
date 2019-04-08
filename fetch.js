const fetch = require("node-fetch");
const { parse } = require("node-html-parser");

exports.fetchSingleWord = (req, res) => {
  fetch(
    `https://www.vocabulary.com/dictionary/definition.ajax?search=${
      req.params.word
    }&lang=en`
  )
    .then(res => res.text())
    .then(data => {
      const root = parse(data);
      let rawText;
      try {
        rawText = root.querySelector("p.short").rawText;
      } catch (e) {
        rawText = root.querySelector("h3.definition").rawText;
      }
      res.json({
        success: true,
        data: rawText
      });
    });
};

exports.fetchWords = (req, res) => {
  fetch(
    `https://www.vocabulary.com/dictionary/autocomplete?search=${
      req.params.text
    }`
  )
    .then(res => res.text())
    .then(data => {
      const root = parse(data);
      const rawText = root.rawText;
      const words = rawText
        .split("\r\n")
        .filter(text => text.length > 2)
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
