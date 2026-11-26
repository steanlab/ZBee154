// zigbee2mqtt external converter for ZBee154 (Hanshow Nebular 154 Zigbee e-paper tag, steanlab).
//
// Exposes the custom cluster 0xFC00 (four writable Character String attributes, line1..line4 at
// 0x0000-0x0003, plus an unsigned 8-bit accent attribute at 0x0004) as four "text" entities and one
// "enum" entity -- see ../docs/PROTOCOL.md for the full cluster layout and what writing each
// attribute does on the device.
//
// VERIFICATION STATUS -- read before relying on this file. zigbee-herdsman-converters could not be
// installed in the sandbox this was written in (no network access to npm), so this converter has
// NOT been loaded into a running zigbee2mqtt instance and has NOT been tried against a real
// device. It is built from two different confidence levels:
//
// 1. CONFIRMED against zigbee-herdsman-converters' own published type declarations and official
//    docs: the external-converter file format itself (an ESM .mjs module in the
//    `external_converters` folder, picked up once `advanced.enable_external_js` is turned on in
//    zigbee2mqtt's configuration -- required on 2.11.0 and newer), the `exposes.text(name, access)`
//    expose (confirmed directly from zigbee-herdsman-converters' exposes.d.ts: a `Text` class and
//    an `eText` factory exported as `text`), and `Zcl.DataType.CHAR_STR === 66` (confirmed directly
//    from zigbee-herdsman's enums.d.ts).
//
// 2. NOT independently confirmed: there is a newer "modernExtend" helper, reportedly named
//    something like `quirkAddEndpointCluster` or `deviceAddCustomCluster`, meant for registering a
//    brand-new custom cluster declaratively. It was seen imported (unused) in a gist by the
//    project's own maintainer, so it likely exists in recent versions, but repeated research could
//    not pin down its exact parameters (how it wants the cluster ID, attribute IDs and types
//    declared), and guessing a call signature for an unverified API risks shipping broken code. So
//    this converter deliberately does NOT use it. Instead it uses the classic, long-stable
//    `fromZigbee`/`toZigbee` pattern that has worked for manufacturer-specific clusters for years:
//    zigbee-herdsman's `endpoint.write()`/`endpoint.read()` accept a raw numeric cluster ID
//    directly (no prior registration needed) and a raw attribute payload of the form
//    `{<attrId>: {value, type}}` for attributes the library has no built-in name for, and an
//    incoming frame for an unnamed cluster is matched here by that same numeric cluster ID rather
//    than a cluster name string. This is the same approach long used by custom converters for
//    manufacturer-specific clusters that have no built-in zigbee-herdsman definition. If a running
//    zigbee2mqtt instance rejects the raw-attribute format below, the fallback is to register the
//    cluster the same way the ZHA quirk does (see ../zha/quirk_zbee154.py) through whatever the
//    installed zigbee-herdsman-converters version actually calls its custom-cluster helper, and
//    switch this file to use it by name once confirmed.
//
// Installation: copy this file into zigbee2mqtt's configured `external_converters` folder (default
// `data/external_converters/`), set `advanced.enable_external_js: true` in `configuration.yaml` if
// not already set, and restart zigbee2mqtt. The device must already be paired (it joins and reports
// Battery/Identify/OTA out of the box with no converter at all -- this file only adds the panel
// text fields and is not required for the device to join).

import {presets as e, access as ea} from 'zigbee-herdsman-converters/lib/exposes';
import * as reporting from 'zigbee-herdsman-converters/lib/reporting';
import * as fz from 'zigbee-herdsman-converters/lib/fromZigbee';

const PANEL_CLUSTER_ID = 0xFC00;
const ATTR_LINE1 = 0x0000;
const ATTR_LINE2 = 0x0001;
const ATTR_LINE3 = 0x0002;
const ATTR_LINE4 = 0x0003;
const ATTR_ACCENT = 0x0004;
const ATTR_TIMEOUTS = 0x0005; // read-only, see docs/PROTOCOL.md
const CHAR_STR = 0x42; // Zcl.DataType.CHAR_STR, confirmed = 66 (0x42) in zigbee-herdsman's enums.d.ts
const UINT8 = 0x20;    // Zcl.DataType.UINT8, confirmed = 32 (0x20) in zigbee-herdsman's enums.d.ts

const attrIdByKey = {line1: ATTR_LINE1, line2: ATTR_LINE2, line3: ATTR_LINE3, line4: ATTR_LINE4};
const accentByName = {normal: 0, yellow: 1, red: 2};
const accentByValue = {0: 'normal', 1: 'yellow', 2: 'red'};

