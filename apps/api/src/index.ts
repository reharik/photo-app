import dotenv from 'dotenv';
import { createAppContainer } from './container';

const bootstrap = async () => {
  dotenv.config();
  const container = createAppContainer(); // AwilixContainer<AppCradle>
  await container.cradle.attachGlobalHandlers(container);
  await container.cradle.app();
};

void bootstrap();
