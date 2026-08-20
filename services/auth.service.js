const prisma = require("../lib/prisma");

// Ensures email uniqueness at sign-up
async function checkIfEmailExistsForSignUp(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });
}

// Ensures email uniqueness when user updates profile
async function checkIfEmailAlreadyExists(email, targetId) {
  return prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: targetId,
      },
    },
    select: {
      id: true,
    },
  });
}

module.exports = {
  checkIfEmailExistsForSignUp,
  checkIfEmailAlreadyExists,
};
