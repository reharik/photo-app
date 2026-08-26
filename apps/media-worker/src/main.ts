// main.ts
import { setDefaultSerializationMode } from '@reharik/smart-enum';
import dotenv from 'dotenv';
import { createWorkerContainer } from './container';

setDefaultSerializationMode('value');

const bootstrap = async () => {
  dotenv.config();
  const container = createWorkerContainer(); // AwilixContainer<AppCradle>
  await container.cradle.app();
};

void bootstrap();
