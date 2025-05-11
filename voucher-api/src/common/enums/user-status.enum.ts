export enum UserStatus {
  ACTIVE = 'active', // User has completed all onboarding steps and is fully active.
  INACTIVE = 'inactive', // User has created an account but hasn't verified email
  SUSPENDED = 'suspended', // User has been temporarily suspended due to violations or other reasons.
  BANNED = 'banned', // User has been permanently banned from the platform.
}
