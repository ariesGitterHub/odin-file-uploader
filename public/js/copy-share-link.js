function copyShareLink() {
  // Get the text field
  const copyLink = document.getElementById("share-link-input");

  // Select the text field
  copyLink.select();
  copyLink.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyLink.value);

  // Alert the copied text
  alert("Copied the text: " + copyLink.value);
}

document.getElementById("copy-share-link-input").addEventListener("click", () => {
    copyShareLink()
})
