import { appConfig } from '../config/appConfig';
import { isFirebaseConfigured } from '../services/firebase/firebaseConfig';
import { createFirestoreRepositories } from './firestoreRepositories';
import { createMockRepositories } from './mockRepositories';
import { RepositoryRegistry } from './types';

let repositories: RepositoryRegistry | null = null;

export const getRepositories = (): RepositoryRegistry => {
  if (repositories) return repositories;

  repositories =
    appConfig.flags.useRealDatabase && isFirebaseConfigured()
      ? createFirestoreRepositories()
      : createMockRepositories();

  return repositories;
};

export const resetRepositoryRegistryForTests = (): void => {
  repositories = null;
};

export type { RepositoryRegistry } from './types';
