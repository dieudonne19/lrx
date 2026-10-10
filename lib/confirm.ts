import { Alert } from 'react-native';

export function confirmDeleteProject(title: string, onConfirm: () => void) {
  Alert.alert(`Supprimer "${title}" ?`, 'Les paroles et les timestamps seront perdus. Cette action est definitive.', [
    { text: 'Garder', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
  ]);
}
