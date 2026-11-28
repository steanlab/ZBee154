"""ZHA quirk for ZBee154 (Hanshow Nebular 154 Zigbee e-paper tag, steanlab)."""

import zigpy.types as t
from zigpy.quirks import CustomCluster
from zigpy.quirks.v2 import QuirkBuilder
from zigpy.zcl import foundation
from zigpy.zcl.foundation import ZCLAttributeDef


class ZBee154PanelAccent(t.enum8):
    """Text colour for all four lines at once (background always stays white)."""

    Normal = 0x00
    Yellow = 0x01
    Red = 0x02


class ZBee154PanelLed(t.enum8):
    """Short LED pulse-blink notification colour (auto-stops after 5 seconds)."""

    Off = 0x00
    Red = 0x01
    Green = 0x02
    Blue = 0x03
    Yellow = 0x04


class ZBee154PanelCluster(CustomCluster):
    """Cluster 0xFC00: e-paper panel text/accent, timeouts, raw temp, invert, and LED notifications."""

    cluster_id = 0xFC00
    name = "ZBee154 Panel"
    ep_attribute = "zbee154_panel"
    manufacturer_id_override = foundation.ZCLHeader.NO_MANUFACTURER_ID

    class AttributeDefs(CustomCluster.AttributeDefs):
        line1 = ZCLAttributeDef(
            id=0x0000, type=t.CharacterString, access="rw", is_manufacturer_specific=False
        )
        line2 = ZCLAttributeDef(
            id=0x0001, type=t.CharacterString, access="rw", is_manufacturer_specific=False
        )
        line3 = ZCLAttributeDef(
            id=0x0002, type=t.CharacterString, access="rw", is_manufacturer_specific=False
        )
        line4 = ZCLAttributeDef(
            id=0x0003, type=t.CharacterString, access="rw", is_manufacturer_specific=False
        )
        accent = ZCLAttributeDef(
            id=0x0004, type=ZBee154PanelAccent, access="rw", is_manufacturer_specific=False
        )
        panel_timeouts = ZCLAttributeDef(
            id=0x0005, type=t.uint8_t, access="r", is_manufacturer_specific=False
        )
        notify_led = ZCLAttributeDef(
            id=0x0006, type=ZBee154PanelLed, access="rw", is_manufacturer_specific=False
        )
        panel_temp_raw = ZCLAttributeDef(
            id=0x0007, type=t.uint16_t, access="r", is_manufacturer_specific=False
        )
        invert = ZCLAttributeDef(
            id=0x0008, type=t.Bool, access="rw", is_manufacturer_specific=False
        )


(
    QuirkBuilder("steanlab", "ZBee154")
    .replaces(ZBee154PanelCluster, endpoint_id=1)
    .enum(
        "accent",
        ZBee154PanelAccent,
        cluster_id=ZBee154PanelCluster.cluster_id,
        endpoint_id=1,
        translation_key="accent",
        fallback_name="Accent",
    )
    .enum(
        "notify_led",
        ZBee154PanelLed,
        cluster_id=ZBee154PanelCluster.cluster_id,
        endpoint_id=1,
        translation_key="notify_led",
        fallback_name="Notify LED",
    )
    .switch(
        "invert",
        cluster_id=ZBee154PanelCluster.cluster_id,
        endpoint_id=1,
        translation_key="invert",
        fallback_name="Invert",
    )
    .sensor(
        "panel_timeouts",
        cluster_id=ZBee154PanelCluster.cluster_id,
        endpoint_id=1,
        translation_key="panel_timeouts",
        fallback_name="Panel timeouts",
    )
    .sensor(
        "panel_temp_raw",
        cluster_id=ZBee154PanelCluster.cluster_id,
        endpoint_id=1,
        translation_key="panel_temp_raw",
        fallback_name="Panel temp raw",
    )
    .add_to_registry()
)
