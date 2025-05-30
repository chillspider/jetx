/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { message } from './message';

export type public_conversation = {
  /**
   * Id of the conversation
   */
  id?: number;
  /**
   * The inbox id of the conversation
   */
  inbox_id?: string;
  /**
   * Messages in the conversation
   */
  messages?: Array<message>;
  /**
   * The contact information associated to the conversation
   */
  contact?: any;
};
