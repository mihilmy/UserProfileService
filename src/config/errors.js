module.exports = {
  //Auth erors
  AUTH_INVALID_EMAIL: 'auth/invalid-email',
  AUTH_INVALID_PHONE_NUMBER: 'auth/invalid-phone-number',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_UID_ALREADY_EXISTS: 'auth/uid-already-exists',
  AUTH_EMAIL_ALREADY_EXISTS: 'auth/email-already-exists',
  AUTH_PHONE_ALREADY_EXISTS: 'auth/phone-number-already-exists',
  AUTH_PHONE_NOT_CACHED: 'auth/phone-number-not-cached',
  AUTH_VERIFICATION_CODE_MISMATCH: 'auth/phone-verification-code-mismatch',
  AUTH_INVALID_SESSION_ID: 'auth/invalid-session-id',
  AUTH_INVALID_PAGE_TOKEN: 'auth/invalid-page-token',
  AUTH_UNAUTHORIZED_ACCESS: 'auth/unauthorized-access-into-api',
  AUTH_UNABLE_TO_EXTRACT_SESSION_ID_FROM_AUTH_HEADER: 'auth/unable-to-extract-session-id-from-auth-header',
  AUTH_TWITTER_REQUEST_TOKEN_FAILURE: 'auth/twitter-request-token-failure',
  //App Errors
  APP_NETWORK_ERROR: 'app/network-error', 
  APP_NETWORK_TIMEOUT: 'app/network-timeout',
  APP_UNABLE_TO_PARSE_RESPONSE: 'app/unable-to-parse-response',
  APP_FIREBASE_DATABASE_ERROR: 'app/firebase-database-error',
  APP_FIREBASE_STORAGE_ERROR: 'app/firebase-storage-error',
  //Request Errors
  MISSING_BODY_ATTRIBUTES: 'request/missing-body-attributes',
  //Profile Errors
  MAX_NUMBER_OF_PROFILES_REACHED: 'profile/max-number-of-profiles-are-being-used',
  NO_PROFILE_FOUND_FOR_NUMBER: 'profile/no-profile-was-found-for-the-profile-number-passed',
};