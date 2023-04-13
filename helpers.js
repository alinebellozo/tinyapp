const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

module.exports = { getUserByEmail };
