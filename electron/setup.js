const form = document.querySelector("#setup-form");
const status = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");
const mongoUri = document.querySelector("#mongo-uri");
const adminEmail = document.querySelector("#admin-email");

window.desktopSetup.getSettings().then((settings) => {
  mongoUri.value = settings.mongoUri;
  adminEmail.value = settings.adminEmail;
  if (settings.hasExistingPassword) {
    document.querySelector("#admin-password").placeholder = "Leave blank to keep current setup";
  }
}).catch((error) => {
  status.textContent = error.message || "Could not load saved settings.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  saveButton.disabled = true;
  try {
    const result = await window.desktopSetup.saveSettings({
      mongoUri: mongoUri.value,
      adminEmail: adminEmail.value,
      adminPassword: document.querySelector("#admin-password").value,
    });
    if (!result.ok) status.textContent = result.message;
  } catch (error) {
    status.textContent = error.message || "Could not save settings.";
  } finally {
    saveButton.disabled = false;
  }
});
