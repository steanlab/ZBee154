# Recovering / Unbricking Hanshow Nebular 154 (RP2040 / Raspberry Pi Pico)

Guide and MicroPython recovery script to unlock, unbrick, or flash back to another firmware on the **Hanshow Nebular 154** (Telink `TLSR8359`).

---

### Root Cause

Unidirectional browser-based UART-SWire flashers (such as `ATC_BLE_OEPL_Image_Upload.html`) transmit `TX -> SWS` without `RX` readback or verification, so they report success even when the target rejects or misses every command. After flashing Zigbee firmware (`ZigbeeTLc`-based) onto the tag, returning to another firmware often fails due to a combination of:

1. **Immediate Deep Sleep & SWS Power-Down:** `ZigbeeTLc` enters deep sleep with SRAM retention rapidly after boot, powering down both the CPU and the hardware SWire (`SWS` / `PA7`) controller. Without a clean, hardware-synchronized `NRST` pulse (and with the battery removed to prevent parasitic powering through `SWS`), the `0x0602 = 0x05` (CPU Stop) activation burst misses the awake window.
2. **SPI Flash Write Protection (SR2 / `CMP`):** Internal SPI flash chips used on `TLSR8359` modules can have upper block-protect or Status Register 2 (`CMP`) bits set. Standard 1-byte `WRSR` (`0x01 0x00`) unlock commands do not clear SR2, causing subsequent writes (`0x02`) and erases (`0x20` / `0x60`) to be silently ignored.
3. **Multi-Address Boot Fallback (`0x00000` -> `0x20000` -> `0x40000`):** The `TLSR8359` Boot ROM scans for the `KNLT` magic header (`+0x08`) sequentially at `0x00000`, `0x20000`, and `0x40000`. Because `ZigbeeTLc` stores an OTA/backup image at `0x40000`, erasing only `0x00000` causes the bootloader to fall back to `0x40000`.

> **Warning:** Avoid full chip erase (`0x60` / `Erase All`) on Hanshow Nebular tags—factory panel waveform/calibration data and MAC info are stored in upper flash sectors.

---

### Recovery Procedure (MicroPython on Raspberry Pi Pico)

This script uses an RP2040 running standard MicroPython (no resistors required) to deterministically reset the MCU, halt the CPU before deep sleep/clock switch, clear SR1 & SR2 flash locks, and erase only the first 4 KB sectors at `0x000000` and `0x040000` (invalidating both boot slots while preserving upper flash factory data).

#### Wiring

**Remove the coin-cell battery first**, then wire directly to the Raspberry Pi Pico:

| RP Pico Pin | Signal | Tag Pad |
| :--- | :--- | :--- |
| `GP0` (Pin 1) | `UART0 TX` | `SWS` |
| `GP3` (Pin 5) | Reset | `NRST` |
| `3V3(OUT)` (Pin 36) | Power (3.3V) | `VCC` |
| `GND` (e.g. Pin 38) | Ground | `GND` |

#### Script (`unlock_wipe.py`)

Run via Thonny or `mpremote` on a Pico flashed with MicroPython:

```python
from machine import Pin, UART
import time

def sws_encode(blk):
    out = bytearray()
    first = True
    for b in blk:
        out.append(0x80 if first else 0xfe)
        first = False
        for bit in range(7, -1, -1):
            out.append(0x80 if (b >> bit) & 1 else 0xfe)
        out.append(0xfe)
    return out

def sws_wr(uart, addr, data):
    hdr = bytes([0x5a, (addr >> 16) & 0xff, (addr >> 8) & 0xff, addr & 0xff, 0x00]) + bytes(data)
    uart.write(sws_encode(hdr))
    uart.write(sws_encode(b'\xff'))

def sws_fifo_wr(uart, addr, data):
    sws_wr(uart, 0x00b3, b'\x80')  # Enable FIFO write mode
    sws_wr(uart, addr, data)
    sws_wr(uart, 0x00b3, b'\x00')  # Disable FIFO write mode

def spi_cmd(uart, data):
    sws_wr(uart, 0x0d, b'\x00')    # MSPI CS low
    sws_fifo_wr(uart, 0x0c, data)  # MSPI data
    sws_wr(uart, 0x0d, b'\x01')    # MSPI CS high

def unlock_and_wipe(baud):
    rst = Pin(3, Pin.OUT, value=0)
    uart = UART(0, baudrate=baud, tx=Pin(0), rx=Pin(1))
    time.sleep_ms(100)
    rst.init(Pin.IN)               # Release NRST (Hi-Z)

    # Spam CPU Stop (0x0602 = 0x05) for 500 ms immediately out of reset
    stop_pkt = sws_encode(b'\x5a\x00\x06\x02\x00\x05') + sws_encode(b'\xff')
    t0 = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), t0) < 500:
        uart.write(stop_pkt)
    time.sleep_ms(5)

    # Set SWire clock divider (0x00b2) for 24 MHz boot RC oscillator
    div = round(24000000 * 2 / baud)
    sws_wr(uart, 0x00b2, bytes([div]))

    # Wake up SPI flash from deep power-down (0xAB)
    spi_cmd(uart, b'\xab')
    time.sleep_ms(5)

    # Clear protection bits across SR1 (0x01), SR2 (0x31), and 16-bit WRSR (0x01)
    for cmd in (b'\x01\x00', b'\x31\x00', b'\x01\x00\x00'):
        spi_cmd(uart, b'\x06')     # WREN
        spi_cmd(uart, cmd)
        time.sleep_ms(30)

    # 4 KB Sector Erase (0x20) at primary (0x000000) and OTA/backup (0x040000) slots
    for addr in (0x000000, 0x040000):
        spi_cmd(uart, b'\x06')     # WREN
        spi_cmd(uart, bytes([0x20, (addr >> 16) & 0xff, (addr >> 8) & 0xff, addr & 0xff]))
        time.sleep_ms(400)

unlock_and_wipe(921600)
unlock_and_wipe(460800)
print("Unlock & wipe done!")
```

---

### Next Steps

1. Power-cycle `VCC` on the tag.
2. The firmware will no longer boot (no LED activity, MCU stays awake in ROM bootloader with SWS active and Flash unlocked).
3. Connect your standard USB-UART adapter and flash your target firmware normally using the web flasher (921600 baud, **Write Firmware only — do NOT run Erase All**).
