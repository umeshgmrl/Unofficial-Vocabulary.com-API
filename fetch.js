const { parse } = require("node-html-parser");
const execSync = require('child_process').execSync;

function fetchWithCurl(url) {
  const curlCommand = `curl '${url}' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'cache-control: no-cache' \
  -H 'pragma: no-cache' \
  -H 'priority: u=0, i' \
  -H 'sec-ch-ua: "Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?1' \
  -H 'sec-ch-ua-platform: "Android"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: none' \
  -H 'sec-fetch-user: ?1' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'`;


  return new Promise((resolve, reject) => {
    try {
      const response = execSync(curlCommand);
      resolve(response.toString());
    } catch (error) {
      reject(new Error(`Curl request failed: ${error.message}`));
    }
  });
}


exports.fetchSingleWord = (req, res) => {
  fetchWithCurl(
    `https://www.vocabulary.com/dictionary/definition.ajax?search=${req.params.word}&lang=en`
  )
    .then(data => {
      res.json(data);
      // const root = parse(data);
      // let rawText;
      // try {
      //   rawText = root.querySelector(".short").rawText;
      // } catch (e) {
      //   rawText = root.querySelector(".long").rawText;
      // }
      // res.json({
      //   success: true,
      //   data: rawText
      // });
    });
};

const fetchWordsBase = (text, pageOffset = 0) => {
  return fetchWithCurl(`https://www.vocabulary.com/dictionary/autocomplete?search=${text}&startOffset=${pageOffset}`)
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
  const { pageOffset } = req.query;
  const { text } = req.params;
  const data = await fetchWordsBase(text, pageOffset);
  res.json({
    success: true,
    data
  });
};

exports.fetchWordsFull = (req, res) => {
  fetchWithCurl(
    `https://www.vocabulary.com/dictionary/definition.ajax?search=${req.params.text
    }&lang=en`
  )
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
