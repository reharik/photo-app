import type { FC } from 'react';
import type { TemplateData, TemplateName } from '../types';
import ActivityDigest, { subject as activityDigestSubject } from './ActivityDigest';
import AlbumGuestInvite, { subject as albumGuestInviteSubject } from './albumGuestInvite';
import AlbumShareInvite, { subject as albumShareInviteSubject } from './albumShareInvite';
import EmailVerification, { subject as emailVerificationSubject } from './emailVerification';
import ItemShareInvite, { subject as itemShareInviteSubject } from './itemShareInvite';
import PasswordReset, { subject as passwordResetSubject } from './passwordReset';
import Welcome, { subject as welcomeSubject } from './welcome';

type RegistryEntry<K extends TemplateName> = {
  Component: FC<TemplateData[K]>;
  getSubject: (data: TemplateData[K]) => string;
};

export type TemplateRegistry = {
  [K in TemplateName]: RegistryEntry<K>;
};

export const templateRegistry: TemplateRegistry = {
  welcome: { Component: Welcome, getSubject: welcomeSubject },
  albumShareInvite: { Component: AlbumShareInvite, getSubject: albumShareInviteSubject },
  albumGuestInvite: { Component: AlbumGuestInvite, getSubject: albumGuestInviteSubject },
  itemShareInvite: { Component: ItemShareInvite, getSubject: itemShareInviteSubject },
  activityDigest: { Component: ActivityDigest, getSubject: activityDigestSubject },
  passwordReset: { Component: PasswordReset, getSubject: passwordResetSubject },
  emailVerification: { Component: EmailVerification, getSubject: emailVerificationSubject },
};
