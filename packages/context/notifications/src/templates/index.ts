import type { FC } from 'react';
import type { TemplateData, TemplateName } from '../types';
import AlbumActivity, { subject as albumActivitySubject } from './albumActivity';
import ForgotPassword, { subject as forgotPasswordSubject } from './forgotPassword';
import PasswordReset, { subject as passwordResetSubject } from './passwordReset';
import PublicShare, { subject as publicShareSubject } from './publicShare';
import ShareInvite, { subject as shareInviteSubject } from './shareInvite';
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
  shareInvite: { Component: ShareInvite, getSubject: shareInviteSubject },
  albumActivity: { Component: AlbumActivity, getSubject: albumActivitySubject },
  passwordReset: { Component: PasswordReset, getSubject: passwordResetSubject },
  forgotPassword: { Component: ForgotPassword, getSubject: forgotPasswordSubject },
  publicShare: { Component: PublicShare, getSubject: publicShareSubject },
};
