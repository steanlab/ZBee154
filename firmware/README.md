# Firmware

Pre-built files are in [`prebuilt/`](prebuilt) and on the [Releases](https://github.com/steanlab/ZBee154/releases) page:

- `ZBee154-v0.2.0.bin` -- flash image, for flashing over a USB-UART adapter.
- `1141-0240-01023001-ZBee154.zigbee` -- the same firmware with a ZCL OTA header, for upgrading an already-flashed, already-joined tag over the air through the Zigbee OTA cluster. The filename's last number is the firmware version the OTA mechanism compares against what is already on the tag.
- `SHA256SUMS.txt` -- checksums of both files.

## Flashing

Flashed and running on real hardware. The wiring is the same as badge154 (same tag): **SWS** to the adapter's **TXD**, **NRST** to the adapter's **DTR**, **GND**, and **3.3 V** only if the battery is out.

Recommended tool: atc1441's WebSerial flasher at [`ATC_BLE_OEPL_Image_Upload.html`](https://atc1441.github.io/ATC_BLE_OEPL_Image_Upload.html) -- the same page badge154 already uses successfully on this exact tag over this exact wiring.

### Flashing back or unbricking
Standard browser-based flashers only transmit data (`TX -> SWS`) without readback verification and may silently report success if the tag is asleep or Flash write-protection (SR2) is locked. If a web-flasher fails to overwrite the firmware, follow the **[Raspberry Pi Pico Recovery Guide](../docs/RECOVERY.md)** to deterministically unlock and unbrick the tag.

## Pairing with Home Assistant / zigbee2mqtt / ZHA

NFC tap detection is confirmed working on real hardware. The tag joins as a standard Zigbee 3.0 End Device (Sleepy End Device): put the coordinator into pairing mode and power on the tag. Battery, identify, scenes and OTA are recognised with no extra setup, since they use standard ZCL clusters. The panel's four text lines and colour accent use a small custom cluster (`0xFC00`), with a zigbee2mqtt external converter and a ZHA quirk both available for setting them. The attributes can also be set with a raw ZCL `Write Attributes` command.
