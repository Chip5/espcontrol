import { initializeDeviceConfig } from "../../src/webserver/device_config";
import { initializeAppState, state } from "../../src/webserver/state/app_instance";
import { createFirmwareUpdateFeature } from "../../src/webserver/application/firmware_update_state";
import { createFirmwareVersionFeature } from "../../src/webserver/application/firmware_version_state";
import { createPublicFirmwareInstallFeature } from "../../src/webserver/application/public_firmware_install";

function equal(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}
export async function runFirmwareUpdateTests() {
  const globals = globalThis as any;
  globals.__ESPCONTROL_DEFAULT_DEVICE_ID__ = "test";
  globals.__ESPCONTROL_DEVICE_PROFILES__ = { test: { slots: 1 } };
  globals.__ESPCONTROL_TIMEZONE_OPTIONS__ = [];
  initializeDeviceConfig();
  initializeAppState();
  const realTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  const realNow = Date.now;
  let now = 1000;
  let poll: (() => void) | undefined;
  globals.setTimeout = (callback: () => void) => { poll = callback; return 1; };
  globals.clearTimeout = () => {};
  Date.now = () => now;
  const status = { style: {}, innerHTML: "", className: "" };
  const runtime = { els: { fwStatus: status } } as any;
  let updates: ReturnType<typeof createFirmwareUpdateFeature>;
  const version = createFirmwareVersionFeature(runtime, {
    syncVersionSelect() {}, renderUpdateStatus() {},
    stopInstallRefreshIfComplete() { updates.stopInstallRefreshIfComplete(); },
  });
  let nativeInstalls = 0;
  updates = createFirmwareUpdateFeature(runtime, "test", version, {
    postInstall() { nativeInstalls++; }, refreshVersion() {}, installViaWebOta() {}, c6UpdateKnownAvailable: () => false,
  });
  try {
    version.set("dev");
    updates.setInfo({ state: "NO UPDATE", latest_version: "v2.11.0" });
    updates.setPublicInfo({ latest_version: "v2.11.0" });
    equal(state.firmwareVersion, "Dev build", "public metadata must not invent an installed release");
    state.firmwareInstallTargetVersion = "v2.11.0";
    state.firmwareInstallPostPending = true;
    updates.startInstallRefresh();
    updates.setInfo({ state: "NO UPDATE", current_version: "dev", latest_version: "v2.11.0" });
    equal(nativeInstalls, 0, "NO UPDATE must preserve the browser fallback, not trigger native install");
    equal(state.firmwareInstallPostPending, true, "latest-release fallback remains pending");
    updates.stopInstallRefresh();
    version.set("v2.11.0");
    state.firmwareInstallTargetVersion = "v2.8.6";
    state.firmwareInstallStatus = "Uploading firmware v2.8.6…";
    updates.startInstallRefresh();
    updates.setInfo({ state: "NO UPDATE", current_version: "v2.11.0" });
    equal(state.firmwareUpdateState, "INSTALLING", "latest-release status must not cancel a downgrade");
    equal(state.firmwareVersion, "v2.11.0", "requested version is not proof of installation");
    equal(status.innerHTML, state.firmwareInstallStatus, "upload progress is visible");
    now += 170000;
    updates.setInfo({ state: "NO UPDATE", current_version: "v2.11.0" });
    now += 10001;
    poll!();
    equal(state.firmwareUpdateState, "", "routine updates must not postpone the deadline");
    const error = state.firmwareInstallError;
    equal(error.includes("could not be confirmed"), true, "timeout reports a visible failure");
    updates.setInfo({ state: "NO UPDATE", current_version: "v2.11.0" });
    equal(state.firmwareInstallError, error, "polling preserves the failure");
    state.firmwareInstallTargetVersion = "v2.8.6";
    updates.startInstallRefresh();
    updates.setInfo({ state: "UPDATE AVAILABLE", current_version: "v2.8.6", latest_version: "v2.11.0" });
    equal(state.firmwareInstallTargetVersion, "", "actual version confirms a downgrade despite a newer release");
    equal(state.firmwareInstallStatus, "Firmware v2.8.6 installed.", "confirmed result is visible");
    let banner = "";
    const upload = createPublicFirmwareInstallFeature({ request: async (url: string) => url === "/update"
      ? { kind: "network-error", error: new Error("Load failed") }
      : { kind: "success", value: new Response("firmware") } } as any, "test", updates,
      { setConfigLocked() {}, showBanner(message: string) { banner = message; } } as any,
      { getJsonQuietly: async () => {} } as any, { connect() {} });
    version.set("v2.11.0");
    equal(await upload.installPublicFirmwareViaWebOta({ latest_version: "v2.8.6", ota_url: "https://example.test/fw.bin" }), false,
      "a dropped upload connection must not report success");
    equal(banner, "", "a dropped connection must not claim firmware was uploaded");
    equal(status.innerHTML.includes("Upload connection lost"), true, "uncertain upload is visible");
    upload.failPublicFirmwareUpload("Device rejected firmware upload (500).");
    updates.setInfo({ state: "NO UPDATE", current_version: "v2.11.0" });
    equal(status.innerHTML.includes("Device rejected"), true, "rejected upload remains visible after refresh");
  } finally {
    updates.stopInstallRefresh();
    globals.setTimeout = realTimeout;
    globals.clearTimeout = realClearTimeout;
    Date.now = realNow;
  }
}
