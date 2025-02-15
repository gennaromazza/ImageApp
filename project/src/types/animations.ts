export type IntroAnimationType = 'curtain' | 'fade' | 'slide';
export type TicketStampType = 'classic' | 'modern' | 'vintage';

export interface AnimationSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  type: IntroAnimationType;
}