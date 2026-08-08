const expirationSelect = document.querySelector(
  "#share-folder-or-file-expires-at",
);

const customExpiration = document.querySelector("#custom-expiration");

if (expirationSelect && customExpiration) {
  expirationSelect.addEventListener("change", () => {
    customExpiration.hidden = expirationSelect.value !== "custom";
  });
}
