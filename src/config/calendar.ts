// Google Calendar configuration
export const GOOGLE_CONFIG = {
  clientId: '164337596330-todg1eiufp3sb6h4aotrnq6srh06a478.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: `${window.location.origin}/calendar/callback`,
  scopes: ['https://www.googleapis.com/auth/calendar.events']
};

// Calendar settings
export const CALENDAR_SETTINGS = {
  defaultDuration: 60, // minutes
  defaultReminder: 60, // minutes before event
  timeZone: 'Europe/Rome'
};