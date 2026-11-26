# Firmware

Pre-built files are in [`prebuilt/`](prebuilt) and on the [Releases](https://github.com/steanlab/ZBee154/releases) page:

- `ZBee154-v0.1.0.bin` -- flash image, for flashing over a USB-UART adapter.
- `ZBee154-v0.1.0.zigbee` (packaged as `1141-0240-01403001-ZBee154.zigbee` in `prebuilt/`) -- the same firmware with a ZCL OTA header, for upgrading an already-flashed, already-joined tag over the air through the Zigbee OTA cluster.
- `SHA256SUMS.txt` -- checksums of both files.

The source, the build overlay and the build workflow are in the private repository [steanlab/ZBee154-src](https://github.com/steanlab/ZBee154-src) (overlay over [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc), same pattern as [badge154](https://github.com/steanlab/badge154) / [badge154-src](https://github.com/steanlab/badge154-src) for the BLE version of this tag's firmware).

## Flashing

**Not yet verified on real hardware. Try at your own risk and back up the stock flash first.** The wiring is the same as badge154 (same tag): **SWS** to the adapter's **TXD**, **NRST** to the adapter's **DTR**, **GND**, and **3.3 V** only if the battery is out.

Recommended tool to try first: atc1441's WebSerial flasher at [`ATC_BLE_OEPL_Image_Upload.html`](https://atc1441.github.io/ATC_BLE_OEPL_Image_Upload.html) -- the same page badge154 already uses successfully on this exact tag over this exact wiring. This is a recommendation, not a confirmed procedure: it is not yet known whether this page validates the uploaded file against the BLE firmware's own format or just writes raw bytes, so it may or may not accept `ZBee154.bin` as-is. See [ZBee154-src/firmware/README.md](https://github.com/steanlab/ZBee154-src/blob/main/firmware/README.md#flash----recommendation-not-yet-tried-on-a-tag) for the full reasoning and a fallback tool if this one doesn't work.

## Pairing with Home Assistant / zigbee2mqtt / ZHA

Not yet tried on a real network. Expected to join as a standard Zigbee 3.0 End Device (Sleepy End Device): put the coordinator into pairing mode and power on the tag. Battery, identify, scenes and OTA should be recognised with no extra setup, since they use standard ZCL clusters. The panel's two text lines use a small custom cluster (`0xFC00`): a zigbee2mqtt external converter and a ZHA quirk are both written for it (private repo, `z2m/` and `zha/`), but neither has been tried against a running instance or real hardware yet. See [ZBee154-src/docs/PROTOCOL.md](https://github.com/steanlab/ZBee154-src/blob/main/docs/PROTOCOL.md) for the cluster layout. Until the converter/quirk are confirmed working, the two attributes can also be set with a raw ZCL `Write Attributes` command (some integrations expose this as a generic "cluster command" action even without a dedicated converter).
