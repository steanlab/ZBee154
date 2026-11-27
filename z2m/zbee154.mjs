// zigbee2mqtt external converter for ZBee154 (Hanshow Nebular 154 Zigbee e-paper tag, steanlab).
//
// Installation: copy this file into zigbee2mqtt's configured `external_converters` folder (default
// `data/external_converters/`), set `advanced.enable_external_js: true` in `configuration.yaml`
// (required in zigbee2mqtt 2.11.0+), and restart zigbee2mqtt.

import {Zcl} from 'zigbee-herdsman';
import {presets as e, access as ea} from 'zigbee-herdsman-converters/lib/exposes';
import {battery, identify, ota, deviceAddCustomCluster, commandsOnOff} from 'zigbee-herdsman-converters/lib/modernExtend';

const PANEL_CLUSTER = 'manuSpecificZBee154Panel';
const PANEL_KEYS = ['line1', 'line2', 'line3', 'line4', 'accent', 'notify_led'];
const LINE_KEYS = ['line1', 'line2', 'line3', 'line4'];
const MAX_LINE_LEN = 16;

const accentByName = {normal: 0, yellow: 1, red: 2};
const accentByValue = {0: 'normal', 1: 'yellow', 2: 'red'};

const ledByName = {off: 0, red: 1, green: 2, blue: 3, yellow: 4};
const ledByValue = {0: 'off', 1: 'red', 2: 'green', 3: 'blue', 4: 'yellow'};

const fzLocal = {
    zbee154_panel: {
        cluster: PANEL_CLUSTER,
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            for (let i = 0; i < LINE_KEYS.length; i++) {
                const key = LINE_KEYS[i];
                if (msg.data[key] !== undefined) result[key] = msg.data[key];
                else if (msg.data[i] !== undefined) result[key] = msg.data[i];
            }
            const rawAccent = msg.data.accent !== undefined ? msg.data.accent : msg.data[4];
            if (rawAccent !== undefined) {
                result.accent = accentByValue[rawAccent] ?? 'normal';
            }
            const rawTimeouts = msg.data.panelTimeouts !== undefined ? msg.data.panelTimeouts : msg.data[5];
            if (rawTimeouts !== undefined) {
                result.panel_timeouts = rawTimeouts;
            }
            const rawLed = msg.data.notifyLed !== undefined ? msg.data.notifyLed : msg.data[6];
            if (rawLed !== undefined) {
                result.notify_led = ledByValue[rawLed] ?? 'off';
            }
            return Object.keys(result).length ? result : undefined;
        },
    },
};

const tzLocal = {
    zbee154_panel: {
        key: PANEL_KEYS,
        convertSet: async (entity, key, value, meta) => {
            const msg = meta.message ?? {};
            const presentKeys = PANEL_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(msg, k));
            if (presentKeys.length > 0 && presentKeys[0] !== key) {
                return;
            }

            const keysToSend = presentKeys.length > 0 ? presentKeys : [key];
            const payload = {};
            const state = {};

            for (const k of keysToSend) {
                const rawVal = presentKeys.length > 0 ? msg[k] : value;
                if (k === 'accent') {
                    const num = Object.prototype.hasOwnProperty.call(accentByName, rawVal) ? accentByName[rawVal] : 0;
                    payload.accent = num;
                    state.accent = accentByValue[num];
                } else if (k === 'notify_led') {
                    const num = Object.prototype.hasOwnProperty.call(ledByName, rawVal) ? ledByName[rawVal] : 0;
                    payload.notifyLed = num;
                    state.notify_led = ledByValue[num];
                } else {
                    const str = rawVal === null || rawVal === undefined ? '' : String(rawVal).slice(0, MAX_LINE_LEN);
                    payload[k] = str;
                    state[k] = str;
                }
            }

            await entity.write(PANEL_CLUSTER, payload);
            return {state};
        },
        convertGet: async (entity, key, meta) => {
            const attrName = key === 'notify_led' ? 'notifyLed' : key;
            await entity.read(PANEL_CLUSTER, [attrName]);
        },
    },
    zbee154_panel_timeouts: {
        key: ['panel_timeouts'],
        convertGet: async (entity, key, meta) => {
            await entity.read(PANEL_CLUSTER, ['panelTimeouts']);
        },
    },
};

const definition = {
    zigbeeModel: ['ZBee154'],
    model: 'ZBee154',
    vendor: 'steanlab',
    description: 'Zigbee e-paper tag (Hanshow Nebular 154), 4-line display, LED alerts on cluster 0xFC00, and NFC tap toggle.',
    extend: [
        battery(),
        identify(),
        ota(),
        commandsOnOff({commands: ['toggle'], bind: true}),
        deviceAddCustomCluster(PANEL_CLUSTER, {
            name: PANEL_CLUSTER,
            ID: 0xfc00,
            attributes: {
                line1: {name: 'line1', ID: 0x0000, type: Zcl.DataType.CHAR_STR, write: true},
                line2: {name: 'line2', ID: 0x0001, type: Zcl.DataType.CHAR_STR, write: true},
                line3: {name: 'line3', ID: 0x0002, type: Zcl.DataType.CHAR_STR, write: true},
                line4: {name: 'line4', ID: 0x0003, type: Zcl.DataType.CHAR_STR, write: true},
                accent: {name: 'accent', ID: 0x0004, type: Zcl.DataType.UINT8, write: true, max: 0xff},
                panelTimeouts: {name: 'panelTimeouts', ID: 0x0005, type: Zcl.DataType.UINT8},
                notifyLed: {name: 'notifyLed', ID: 0x0006, type: Zcl.DataType.UINT8, write: true, max: 0xff},
            },
            commands: {},
            commandsResponse: {},
        }),
    ],
    fromZigbee: [fzLocal.zbee154_panel],
    toZigbee: [tzLocal.zbee154_panel, tzLocal.zbee154_panel_timeouts],
    exposes: [
        e.text('line1', ea.ALL).withDescription('Line 1 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.text('line2', ea.ALL).withDescription('Line 2 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.text('line3', ea.ALL).withDescription('Line 3 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.text('line4', ea.ALL).withDescription('Line 4 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.enum('accent', ea.ALL, ['normal', 'yellow', 'red'])
            .withDescription('Text colour for all four lines at once (background stays white)'),
        e.enum('notify_led', ea.ALL, ['off', 'red', 'green', 'blue', 'yellow'])
            .withDescription('Pulse-blink LED notification for 5 seconds (auto-stops to save battery)'),
        e.numeric('panel_timeouts', ea.STATE_GET).withValueMin(0).withValueMax(255)
            .withDescription('Diagnostic: how many panel BUSY waits have timed out (0 = healthy). Read-only on the device'),
    ],
};

export default definition;
