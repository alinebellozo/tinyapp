const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const {
  getUserByEmail,
  generateRandomString,
  addUser,
  urlsForUser,
} = require("./helpers");
const { urlDatabase, users } = require("./database");
const app = express();
const PORT = 8080; // default port

// tells the Express app to use EJS as its templating engine:
app.set("view engine", "ejs");

// middleware

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

// routes

app.get("/", (req, res) => {
  if (req.session["userID"]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (!req.session["userID"]) {
    return res.status(400).send("you are not logged in ");
  }

  const templateVars = {
    user: users[req.session["userID"]],
    urls: urlsForUser(req.session["userID"]),
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session["userID"]) {
    return res.redirect("/login")
  }

  const templateVars = { user: users[req.session["userID"]] };  
  res.render("urls_new", templateVars);
});

// specific id (shortURL)
app.get("/urls/:id", (req, res) => {
  if (!req.session["userID"]) {
    return res.status(400).send("Oops, you are not logged in");
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("Oops, this URL doesn't exist");
  }

  if (req.session["userID"] !== urlDatabase[req.params.id]["userID"]) {
    return res.status(400).send("Oops, this URL doesn't belong to you.");
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.session["userID"]],
  };

  res.render("urls_show", templateVars);
  
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("Oops, this URL doesn't exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user: undefined };
  res.render("urls_register", templateVars);
});

// responds with the new login form template
app.get("/login", (req, res) => {
  const templateVars = { user: undefined };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session["userID"]) {
    return res.status(400).send("Oops, you are not logged in");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session["userID"],
  };

  res.redirect(`/urls/${shortURL}`);
});

// removes a URL resource:
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session["userID"]) {
    return res.status(400).send("Oops, you are not logged in");
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("Oops, this URL doesn't exist");
  }

  if (req.session["userID"] !== urlDatabase[req.params.id]["userID"]) {
    return res.status(400).send("Oops, this URL doesn't belong to you.");
  }
 
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// updates a URL resource:
app.post("/urls/:id", (req, res) => {
  if (!req.session["userID"]) {
    return res.status(400).send("Oops, you are not logged in");
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("Oops, this URL doesn't exist");
  }

  if (req.session["userID"] !== urlDatabase[req.params.id]["userID"]) {
    return res.status(400).send("Oops, this URL doesn't belong to you.");
  }
  // updates the value of the stored long URL based on the new value in req.body
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = getUserByEmail(enteredEmail, users);

  if (!user) {
    res.status(403).send("Oops, email not found");
  } else if (!bcrypt.compareSync(enteredPassword, users[user]["password"])) {
    res.status(403).send("Oops, wrong password");
  } else {
    req.session["userID"] = users[user]["id"];
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// adds a new user object to the users object
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  // checks if the fields are blank
  if (!enteredEmail || !enteredPassword) {
    res.status(400).send("Oops, the fields can't be blank");
  }
  // checks if the email was already registered
  if (getUserByEmail(enteredEmail, users)) {
    res
      .status(400)
      .send(
        "Oops, this email is already registered. Please try using another."
      );
    // if those above are false, it creates a new user
  } else {
    const user_id = addUser(enteredEmail, enteredPassword);
    req.session["userID"] = user_id;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
