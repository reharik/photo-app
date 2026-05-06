import { coreLogger, Logger } from '@packages/infrastructure';
import { IocGeneratedCradle } from '../../di/generated/ioc-registry.types';

export const build__Logger = ({ config }: IocGeneratedCradle): Logger =>
  coreLogger({
    logJsonFilePath: config.logJsonFilePath,
    logLevel: config.logLevel,
  });
