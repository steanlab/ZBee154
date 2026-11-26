# ZBee154

A **Zigbee 3.0** firmware for the **Hanshow Nebular 154** e-paper tag (1.54", 200x200 px, black/white/yellow/red, Telink TLSR8359): a Zigbee End Device that works with **Home Assistant, zigbee2mqtt and ZHA**, showing text pushed from the coordinator on the panel. A Zigbee sibling of [badge154](https://github.com/steanlab/badge154), the BLE slideshow firmware for the same hardware, by the same author. The two are separate firmware projects (no dual BLE+Zigbee stack).

> **Not yet flashed to or run on real hardware.** The firmware builds and links cleanly (verified twice, from independent clean checkouts) and its memory usage is well within the chip's limits, but nothing past that has been tried on a tag yet. See [ZBee154-src/docs/HARDWARE.md](https://github.com/steanlab/ZBee154-src/blob/main/docs/HARDWARE.md) for exactly what is and is not confirmed.
>
> Flashing **replaces the original firmware** of the tag. Back up the stock flash first (see [`firmware/README.md`](firmware/README.md)). Use at your own risk, no warranty. Unofficial: not affiliated with Hanshow, Telink, the Zigbee Alliance / Connectivity Standards Alliance, Home Assistant or Koenkk/zigbee2mqtt.

## What the device does

**On the Zigbee network.** Joins as a plain Zigbee 3.0 End Device (Sleepy End Device), the way any battery-powered Zigbee sensor does, with no custom coordinator software needed for most of it:

- **Battery**: voltage and percentage (Power Configuration cluster), read by the SDK's own battery module. No wiring or code was needed beyond telling it which pin to read.
- **Identify**: the standard "make yourself known" cluster, so a coordinator can ask the device to identify itself (the usual way any Zigbee app lets you locate a specific device among several).
- **Scenes, Poll Control, Diagnostics**: present because this SDK's sensor-device template wires them up for every board. Poll Control governs how often a sleepy end device checks in with its parent for queued messages.
- **OTA (Over-The-Air) updates**: the standard Zigbee OTA Upgrade cluster, the same mechanism zigbee2mqtt/ZHA already use to push firmware updates to other Zigbee devices. A tagged release produces the `.zigbee` file this uses.
- These five are recognised out of the box by Home Assistant, zigbee2mqtt and ZHA. No converter, no quirk, nothing custom.

**On the panel.** A 1.54" e-paper display, 200x200 pixels, four printable colours (black, white, yellow, red), showing **two lines of text** that the coordinator pushes to it. There is no slideshow, no stored images and no local editing. The flow is: the coordinator writes a short string to each of two attributes on a small custom cluster (`0xFC00`), the tag notices the write, renders both lines in an original 5x7 bitmap font (uppercase, ASCII only, up to 16 characters per line), and refreshes the panel (a full refresh takes about 25 seconds, same timing as badge154 on the same panel hardware). See [`ZBee154-src/docs/PROTOCOL.md`](https://github.com/steanlab/ZBee154-src/blob/main/docs/PROTOCOL.md) for the exact cluster/attribute layout, and [Pairing](firmware/README.md#pairing-with-home-assistant--zigbee2mqtt--zha") for how to set the text today. A ZHA quirk and a zigbee2mqtt external converter are both written (private repo, not yet tried against real hardware), a polished dedicated Home Assistant entity is not yet confirmed to be possible, see below.

**NFC tap.** Tapping the tag with a phone's NFC reader (the same chip and tap-detection logic as badge154) acts as this firmware's pairing button, the same role a physical button plays on most battery Zigbee sensors: if the tag is already joined, it does a brief fast-poll burst so any queued coordinator command goes through quickly, and if it was joined but lost its parent, it forces an immediate rejoin attempt. The blue LED also breathes for about 5 seconds as a visual "tap seen" confirmation. The tap itself is not yet sent to the coordinator as its own Zigbee event (no binding, no attribute report), so an automation cannot react to "someone tapped the tag" yet, only the tag's own join/poll behaviour responds to it.

**Power.** Runs on the tag's own battery (soft pouch cell or coin cell depending on the variant, see [badge154-src's hardware notes](https://github.com/steanlab/badge154-src/blob/main/docs/HARDWARE.md) for the same physical hardware) and spends most of its time in deep sleep between Zigbee poll intervals and panel refreshes, the normal behaviour for a Sleepy End Device. Actual battery life has not been measured on this firmware.

Everything that is not yet finished is listed honestly, not silently skipped: see [ZBee154-src's README](https://github.com/steanlab/ZBee154-src#not-yet-done-flagged-explicitly-not-silently-dropped) for the full list (chip temperature reporting, NFC tap as a Zigbee event, verifying the ZHA quirk and zigbee2mqtt converter against real hardware, and flashing instructions for this specific build).

## Quick start

1. Download `ZBee154-v0.1.0.bin` from the [Releases](https://github.com/steanlab/ZBee154/releases) page (a copy is in [`firmware/prebuilt/`](firmware/prebuilt)) and flash it ([`firmware/README.md`](firmware/README.md)). **Not yet tried on a tag -- see the warning above.**
2. Put your Zigbee coordinator into pairing mode and power on the tag.
3. Battery, identify and OTA should appear automatically. To set the panel text today, send a raw ZCL `Write Attributes` command to cluster `0xFC00` on endpoint 1 (attribute `0x0000` = line 1, `0x0001` = line 2, both Character String type) -- see the protocol doc linked above for the exact format.

## Repository

| Path | What |
|---|---|
| [`firmware/`](firmware/README.md) | flashing and pairing instructions. `prebuilt/` holds the latest released binaries with their checksums |
| [`LICENSE`](LICENSE) | MIT |
| [`NOTICE.md`](NOTICE.md) | third-party licences and provenance of what is inside the compiled firmware |

The source code, the build overlay over [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc), hardware notes and the custom cluster's protocol documentation are in the private repository [steanlab/ZBee154-src](https://github.com/steanlab/ZBee154-src).

## Credits and licence

MIT licence, see [`LICENSE`](LICENSE). Built on [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc). Hardware facts come from [badge154-src](https://github.com/steanlab/badge154-src) (same tag, BLE firmware, same author), which verified them on real hardware. Third-party licences and provenance: [`NOTICE.md`](NOTICE.md).
A similar project for the BLE side of the same tag: [badge154](https://github.com/steanlab/badge154).
