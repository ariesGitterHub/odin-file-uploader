// function copyShareLink() {
//   // Get the text field
//   const shareLinkInput = document.getElementById("share-link-input");

//   // Select the text field
//   shareLinkInput.select();
//   shareLinkInput.setSelectionRange(0, 99999); // For mobile devices

//   // Copy the text inside the text field
//   navigator.clipboard.writeText(shareLinkInput.value);

//   // Alert the copied text
//   alert("Copied the text: " + shareLinkInput.value);
// }

// document.getElementById("copy-share-link-input").addEventListener("click", () => {
//     copyShareLink()
// })

function copyShareLink(button) {
  const shareLinkCard = button.closest(".share-link-card");
  const shareLinkInput = shareLinkCard.querySelector(".share-link-input");

  navigator.clipboard.writeText(shareLinkInput.value);

  alert("Copied the text: " + shareLinkInput.value);
}

let count = 1

document.querySelectorAll(".copy-share-link-button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = `link copied! (${count++})`
    copyShareLink(button);
  });
});