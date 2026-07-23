import type { FC } from 'react';
import type { TemplateData, TemplateName } from '../types';
import ActivityDigest, { subject as activityDigestSubject } from './ActivityDigest';
import GuestAlbumShared, { subject as guestAlbumSharedSubject } from './guestAlbumShared';
import MemberAlbumShared, { subject as memberAlbumSharedSubject } from './memberAlbumShared';
import MemberItemsShared, { subject as memberItemsSharedSubject } from './memberItemsShared';
import PasswordChanged, { subject as passwordChangedSubject } from './passwordChanged';
import VerificationCode, { subject as verificationCodeSubject } from './verificationCode';
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
  memberAlbumShared: { Component: MemberAlbumShared, getSubject: memberAlbumSharedSubject },
  guestAlbumShared: { Component: GuestAlbumShared, getSubject: guestAlbumSharedSubject },
  memberItemsShared: { Component: MemberItemsShared, getSubject: memberItemsSharedSubject },
  activityDigest: { Component: ActivityDigest, getSubject: activityDigestSubject },
  passwordChanged: { Component: PasswordChanged, getSubject: passwordChangedSubject },
  verificationCode: { Component: VerificationCode, getSubject: verificationCodeSubject },
};
