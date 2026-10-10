import { router } from 'expo-router';

export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}

export function openEditor(projectId: string) {
  router.push({ pathname: '/editor/[projectId]', params: { projectId } });
}
