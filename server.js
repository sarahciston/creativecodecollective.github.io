// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const pug = require('pug');
const fs = require('fs');

app.set('view engine', 'pug');

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
// app.get("/", (request, response) => {
//   response.sendFile(__dirname + "/views/index.html");
// });

app.get("/", function (req, res) {
  res.render('index', { title: 'Creative Code Collective' })
})

app.get('/resources', function (req, res) {
  res.render('resources', { title: 'Resources' })
})

app.all('/search', function (req, res) {
  //search action gets processed here
  console.log(req.query.do);
  let resources = {};
  // get all the json files from resources/
  // loop through and fs.readFile them and parse them and add them to resources
  // render/redirect the resources page with the relevant resources
  fs.readFile('./resources/NatureOfCode.json', (err, data) => {
    if (err) {
      console.log(`Error reading file from disk: ${err}`);
    } else {
      const resources = JSON.parse(data);
      console.log(resources);
      // res.redirect('resources', {
      //   title: 'Resources',
      //   resources: resources
      // });
    }
  });
  // res.render('resources', { title: 'Resources'} )
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
