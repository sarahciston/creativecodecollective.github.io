const express = require("express");
const app = express();
const pug = require('pug');
const fs = require('fs');
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

app.set('view engine', 'pug');
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render('index', { title: 'Creative Code Collective' });
})

const TempPouchDB = PouchDB.defaults();
app.use('/db', require('express-pouchdb')(TempPouchDB));
const db = new PouchDB("database");

// let resources = {};
// // get all the json files from resources/
// // loop through and fs.readFile them and parse them and add them to database
// fs.readFile('./resources/NatureOfCode.json', (err, data) => {
//   if (err) {
//     console.log(`Error reading file from disk: ${err}`);
//   } else {
//     const resources = JSON.parse(data);
//     console.log(resources);
//   }
// });

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html

function getResources(query) {
  // no keys in query: not a search
  if (Object.keys(query).length === 0 && query.constructor === Object) {
    return Promise.reject(new Error('empty query'));
  }
  
  // filter out empty key-value pairs
  let selector = {};
  for (let key in query) {
    if (query[key] !== '') { // if not empty
      selector[key] = { "$elemMatch": query[key] };
    }
  }
  
  if (Object.keys(selector).length === 0 && selector.constructor === Object) {
    // empty query -> get all docs
    return db.allDocs({
      include_docs: true,
      end_key: "_design"
    }).then(result => {
      return result.rows.map(result => result.doc);
    }).catch(err => {
      return Promise.reject(new Error(err));
    });
  } else {
    // non-empty query -> get specified docs
    return db.createIndex({
      index: { fields: Object.keys(selector) }
    }).then(result => {
      return db.find({
        selector: selector
      });
    }).then(result => {
      return result.docs;
    }).catch(err => {
      return Promise.reject(new Error(err));
    });
  }
}

app.get('/resources', function (req, res) {
  getResources(req.query)
    .then(result => {
      res.render('resources', {
        title: 'Resources',
        results: result
      });
    })
    .catch(err => {
      res.render('resources', {
        title: 'Resources',
        results: null
      })
    });
});

app.get('/db_info', function(req, res){
  db.info()
    .then(function(r) {
      console.log(r);
      res.send(r);
    }).catch(function(err){
      console.error(err)
    });
})

//bulkAdd
app.get('/bulkAdd', function(req, res) {
  let cleanData = fs.readFileSync(""); //name of bulk add file goes here
  cleanData = JSON.parse(cleanData);
  
  db.bulkDocs(cleanData)
    .then(function(r){
      console.log(r)
      res.send(r)
  }).catch(err=>{console.log(err)}) 
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
