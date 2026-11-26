# ZBee154

A **Zigbee 3.0** firmware for the **Hanshow Nebular 154** e-paper tag (1.54", 200x200 px, black/white/yellow/red, Telink TLSR8359): a Zigbee End Device that works with **Home Assistant, zigbee2mqtt and ZHA**, showing text pushed from the coordinator on the panel. A Zigbee sibling of [badge154](https://github.com/steanlab/badge154), the BLE slideshow firmware for the same hardware, by the same author.

Flashed and running on real hardware. NFC tap detection is confirmed working on a real tag.

## What the device does

**On the Zigbee network.** Joins as a plain Zigbee 3.0 End Device (Sleepy End Device), the way any battery-powered Zigbee sensor does, with no custom coordinator software needed for most of it:

- **Battery**: voltage and percentage (Power Configuration cluster).
- **Identify**: the standard "make yourself known" cluster, so a coordinator can locate a specific device among several.
- **Scenes, Poll Control, Diagnostics**: standard clusters. Poll Control governs how often a sleepy end device checks in with its parent for queued messages.
- **OTA (Over-The-Air) updates**: the standard Zigbee OTA Upgrade cluster, the same mechanism zigbee2mqtt/ZHA already use to push firmware updates to other Zigbee devices.
- These are all recognised out of the box by Home Assistant, zigbee2mqtt and ZHA. No converter, no quirk, nothing custom.

**On the panel.** A 1.54" e-paper display, 200x200 pixels, four printable colours (black, white, yellow, red), showing **up to four lines of text plus a colour accent** that the coordinator pushes to it: a short string to each of four attributes, and a normal/yellow/red accent attribute, all on a small custom cluster (`0xFC00`), rendered in an original bitmap font (uppercase, up to 16 characters per line), full refresh in about 25 seconds. A boot splash shows the tag's name while it waits to be paired. A ZHA quirk and a zigbee2mqtt external converter are both available for setting the panel content from Home Assistant/zigbee2mqtt.

**NFC tap.** Tapping the tag with a phone's NFC reader acts as this firmware's pairing button, the same role a physical button plays on most battery Zigbee sensors: a brief fast-poll burst if already joined, or an immediate rejoin attempt if the parent was lost. The blue LED also breathes for about 5 seconds as a visual confirmation.

**Power.** Runs on the tag's own battery and spends most of its time in deep sleep between Zigbee poll intervals and panel refreshes, the normal behaviour for a Sleepy End Device.

## Quick start

1. Download `ZBee154-v0.2.1.bin` from the [Releases](https://github.com/steanlab/ZBee154/releases) page (a copy is in [`firmware/prebuilt/`](firmware/prebuilt)) and flash it ([`firmware/README.md`](firmware/README.md)).
2. Put your Zigbee coordinator into pairing mode and power on the tag.
3. Battery, identify and OTA appear automatically. To set the panel content, use the ZHA quirk, the zigbee2mqtt converter, or write to cluster `0xFC00` directly (attributes `0x0000`-`0x0003` = lines 1-4, `0x0004` = accent: 0 normal, 1 yellow, 2 red).

## Repository

| Path | What |
|---|---|
| [`firmware/`](firmware/README.md) | flashing and pairing instructions. `prebuilt/` holds the latest released binaries with their checksums |
| [`LICENSE`](LICENSE) | MIT |
| [`NOTICE.md`](NOTICE.md) | third-party licences and provenance of what is inside the compiled firmware |

## Credits and licence

MIT licence, see [`LICENSE`](LICENSE). Built on [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc). A similar project for the BLE side of the same tag: [badge154](https://github.com/steanlab/badge154).
