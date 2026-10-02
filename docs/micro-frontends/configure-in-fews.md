# Configure a Micro Frontend in FEWS

Configure a microfrontend in two places:

1. Register it in `Config/DisplayConfigFiles/WebOCMicroFrontends.xml`.
2. Reference its ID from a node in `Config/RegionConfigFiles/Topology.xml`.

All settings on a topology node are passed to the microfrontend in a Vue prop named `topologyNode`. The component can read any of these settings from that prop; they do not need to be declared again as individual props.

## Register the microfrontend

Add a `<microFrontEnd>` entry to `WebOCMicroFrontends.xml`. Set `<id>` to a unique FEWS configuration ID. The `<remoteId>` must match the remote ID configured in WebOC's Module Federation manifest configuration. The `<componentId>` must match a component exposed in the micro-frontend remote's manifest. These identifiers must match exactly. The optional `<icon>` sets the menu icon.

For now, the only supported display value is `main`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<webOCMicroFrontEnds xmlns="http://www.wldelft.nl/fews"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.wldelft.nl/fews http://fews.wldelft.nl/schemas/version1.0/webOCMicroFrontEnds.xsd">
  <microFrontEnd>
    <id>mf-example</id>
    <icon>mdi-earth</icon>
    <remoteId>example-remote</remoteId>
    <componentId>example_component</componentId>
    <display>main</display>
  </microFrontEnd>
</webOCMicroFrontEnds>
```

When adding an entry to an existing file, keep its existing root element and add only the `<microFrontEnd>` block.

## Configure a Filter

A FEWS Filter defines a reusable selection of FEWS data, such as the locations used by a view. Reference the configured Filter ID in the topology node's `filterIds`; the microfrontend can pass that ID as `filterId` in PI location or time-series requests. This lets the same remote component use different FEWS data selections through topology configuration.

See the FEWS documentation on [Filter configuration](https://publicwiki.deltares.nl/display/FEWSDOC/Filter+configuration) for details.
