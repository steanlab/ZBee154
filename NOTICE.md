# Notice and provenance

ZBee154 is not affiliated with, or endorsed by, Hanshow, Telink, Zigbee Alliance (Connectivity Standards Alliance), Home Assistant or Koenkk/zigbee2mqtt. The names are used only to say which hardware and software this project works with.

## What is in this repository

Everything here was written for this project and is under the MIT licence (file `LICENSE`), with one exception: the overlay edits that `firmware/apply.py` applies to five shared SDK files (`src/version_cfg.h`, `src/app_cfg.h`, `src/app_EpCfg.c`, `src/zcl_appCb.c`, `src/app_main.c`, `make_z/src.mk`) are small patches to files that belong to the upstream project below; they are not copied into this repository, only the patch is. The rest:

- `docs/`: hardware and protocol documentation,
- `firmware/src/`: the panel driver, the NFC tap detector, the LED colour-cycle, the bitmap font, and the custom `0xFC00` ZCL cluster for the panel,
- `firmware/apply.py` and `firmware/check_ram.sh`,
- `firmware/prebuilt/`: a copy of the released binary and its checksum.

The 5x7 bitmap font (`firmware/src/panel_font.c`) was hand-designed for this project, rendered and visually checked, not traced or copied from any existing font.

## What is not in this repository

The firmware is built by applying `firmware/apply.py` to a pinned checkout of [pvvx/ZigbeeTLc](https://github.com/pvvx/ZigbeeTLc) (MIT-style licence, commit `c249d8a7caddb5012d06aba580d4a53d1957f9c1`). That checkout is not copied here. The compiled firmware file contains the upstream Zigbee stack and SDK code it ships with, each under its own licence:

- Telink Semiconductor SDK (headers and the TLSR825x platform/stack libraries), copyright Telink Semiconductor (Shanghai) Co., Ltd. The file headers of this SDK, as shipped by the upstream project, say the information is available under a commercial licence agreement or "free, non-transferable use ... under Mutual Non-Disclosure Agreement", with no warranty. The upstream project distributes the SDK sources and compiled firmware openly, and other community projects for these chips do the same, but the licence terms were not reviewed by a lawyer. Whoever redistributes the binary does so on their own responsibility; if Telink or the upstream author objects, the file will be removed.
- The `tc32` toolchain vendored by pvvx/ZigbeeTLc, under its own terms (see that project).

If you redistribute a compiled firmware file, keep this notice with it. The compiled firmware is published in the Releases and in `firmware/prebuilt/`; it is built by the workflow from the sources of the tagged commit.

## Where the hardware information came from

The pin assignment, the panel init/refresh command sequence and the battery ADC channel are the same as the BLE firmware **badge154** (private repo badge154-src, same author), which verified them on real Hanshow Nebular 154 tags; see `docs/HARDWARE.md` for what is re-verified here and what is carried over unchanged. ZBee154 is a Zigbee port of badge154: the display driver, NFC tap detector and LED code are re-implementations against this SDK's HAL (`gpio_write`/`gpio_read`, `clock_time`), not the BLE SDK's calls, but the hardware-level sequences are the same ones badge154 already confirmed.

## Related project

[badge154](https://github.com/steanlab/badge154) / badge154-src by the same author: the BLE slideshow firmware for the same tag hardware. ZBee154 is a from-scratch Zigbee End Device built for the same panel, sharing only the hardware knowledge, not the code (BLE and Zigbee are separate SDKs with no shared source tree).
