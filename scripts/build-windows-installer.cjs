const fs = require("node:fs/promises");
const path = require("node:path");
const { createWindowsInstaller } = require("electron-winstaller");

const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "release", "squirrel-installer");

async function buildInstaller() {
  await fs.mkdir(outputDirectory, { recursive: true });
  const generatedFiles = [
    "Setup.exe",
    "IET Billing System Setup 1.0.0.exe",
    "RELEASES",
    "iet-billing-desktop-1.0.0-full.nupkg",
  ];
  await Promise.all(generatedFiles.map((name) => fs.rm(path.join(outputDirectory, name), { force: true })));

  await createWindowsInstaller({
    appDirectory: path.join(projectRoot, "release", "win-unpacked"),
    outputDirectory,
    nuspecTemplate: path.join(projectRoot, "electron", "installer.nuspectemplate"),
    authors: "Triovex Developers",
    description: "IET Billing System desktop application",
    title: "IET Billing System",
    name: "iet-billing-desktop",
    exe: "IET Billing System.exe",
    setupExe: "IET Billing System Setup 1.0.0.exe",
    noMsi: true,
    noDelta: true,
    skipUpdateIcon: true,
  });

  console.log(`Windows installer created: ${path.join(outputDirectory, "IET Billing System Setup 1.0.0.exe")}`);
}

buildInstaller().catch((error) => {
  console.error("Windows installer creation failed.", error);
  process.exitCode = 1;
});
