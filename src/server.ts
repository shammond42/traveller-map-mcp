import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import * as getSubsectorMap from './tools/get_subsector_map.js';
import * as renderCustomMap from './tools/render_custom_map.js';
import * as getWorldInfo from './tools/get_world_info.js';
import * as searchWorlds from './tools/search_worlds.js';
import * as getJumpMap from './tools/get_jump_map.js';
import * as findRoute from './tools/find_route.js';
import * as getWorldsInJumpRange from './tools/get_worlds_in_jump_range.js';
import * as getSectorList from './tools/get_sector_list.js';
import * as getSectorData from './tools/get_sector_data.js';
import * as getSectorMetadata from './tools/get_sector_metadata.js';
import * as getAllegianceList from './tools/get_allegiance_list.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'traveller-map',
    version: '1.0.0',
  });

  server.registerTool(
    getSubsectorMap.name,
    { description: getSubsectorMap.description, inputSchema: getSubsectorMap.inputSchema.shape },
    (args) => getSubsectorMap.handler(args as getSubsectorMap.Input),
  );

  server.registerTool(
    renderCustomMap.name,
    { description: renderCustomMap.description, inputSchema: renderCustomMap.inputSchema.shape },
    (args) => renderCustomMap.handler(args as renderCustomMap.Input),
  );

  server.registerTool(
    getWorldInfo.name,
    { description: getWorldInfo.description, inputSchema: getWorldInfo.inputSchema.shape },
    (args) => getWorldInfo.handler(args as getWorldInfo.Input),
  );

  server.registerTool(
    searchWorlds.name,
    { description: searchWorlds.description, inputSchema: searchWorlds.inputSchema.shape },
    (args) => searchWorlds.handler(args as searchWorlds.Input),
  );

  server.registerTool(
    getJumpMap.name,
    { description: getJumpMap.description, inputSchema: getJumpMap.inputSchema.shape },
    (args) => getJumpMap.handler(args as getJumpMap.Input),
  );

  server.registerTool(
    findRoute.name,
    { description: findRoute.description, inputSchema: findRoute.inputSchema.shape },
    (args) => findRoute.handler(args as findRoute.Input),
  );

  server.registerTool(
    getWorldsInJumpRange.name,
    { description: getWorldsInJumpRange.description, inputSchema: getWorldsInJumpRange.inputSchema.shape },
    (args) => getWorldsInJumpRange.handler(args as getWorldsInJumpRange.Input),
  );

  server.registerTool(
    getSectorList.name,
    { description: getSectorList.description, inputSchema: getSectorList.inputSchema.shape },
    (args) => getSectorList.handler(args as getSectorList.Input),
  );

  server.registerTool(
    getSectorData.name,
    { description: getSectorData.description, inputSchema: getSectorData.inputSchema.shape },
    (args) => getSectorData.handler(args as getSectorData.Input),
  );

  server.registerTool(
    getSectorMetadata.name,
    { description: getSectorMetadata.description, inputSchema: getSectorMetadata.inputSchema.shape },
    (args) => getSectorMetadata.handler(args as getSectorMetadata.Input),
  );

  server.registerTool(
    getAllegianceList.name,
    { description: getAllegianceList.description, inputSchema: getAllegianceList.inputSchema.shape },
    (args) => getAllegianceList.handler(args as getAllegianceList.Input),
  );

  return server;
}
