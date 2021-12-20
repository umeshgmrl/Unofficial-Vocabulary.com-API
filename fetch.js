const fetch = require("node-fetch");
const { parse } = require("node-html-parser");
const maxWordLimit = 19;

exports.fetchSingleWord = (req, res) => {
  fetch(
    `https://www.vocabulary.com/dictionary/definition.ajax?search=${req.params.word
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

const fetchWordsBase = (text, startOffset = 0) => {
  return fetch(`https://www.vocabulary.com/dictionary/autocomplete?search=${text}&startOffset=${startOffset}`)
    .then(res => res.text())
    .then(data => {
      const root = parse(data);
      const result = Array.from(root.querySelectorAll("li")).map(el => {
        const word = el.querySelector(".word").rawText;
        const description = el.querySelector(".definition").rawText;
        return { word, description }
      });
      return result;
    });
};

exports.fetchWords = async (req, res) => {
  const data = await fetchWordsBase(req.params.text);
  res.json({
    success: true,
    data
  });
};

exports.fetchWordsAll = async (req, res) => {
  const { text } = req.params;
  let currentOffset = 0;
  let allWords = [];
  let words = [];
  do {
    words = await fetchWordsBase(text, currentOffset);
    allWords = [...allWords, ...words];
    currentOffset = currentOffset + maxWordLimit;
  } while (words.length >= maxWordLimit && currentOffset < 280);
  
  res.json({
    success: true,
    data: allWords
  })
}

exports.fetchWordsFull = (req, res) => {
  fetch(
    `https://www.vocabulary.com/dictionary/definition.ajax?search=${req.params.text
    }&lang=en`
  )
    .then(res => res.text())
    .then(data => {
      const root = parse(data);
      const result = Array.from(root.querySelectorAll("ol li")).map((el) => {
        const definition = el.querySelector(".definition").rawText.split("\n").map(el => el.trim()).filter(Boolean);
        const properties = {};
        Array.from(el.querySelectorAll(".defContent dl")).forEach((el) => {
          const key = el
            .querySelector(".detail")
            .rawText.slice(0, -1)
            .toLowerCase()
            .split(" ")
            .join("_");
          const less = Array.from(el.querySelectorAll("dd"));
          if (!less.length) {
            const terms = Array.from(el.querySelectorAll(".word")).map((el) => el.rawText);
            properties[key] = terms;
          } else {
            const kvPairs = less.map((el) => {
              const def = el.querySelector(".definition") ? el.querySelector(".definition").rawText : "";
              const terms = Array.from(el.querySelectorAll(".word")).map((el) => el.rawText);
              return {
                def,
                terms,
              };
            }).filter(el => el.terms.length);
            properties[key] = kvPairs;
          }
        });
        return {
          pos: definition[0],
          def: definition[1],
          ...properties,
        };
      });
      res.json({
        success: true,
        data: result
      });
    });
};