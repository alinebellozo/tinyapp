const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

// tells the Express app to use EJS as its templating engine:
app.set("view engine", "ejs");

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  return Math.random().toString(36).substring(6);
}

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

const addUser = (email, password) => {
  let id = generateRandomString();
  users[id] = {
    id,
    email,
    password,
  };
  return id;
};

const checkEmail = (database, email) => {
  for (const user in database) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

// Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
  // If the user is not logged in, redirect GET /urls/new to GET /login
  if (!templateVars.user) {
    res.render("urls_login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
  res.redirect("/urls");
});

// responds with the new login form template
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  console.log(urlDatabase[shortURL]);
  res.redirect(`/urls/${shortURL}`);

  //If the user is not logged in, POST /urls should respond with an HTML message that tells the user why they cannot shorten URLs. Double check that in this case the URL is not added to the database.
});

// removes a URL resource:
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// updates a URL resource:
app.post("/urls/:id", (req, res) => {
  // updates the value of the stored long URL based on the new value in req.body
  const shortUrl = req.params.shortUrl;
  const longUrl = req.body.longUrl;
  urlDatabase[shortUrl] = longUrl;
  // redirects the client back to /urls
  res.redirect("/urls/new");
});

app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = checkEmail(users, enteredEmail);

  if (!user) {
    res.status(403).send("Oops, email not found");
  } else if (enteredPassword !== users[user].password) {
    res.status(403).send("Oops, wrong password");
  } else {
    res.cookie("user_id", user);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// adds a new user object to the users object
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  // checks if the fields are blank
  if (!enteredEmail && !enteredPassword) {
    res.status(400).send("Oops, the fields can't be blank");
  }
  // checks if the email was already registered
  if (checkEmail(users, enteredEmail)) {
    res
      .status(400)
      .send("This email is already registered. Please try using another.");
    // if those above are false, it creates a new user
  } else {
    const user_id = addUser(enteredEmail, enteredPassword);
    res.cookie("user_id", user_id);
    console.log(users);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