const fzLocal = {
    zbee154_panel_text: {
        cluster: PANEL_CLUSTER_ID, // numeric cluster ID, matched directly since herdsman has no built-in name for 0xFC00
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            // msg.data is keyed by attribute ID when herdsman has no name for the attribute (our
            // case, since 0xFC00 has no built-in definition in zigbee-herdsman).
            const result = {};
            for (const [key, attrId] of Object.entries(attrIdByKey)) {
                if (msg.data.hasOwnProperty(attrId)) result[key] = msg.data[attrId];
            }
            if (msg.data.hasOwnProperty(ATTR_ACCENT)) {
                result.accent = accentByValue[msg.data[ATTR_ACCENT]] ?? 'normal';
            }
            if (msg.data.hasOwnProperty(ATTR_TIMEOUTS)) {
                result.panel_timeouts = msg.data[ATTR_TIMEOUTS];
            }
            return Object.keys(result).length ? result : undefined;
        },
    },
};

const tzLocal = {
    zbee154_panel_text: {
        key: ['line1', 'line2', 'line3', 'line4'],
        convertSet: async (entity, key, value, meta) => {
            const attrId = attrIdByKey[key];
            await entity.write(PANEL_CLUSTER_ID, {[attrId]: {value: String(value), type: CHAR_STR}});
            return {state: {[key]: value}};
        },
        convertGet: async (entity, key, meta) => {
            const attrId = attrIdByKey[key];
            await entity.read(PANEL_CLUSTER_ID, [attrId]);
        },
    },
    zbee154_panel_accent: {
        key: ['accent'],
        convertSet: async (entity, key, value, meta) => {
            const raw = accentByName.hasOwnProperty(value) ? accentByName[value] : 0;
            await entity.write(PANEL_CLUSTER_ID, {[ATTR_ACCENT]: {value: raw, type: UINT8}});
            return {state: {accent: accentByValue[raw]}};
        },
        convertGet: async (entity, key, meta) => {
            await entity.read(PANEL_CLUSTER_ID, [ATTR_ACCENT]);
        },
    },
    zbee154_panel_timeouts: {
        key: ['panel_timeouts'],
        convertGet: async (entity, key, meta) => {
            await entity.read(PANEL_CLUSTER_ID, [ATTR_TIMEOUTS]);
        },
    },
};

const definition = {
    zigbeeModel: ['ZBee154'], // matches ZCL_BASIC_MODEL_ID in firmware/src/board_zbee154.h
    model: 'ZBee154',
    vendor: 'steanlab',
    description: 'Zigbee e-paper tag (Hanshow Nebular 154), four text lines plus a colour accent ' +
        'on cluster 0xFC00. Not yet verified against real hardware or a running zigbee2mqtt ' +
        'instance, see the comment block at the top of this file.',
    fromZigbee: [fz.battery, fzLocal.zbee154_panel_text],
    toZigbee: [tzLocal.zbee154_panel_text, tzLocal.zbee154_panel_accent, tzLocal.zbee154_panel_timeouts],
    exposes: [
        e.battery(),
        e.text('line1', ea.ALL).withDescription('Line 1 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.text('line2', ea.ALL).withDescription('Line 2 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.text('line3', ea.ALL).withDescription('Line 3 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.text('line4', ea.ALL).withDescription('Line 4 shown on the panel (uppercase ASCII, up to 16 characters)'),
        e.enum('accent', ea.ALL, ['normal', 'yellow', 'red'])
            .withDescription('Text colour for all four lines at once (background stays white)'),
        // ea.STATE_GET (state reporting plus an on-demand read, no write) is the long-standing
        // zigbee-herdsman-converters access level for a read-only sensor like this one. Not
        // re-fetched against the library's own source for this specific addition (web access was
        // unavailable when this was written) -- if a running instance rejects it, ea.GET alone
        // (report-only, no on-demand read) is the safe fallback.
        e.numeric('panel_timeouts', ea.STATE_GET).withValueMin(0).withValueMax(6)
            .withDescription('Diagnostic: how many panel BUSY waits have timed out (0 = healthy). Read-only on the device'),
    ],
    configure: async (device, coordinatorEndpoint, logger) => {
        const endpoint = device.getEndpoint(1);
        await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
        await reporting.batteryPercentageRemaining(endpoint);
        // No binding/reporting is set up for the panel cluster: it is written to, not reported from,
        // in normal use (the coordinator pushes text, the device does not spontaneously change it).
    },
};

export default definition;
