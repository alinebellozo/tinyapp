const { assert } = require("chai");

const { getUserByEmail } = require("../helpers");

const testUsers = {
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

describe("getUserByEmail", function () {
  it("should return a user with a valid email", function () {
    const user = getUserByEmail("sasha@example.com", testUsers);
    const expectedUserID = "user2ID";
    assert.equal(user, expectedUserID);
  });

  it("should return a user with an invalid email", function () {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = false;
    assert.equal(user, expectedUserID);
  });
});
