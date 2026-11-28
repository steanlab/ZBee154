# ZBee154

Zigbee 3.0 End Device firmware for the **Hanshow Nebular 154** e-paper tag (1.54", 200x200, black/white/yellow/red, Telink TLSR8359) - a Zigbee port of [badge154](https://github.com/steanlab/badge154).

> **Build verified; real-tag Zigbee pairing pending.** NFC tap detection and wired flashing have been confirmed on real hardware on an earlier build; coordinator pairing, Home Assistant (ZHA / zigbee2mqtt) integration, e-paper text updates, `On/Off` tap reporting, and `notify_led` blinking have not been tested on a live Zigbee network yet.
>
> Use at your own risk, no warranty. Unofficial: not affiliated with Hanshow, Telink, the Zigbee Alliance / Connectivity Standards Alliance, Home Assistant or Koenkk/zigbee2mqtt.

## What it does

- **200x200 four-colour e-paper panel** (custom cluster `0xFC00`): shows up to **four lines of uppercase ASCII text** (up to 16 characters per line) with a selectable **colour accent** (`normal` black / `yellow` / `red`) on a white background, plus a read-only `panel_timeouts` diagnostic counter (`0` on a healthy panel).
- **LED alert notifications from Home Assistant** (attribute `0x0006` on cluster `0xFC00`): battery-friendly pulse-blink (`off` / `red` / `green` / `blue` / `yellow`, 60 ms on / 440 ms off, auto-stops after 5 s) without triggering a 25 s screen refresh.
- **NFC tap as button & Zigbee trigger**: tapping the tag wakes it from deep sleep, fades the blue LED for 5 s, runs a 30 s fast-poll burst + Poll Control check-in (or immediate rejoin if the parent was lost), and sends a standard Zigbee **`On/Off` `Toggle` command** (`0x0006` client cluster) to bound devices / the coordinator (`zha_event` in ZHA, `action: toggle` in zigbee2mqtt).
- **Battery** (Power Configuration cluster): voltage and percentage read via the SDK's `battery.c`.
- **Poll Control, Diagnostics, Scenes, Identify**: standard clusters from the SDK template (note: `Identify` is registered, while physical LED blinking is handled via NFC tap and `0xFC00` `notify_led`).
- **OTA** (Zigbee OTA Upgrade cluster): over-the-air firmware updates via zigbee2mqtt / ZHA using the `.zigbee` file.

Both a [ZHA quirk](zha/README.md) and a [zigbee2mqtt external converter](z2m/README.md) are included for cluster `0xFC00`.

## Quick start

1. Download **`ZBee154-v0.2.4.bin`** from [Releases](../../releases) (or from [`firmware/prebuilt/`](firmware/prebuilt/)). For subsequent over-the-air updates after the initial wired flash, use the **`.zigbee`** file.
2. **Back up the stock flash** before writing anything, then flash `.bin` over a USB-UART adapter (`SWS` -> `TXD`, `NRST` -> `DTR`, `GND`, and `3.3 V` only if the battery is out). See [`firmware/README.md`](firmware/README.md) for wiring and flashing tools.
> **Flashing back to another firmware or unbricking?**
> If a web-flasher reports success but the tag still boots old firmware, the tag is entering deep sleep before SWS connects, or Flash SR2 protection is locked. See the **[Raspberry Pi Pico Recovery Guide](docs/RECOVERY.md)** to deterministically unlock and erase both boot slots.
3. Pair the tag with your Zigbee coordinator.
4. Install [`zha/quirk_zbee154.py`](zha/quirk_zbee154.py) (ZHA) or [`z2m/zbee154.mjs`](z2m/zbee154.mjs) (zigbee2mqtt) to set panel lines, accent colour, LED alerts, and bind NFC `toggle` actions.

## Not yet done

- **Chip temperature reporting**: no calibrated reading function exists in this SDK, so the Temperature Measurement cluster is intentionally left out rather than publishing an uncalibrated number.
- **Persistence across battery removal**: panel lines and accent are kept across deep-sleep cycles in retention RAM, but reset to the boot splash (`ZBEE154` / `WAITING...`) on a full power loss or reset (NV flash persistence is not implemented yet).
- **Live Zigbee / Home Assistant verification**: pairing with a coordinator and testing the updated firmware with ZHA and zigbee2mqtt on real hardware.

## Repository

| Path | What |
|---|---|
| [`firmware/`](firmware/README.md) | flashing instructions and [`prebuilt/`](firmware/prebuilt/) binaries (`.bin`, `.zigbee`) with SHA-256 checksums |
| [`zha/`](zha/README.md) | Home Assistant ZHA custom quirk ([`quirk_zbee154.py`](zha/quirk_zbee154.py)) for cluster `0xFC00` |
| [`z2m/`](z2m/README.md) | zigbee2mqtt external converter ([`zbee154.mjs`](z2m/zbee154.mjs)) for cluster `0xFC00`, battery, OTA, and NFC `toggle` |
| [`LICENSE`](LICENSE) | MIT licence |
| [`NOTICE.md`](NOTICE.md) | third-party licences and provenance |
| [`docs/RECOVERY.md`](docs/RECOVERY.md) | Raspberry Pi Pico (RP2040) unbrick & Flash unlock guide |
