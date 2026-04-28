import type { FC } from 'react';
import type { TemplateData, TemplateName } from '../types.js';
import Digest, { subject as digestSubject } from './digest.js';
import ShareInvite, { subject as shareInviteSubject } from './share-invite.js';
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
  'share-invite': { Component: ShareInvite, getSubject: shareInviteSubject },
  digest: { Component: Digest, getSubject: digestSubject },
};
