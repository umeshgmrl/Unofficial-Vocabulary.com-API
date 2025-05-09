const { parse } = require("node-html-parser");
const execSync = require('child_process').execSync;

// Constants
const TIMEOUT_MS = 10000;
const BASE_URL = 'https://www.vocabulary.com/dictionary';

// Validation
function validateWord(word) {
  if (!word || typeof word !== 'string') {
    throw new Error('Invalid word parameter');
  }
  if (word.length > 100) {
    throw new Error('Word parameter too long');
  }
  return word.trim();
}

// Utility function for making curl requests
async function fetchWithCurl(url) {
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
  -H 'user-agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' \
  --max-time ${TIMEOUT_MS / 1000}`;

  try {
    const response = await new Promise((resolve, reject) => {
      try {
        const result = execSync(curlCommand);
        resolve(result.toString());
      } catch (error) {
        reject(new Error(`Curl request failed: ${error.message}`));
      }
    });
    return response;
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Error handler wrapper
const asyncHandler = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((error) => {
    console.error(`API Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  });
};

// API Endpoints
exports.fetchSingleWord = asyncHandler(async (req, res) => {
  const word = validateWord(req.params.word);
  const data = await fetchWithCurl(
    `${BASE_URL}/definition.ajax?search=${encodeURIComponent(word)}&lang=en`
  );
  
  const root = parse(data);
  let definition;
  
  try {
    definition = root.querySelector(".short")?.rawText || 
                 root.querySelector(".long")?.rawText;
                 
    if (!definition) {
      throw new Error('Definition not found');
    }
    
    res.json({
      success: true,
      data: definition
    });
  } catch (error) {
    throw new Error(`Failed to parse definition: ${error.message}`);
  }
});

exports.fetchWords = asyncHandler(async (req, res) => {
  const text = validateWord(req.params.text);
  const pageOffset = parseInt(req.query.pageOffset) || 0;
  
  if (pageOffset < 0 || pageOffset > 1000) {
    throw new Error('Invalid page offset');
  }

  const data = await fetchWithCurl(
    `${BASE_URL}/autocomplete?search=${encodeURIComponent(text)}&startOffset=${pageOffset}`
  );
  
  try {
    const root = parse(data);
    const results = Array.from(root.querySelectorAll("li")).map(el => ({
      word: el.querySelector(".word")?.rawText,
      description: el.querySelector(".definition")?.rawText
    })).filter(item => item.word && item.description);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    throw new Error(`Failed to parse results: ${error.message}`);
  }
});

exports.fetchWordsFull = asyncHandler(async (req, res) => {
  const text = validateWord(req.params.text);
  
  const data = await fetchWithCurl(
    `${BASE_URL}/definition.ajax?search=${encodeURIComponent(text)}&lang=en`
  );
  
  try {
    const root = parse(data);
    const results = Array.from(root.querySelectorAll("ol li")).map((el) => {
      const definition = el.querySelector(".definition")?.rawText
        .split("\n")
        .map(el => el.trim())
        .filter(Boolean);

      if (!definition || definition.length < 2) {
        return null;
      }

      const properties = {};
      Array.from(el.querySelectorAll(".defContent dl")).forEach((el) => {
        const detailEl = el.querySelector(".detail");
        if (!detailEl) return;

        const key = detailEl.rawText
          .slice(0, -1)
          .toLowerCase()
          .split(" ")
          .join("_");

        const less = Array.from(el.querySelectorAll("dd"));
        if (!less.length) {
          const terms = Array.from(el.querySelectorAll(".word"))
            .map((el) => el.rawText)
            .filter(Boolean);
          if (terms.length) {
            properties[key] = terms;
          }
        } else {
          const kvPairs = less
            .map((el) => ({
              def: el.querySelector(".definition")?.rawText || "",
              terms: Array.from(el.querySelectorAll(".word"))
                .map((el) => el.rawText)
                .filter(Boolean)
            }))
            .filter(el => el.terms.length);
            
          if (kvPairs.length) {
            properties[key] = kvPairs;
          }
        }
      });

      return {
        pos: definition[0],
        def: definition[1],
        ...properties,
      };
    }).filter(Boolean);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    throw new Error(`Failed to parse full results: ${error.message}`);
  }
});