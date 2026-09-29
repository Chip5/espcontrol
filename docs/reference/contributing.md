---
title: Contributing
description:
  How to get started if you want to contribute fixes, card types, firmware changes, or web configurator improvements to EspControl.
---

# Contributing

Thanks for wanting to help improve EspControl.

## Before Opening a Pull Request

- Check the existing [issues](https://github.com/jtenniswood/espcontrol/issues)
  to see if the change is already being discussed.
- Keep the change focused so it is easier to test.
- Run `npm run check:ci` before submitting code changes.
- If your change affects how users configure or use the panel, update the docs
  in this site too.

For small fixes, a pull request is usually enough. For larger changes, especially
new card types or firmware behaviour, opening an issue first makes it easier to
agree what should change before you spend time building it.

## Pull Request Testing

Pull requests should make the next step obvious. The PR template asks for the
practical impact, documentation decision, testing status, and whether a physical
device test is needed before merge.

When a pull request changes firmware, device configuration, shared display
files, or web files used by the device, an automated workflow posts suggested
device testing notes. Treat those notes as the starting point for manual device
testing after the automated checks pass.

A successful compile or CI run confirms that the project builds. It does not
replace testing on the affected display when the change touches the on-device
experience.

Firmware-related pull requests automatically compile every supported factory and
P4 recovery image. The **Firmware Compile Gate** check fails if any required
build fails. Changes outside firmware inputs skip compilation. PR, nightly and
release build summaries report application size, OTA partition capacity and remaining
headroom; less than 128 KiB free produces a warning, and an oversized image fails
the build. Sizes use the compiled application binary and partition table, not the
larger USB factory image.
