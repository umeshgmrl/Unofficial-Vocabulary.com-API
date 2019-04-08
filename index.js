const fetch = require('node-fetch');
const { parse } = require('node-html-parser');

fetch(`https://www.vocabulary.com/dictionary/definition.ajax?search=assess&lang=en`)
      .then(res => res.text())
      .then(data => {
      	const root = parse(data);
      	const rawText = root.querySelector('p.short').rawText;
      	console.log({
      		success: true,
      		data: rawText
      	})
      })


fetch(`https://www.vocabulary.com/dictionary/autocomplete?search=w`)
      .then(res => res.text())
      .then(data => {
        let div = document.createElement('div');
        div.innerHTML = data;
        const words = div.innerText.split('\n').filter(Boolean).map(wordData => {
          let wordArray = wordData.split(' ');
          return {
            name: wordArray.shift(),
            description: wordArray.join(' ')
          }
        });
        this.setState({
          words
        }, () => {
          div = null;
        })
      })
