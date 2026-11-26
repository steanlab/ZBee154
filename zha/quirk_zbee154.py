"""ZHA quirk for ZBee154 (Hanshow Nebular 154 Zigbee e-paper tag, steanlab).

Registers the custom manufacturer-specific cluster 0xFC00, which carries the four text lines,
the colour accent, and the timeout diagnostic counter shown on the e-paper panel
(see ../docs/PROTOCOL.md).

Installation: copy this file into Home Assistant's configured custom quirks folder,
restart Home Assistant, then re-pair or reconfigure the device.
"""

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


class ZBee154PanelCluster(CustomCluster):
    """Cluster 0xFC00: the four text lines and colour accent shown on the e-paper panel."""

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


# "steanlab" / "ZBee154" match this device's own ZCL_BASIC_MFG_NAME / ZCL_BASIC_MODEL_ID
# (see ../firmware/src/board_zbee154.h).
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
    .sensor(
        "panel_timeouts",
        cluster_id=ZBee154PanelCluster.cluster_id,
        endpoint_id=1,
        translation_key="panel_timeouts",
        fallback_name="Panel timeouts",
    )
    .add_to_registry()
)
