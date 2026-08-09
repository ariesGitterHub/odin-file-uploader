// const expirationSelect = document.querySelector(
//   "#share-folder-or-file-expires-at",
// );

// const customExpiration = document.querySelector("#custom-expiration");

// if (expirationSelect && customExpiration) {
//   expirationSelect.addEventListener("change", () => {
//     customExpiration.hidden = expirationSelect.value !== "custom";
//   });
// }
const expirationSelect = document.getElementById(
  "share-folder-or-file-expires-at",
);

const customExpiration = document.getElementById("custom-expiration");

const customExpirationInput = document.getElementById(
  "share-folder-or-file-custom-expires-at",
);

const timezoneInput = document.getElementById("share-folder-or-file-timezone");

// Tell the server which timezone the user's browser is using.
timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;

expirationSelect.addEventListener("change", () => {
  const isCustom = expirationSelect.value === "custom";

  customExpiration.hidden = !isCustom;
  customExpirationInput.required = isCustom;
});