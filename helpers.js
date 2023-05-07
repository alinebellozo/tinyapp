const { urlDatabase, users } = require("./database");
const bcrypt = require("bcryptjs");

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

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
  const result = {};

  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      result[shortURL] = urlDatabase[shortURL].longURL
    }
  }
  return result;
};

module.exports = { getUserByEmail, generateRandomString, addUser, urlsForUser };