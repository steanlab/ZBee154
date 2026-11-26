# ZBee154

A **Zigbee 3.0** firmware for the **Hanshow Nebular 154** e-paper tag (1.54", 200x200 px, black/white/yellow/red, Telink TLSR8359): a Zigbee End Device that works with **Home Assistant, zigbee2mqtt and ZHA**, showing text pushed from the coordinator on the panel. A Zigbee sibling of [badge154](https://github.com/steanlab/badge154), the BLE slideshow firmware for the same hardware, by the same author; the two are separate firmware projects (no dual BLE+Zigbee stack).

> **Not yet flashed to or run on real hardware.** The firmware builds and links cleanly (verified twice, from independent clean checkouts) and its memory usage is well within the chip's limits, but nothing past that has been tried on a tag yet. See [ZBee154-src/docs/HARDWARE.md](https://github.com/steanlab/ZBee154-src/blob/main/docs/HARDWARE.md) for exactly what is and is not confirmed.
>
> Flashing **replaces the original firmware** of the tag. Back up the stock flash first (see [`firmware/README.md`](firmware/README.md)). Use at your own risk, no warranty. Unofficial: not affiliated with Hanshow, Telink, the Zigbee Alliance / Connectivity Standards Alliance, Home Assistant or Koenkk/zigbee2mqtt.

## What it does

- Joins as a normal Zigbee 3.0 End Device, no custom coordinator software needed for most of it.
- **Battery** (voltage, percentage), **Identify**, **Scenes**, **Poll Control**, **Diagnostics**, **OTA updates**: all standard Zigbee clusters, recognised out of the box by Home Assistant / zigbee2mqtt / ZHA.
- **Panel: two lines of text, pushed from the coordinator.** Write them with a small custom ZCL cluster (`0xFC00`); see [Pairing](firmware/README.md#pairing-with-home-assistant--zigbee2mqtt--zha") for how to set them today, and [ZBee154-src/docs/PROTOCOL.md](https://github.com/steanlab/ZBee154-src/blob/main/docs/PROTOCOL.md) for the full attribute layout if you want to write a friendlier integration (a zigbee2mqtt converter or ZHA quirk -- neither exists yet).
- **NFC tap** makes the **blue LED breathe** (smooth fade in/out, ~3 s) as a local "device discovery" acknowledgement -- not yet surfaced to the coordinator as a Zigbee command.

Everything that is not yet finished is listed honestly, not silently skipped: see [ZBee154-src's README](https://github.com/steanlab/ZBee154-src#not-yet-done-flagged-explicitly-not-silently-dropped) for the full list (chip temperature reporting, LED trigger, NFC-as-command, the converter/quirk, and flashing instructions for this specific build).

## Quick start

1. Download `ZBee154-v0.1.0.bin` from the [Releases](https://github.com/steanlab/ZBee154/releases) page (a copy is in [`firmware/prebuilt/`](firmware/prebuilt)) and flash it ([`firmware/README.md`](firmware/README.md)). **Not yet tried on a tag -- see the warning above.**
2. Put your Zigbee coordinator into pairing mode and power on the tag.
3. Battery, identify and OTA should appear automatically. To set the panel text today, send a raw ZCL `Write Attributes` command to cluster `0xFC00` on endpoint 1 (attribute `0x0000` = line 1, `0x0001` = line 2, both Character String type) -- see the protocol doc linked above for the exact format.

## Repository

| Path | What |
|---|---|
| [`firmware/`](firmware/README.md) | flashing and pairing instructions; `prebuilt/` holds the latest released binaries with their checksums |
| [`LICENSE`](LICENSE) | MIT |
| [`NOTICE.md`](NOTICE.md) | third-party licences and provenance of what is inside the compiled firmware |

The source code, the build overlay over [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc), hardware notes and the custom cluster's protocol documentation are in the private repository [steanlab/ZBee154-src](https://github.com/steanlab/ZBee154-src).

## Credits and licence

MIT licence, see [`LICENSE`](LICENSE). Built on [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc); hardware facts come from [badge154-src](https://github.com/steanlab/badge154-src) (same tag, BLE firmware, same author), which verified them on real hardware. Third-party licences and provenance: [`NOTICE.md`](NOTICE.md).
A similar project for the BLE side of the same tag: [badge154](https://github.com/steanlab/badge154).
