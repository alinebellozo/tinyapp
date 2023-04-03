const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

// tells the Express app to use EJS as its templating engine:
app.set("view engine", "ejs");

//
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  return Math.random().toString(36).substring(6);
}

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const longUrl = req.body.longUrl;
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = longUrl;
  res.redirect(`/urls/${shortUrl}`);
});

// route that removes a URL resource:
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// route that updates a URL resource:
app.post("/urls/:id", (req, res) => {
  // it updates the value of the stored long URL based on the new value in req.body
  const shortUrl = req.params.shortUrl;
  const longUrl = req.body.longUrl;
  urlDatabase[shortUrl] = longUrl;
  // redirect the client back to /urls
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
