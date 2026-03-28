# traveller-map-mcp

An MCP (Model Context Protocol) server that wraps the [Traveller Map API](https://travellermap.com/doc/api), giving Claude and other MCP clients access to the Traveller universe's sector data, world information, maps, and route-finding tools.

## Tools

| Tool | Description |
|------|-------------|
| `get_subsector_map` | Fetch a PNG subsector map; optionally save to a local directory |
| `render_custom_map` | Render a map from custom SEC-format world data |
| `get_world_info` | World details with UWP fully decoded into human-readable fields |
| `search_worlds` | Search by name, trade codes, allegiance, zone, or UWP pattern |
| `get_jump_map` | PNG jump map centered on a world showing reachable systems |
| `find_route` | Find a jump route between two worlds |
| `get_worlds_in_jump_range` | List all worlds reachable within N parsecs |
| `get_sector_list` | List all known sectors with coordinates |
| `get_sector_data` | Bulk world records for a full sector |
| `get_sector_metadata` | Subsector names (A–P), borders, and political structure |
| `get_allegiance_list` | All allegiance codes with full names |

## Requirements

- Node.js 23+
- Claude Desktop (or any MCP-compatible client)

## Installation

```bash
git clone git@github.com:shammond42/traveller-map-mcp.git
cd traveller-map-mcp
npm install
npm run build
```

## Claude Desktop Setup

Add the following to your `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "traveller-map": {
      "command": "node",
      "args": ["/absolute/path/to/traveller-map-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The tools will appear in the hammer icon menu in the chat input.

## Example Usage

**Get a subsector map and save it to your Obsidian vault:**
```
Show me the Regina subsector map and save it to /Users/me/ObsidianVault/attachments
```

**Decode a world's UWP:**
```
What is the UWP for Regina in Spinward Marches?
```

**Search for worlds:**
```
Find me all water worlds in Tobia subsector
```

**Find a jump route:**
```
Find a jump-2 route from Spinward Marches 1910 to Core 2118, avoiding Red zones
```

**Search query syntax** (for `search_worlds`):
- Plain name: `Regina` or with wildcards `Reg*`
- Trade code: `remark:Wa` (water worlds), `remark:Ri` (rich), `remark:In` (industrial)
- Allegiance: `alleg:Im` (Third Imperium), `alleg:Zh` (Zhodani)
- Travel zone: `zone:R` (Red), `zone:A` (Amber)
- UWP pattern: `uwp:A????[89A]-` (excellent starport, high population)

## Development

```bash
npm run dev   # watch mode — recompiles on file changes
npm run build # single build
```

## Data Source

All data is sourced from [travellermap.com](https://travellermap.com), a community resource for the Traveller tabletop RPG. The Traveller Map API is free to use; please be considerate and avoid hammering it with bulk requests.

Traveller is a registered trademark of Far Future Enterprises. This project is not affiliated with or endorsed by Far Future Enterprises or travellermap.com.

## License

MIT
