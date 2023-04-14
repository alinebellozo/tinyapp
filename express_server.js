const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

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

// databases

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userID: {
    id: "userID",
    email: "xuxa@example.com",
    password: "purplemonkeydinosaur",
  },
  user2ID: {
    id: "user2ID",
    email: "sasha@example.com",
    password: "dishwasherfunk",
  },
};

// functions

function generateRandomString() {
  return Math.random().toString(36).substring(6);
}

const addUser = (email, password) => {
  let id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[id] = {
    id,
    email,
    password: hashedPassword,
  };
  return id;
};

const urlsForUser = (id) => {
  const filteredUser = {};
  let db = Object.keys(urlDatabase);

  for (let urlID of db) {
    if (urlDatabase[urlID]["userID"] === id) {
      filteredUser[urlID] = urlDatabase[urlID];
    }
  }
  return filteredUser;
};

// routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
    urls: urlsForUser(req.session["user_id"]),
  };

  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("Oops, you need to be logged in to access this page");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  // If the user is not logged in, redirect GET /urls/new to GET /login
  if (!templateVars.user) {
    res.render("urls_login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});

// specific id (shortURL)
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.session["user_id"]],
  };
  if (req.session["user_id"] === urlDatabase[templateVars.id]["userId"]) {
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("Oops, this URL doesn't belong to you.");
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session["user_id"]] };
  res.render("urls_register", templateVars);
  res.redirect("/urls");
});

// responds with the new login form template
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session["user_id"]] };
  res.render("urls_login", templateVars);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"],
  };

  res.redirect(`/urls/${shortURL}`);
});

// removes a URL resource:
app.post("/urls/:id/delete", (req, res) => {
  const user = req.session["user_id"];
  const id = req.params.id;
  if (user !== urlDatabase[id]["userID"]) {
    res.status(400).send("Oops, you are not allowed to delete this URL.");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

// updates a URL resource:
app.post("/urls/:id", (req, res) => {
  // updates the value of the stored long URL based on the new value in req.body
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL]["longURL"] = longURL;
  const user = req.session["user_id"];
  // redirects the client back to /urls
  if (user !== urlDatabase[shortURL]["user_id"]) {
    res.status(400).send("Oops, you are not allowed to edit this URL.");
  } else {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  }
  res.redirect("/urls/new");
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
    req.session["user_id"] = users[user]["id"];
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
    req.session["user_id"] = user_id;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
