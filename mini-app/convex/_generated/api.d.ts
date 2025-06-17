/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as crons from "../crons.js";
import type * as entity_activeStream from "../entity/activeStream.js";
import type * as entity_follow from "../entity/follow.js";
import type * as entity_message from "../entity/message.js";
import type * as entity_stream from "../entity/stream.js";
import type * as http from "../http.js";
import type * as login from "../login.js";
import type * as siwe from "../siwe.js";
import type * as siweHttpActions from "../siweHttpActions.js";
import type * as worldcoin from "../worldcoin.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "entity/activeStream": typeof entity_activeStream;
  "entity/follow": typeof entity_follow;
  "entity/message": typeof entity_message;
  "entity/stream": typeof entity_stream;
  http: typeof http;
  login: typeof login;
  siwe: typeof siwe;
  siweHttpActions: typeof siweHttpActions;
  worldcoin: typeof worldcoin;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
