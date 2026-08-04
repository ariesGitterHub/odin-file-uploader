const modal = document.getElementById("deletion-modal");
const form = document.getElementById("deletion-form");
const message = document.getElementById("deletion-message");

document.addEventListener("click", (e) => {
  const button = e.target.closest(".deletion-form-button");
  if (!button) return;

  form.action = button.dataset.action;
  message.textContent = button.dataset.message;

  modal.hidden = false;
});

document.getElementById("cancel-deletion").addEventListener("click", () => {
  modal.hidden = true;
});
