const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

// tells the Express app to use EJS as its templating engine:
app.set("view engine", "ejs");

// middleware

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

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

const checkEmail = (database, email) => {
  for (const user in database) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  const filteredUser = {};
  let db = Object.keys(urlDatabase);

  for (let urlID of db) {
    if (urlDatabase[urlID]["userID"] === id) {
      console.log(urlDatabase[urlID]["userID"]);
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
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"]),
  };

  if (!templateVars.user) {
    res.status(400).send("You need to be logged in to access the URLs");
  } else {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
  // If the user is not logged in, redirect GET /urls/new to GET /login
  if (!templateVars.user) {
    res
      .status(400)
      .send("Oops, you need to register or login to access this page.");
  }
  if (
    req.cookies["user_id"] !== urlDatabase[templateVars.shortURL]["user_id"]
  ) {
    res.status(400).send("Oops, this URL is not yours.");
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
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
});

// removes a URL resource:
app.post("/urls/:id/delete", (req, res) => {
  const user = req.cookies["user_id"];
  const id = req.params.id;
  if (user !== urlDatabase[id]["userID"]) {
    console.log("Oops, you are not allowed to delete this URL.");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

// updates a URL resource:
app.post("/urls/:id", (req, res) => {
  // updates the value of the stored long URL based on the new value in req.body
  const shortUrl = req.params.shortUrl;
  const longUrl = req.body.longUrl;
  urlDatabase[shortUrl].longUrl = longUrl;
  const user = req.cookies["user_id"];
  // redirects the client back to /urls
  if (user !== urlDatabase[shortUrl]["user_id"]) {
    res.status(400).send("Oops, you are not allowed to edit this URL.");
  } else {
    urlDatabase[shortUrl].longUrl = longUrl;
    res.redirect(`/urls/${shortUrl}`);
  }
  res.redirect("/urls/new");
});

app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = checkEmail(users, enteredEmail);

  if (!user) {
    res.status(403).send("Oops, email not found");
  } else if (!bcrypt.compareSync(enteredPassword, users[user]["password"])) {
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
