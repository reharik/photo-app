// main.ts
import { setDefaultSerializationMode } from '@reharik/smart-enum';
import dotenv from 'dotenv';
import { createWorkerContainer } from './container';

setDefaultSerializationMode('value');

const bootstrap = async () => {
  dotenv.config();
  const container = createWorkerContainer();
  await container.cradle.app(container);
};

void bootstrap();
