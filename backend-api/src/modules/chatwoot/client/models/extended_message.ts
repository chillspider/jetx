/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { generic_id } from './generic_id';
import type { message } from './message';

export type extended_message = generic_id &
  message & {
    source_id?: number;
    sender?: any;
  };
