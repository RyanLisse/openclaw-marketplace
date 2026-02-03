/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_chain from "../actions/chain.js";
import type * as actions_openai from "../actions/openai.js";
import type * as agents from "../agents.js";
import type * as apiKeys from "../apiKeys.js";
import type * as apis from "../apis.js";
import type * as asyncOperations from "../asyncOperations.js";
import type * as auth from "../auth.js";
import type * as clawTasks from "../clawTasks.js";
import type * as cleanup from "../cleanup.js";
import type * as configs from "../configs.js";
import type * as contracts from "../contracts.js";
import type * as crons from "../crons.js";
import type * as disputes from "../disputes.js";
import type * as intents from "../intents.js";
import type * as lib_contextBuilder from "../lib/contextBuilder.js";
import type * as lib_promptLoader from "../lib/promptLoader.js";
import type * as lib_seedConfigs from "../lib/seedConfigs.js";
import type * as matches from "../matches.js";
import type * as matching from "../matching.js";
import type * as moltbook from "../moltbook.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as ranking from "../ranking.js";
import type * as referrals from "../referrals.js";
import type * as reputation from "../reputation.js";
import type * as security from "../security.js";
import type * as skills from "../skills.js";
import type * as templates from "../templates.js";
import type * as transactions from "../transactions.js";
import type * as userPreferences from "../userPreferences.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/chain": typeof actions_chain;
  "actions/openai": typeof actions_openai;
  agents: typeof agents;
  apiKeys: typeof apiKeys;
  apis: typeof apis;
  asyncOperations: typeof asyncOperations;
  auth: typeof auth;
  clawTasks: typeof clawTasks;
  cleanup: typeof cleanup;
  configs: typeof configs;
  contracts: typeof contracts;
  crons: typeof crons;
  disputes: typeof disputes;
  intents: typeof intents;
  "lib/contextBuilder": typeof lib_contextBuilder;
  "lib/promptLoader": typeof lib_promptLoader;
  "lib/seedConfigs": typeof lib_seedConfigs;
  matches: typeof matches;
  matching: typeof matching;
  moltbook: typeof moltbook;
  notifications: typeof notifications;
  presence: typeof presence;
  ranking: typeof ranking;
  referrals: typeof referrals;
  reputation: typeof reputation;
  security: typeof security;
  skills: typeof skills;
  templates: typeof templates;
  transactions: typeof transactions;
  userPreferences: typeof userPreferences;
  votes: typeof votes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
