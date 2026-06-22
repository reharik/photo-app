import type { FC } from 'react';
import type { TemplateData, TemplateName } from '../types.js';
import Digest, { subject as digestSubject } from './digest.js';
import ForgotPassword, { subject as forgotPasswordSubject } from './forgotPassword.js';
import PasswordReset, { subject as passwordResetSubject } from './passwordReset.js';
import PublicShare, { subject as publicShareSubject } from './publicShare.js';
import ShareInvite, { subject as shareInviteSubject } from './shareInvite.js';
import Welcome, { subject as welcomeSubject } from './welcome.js';

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
  digest: { Component: Digest, getSubject: digestSubject },
  passwordReset: { Component: PasswordReset, getSubject: passwordResetSubject },
  forgotPassword: { Component: ForgotPassword, getSubject: forgotPasswordSubject },
  publicShare: { Component: PublicShare, getSubject: publicShareSubject },
};
