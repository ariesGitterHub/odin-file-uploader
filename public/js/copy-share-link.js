function copyShareLink(button) {
  const shareLinkCard = button.closest(".share-link-card");
  const shareLinkInput = shareLinkCard.querySelector(".share-link-input");

  navigator.clipboard.writeText(shareLinkInput.value);

  // alert("Copied the text: " + shareLinkInput.value);
}

let count = 1;

document.querySelectorAll(".copy-share-link-button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = `link copied! (${count++})`;
    copyShareLink(button);
  });
});
